import { spawn } from "node:child_process";
import { mkdir, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import { renderCaptionSet, type CaptionStyle } from "./caption-image";
import type { CaptionGroup, CutPlan, RenderResult } from "./types";

export const OUT_WIDTH = 1080;
export const OUT_HEIGHT = 1920;

export type ProbeResult = {
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
};

function run(cmd: string, args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      reject(new Error(`${cmd} could not be started: ${e.message}`)),
    );
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      // ffmpeg writes everything to stderr, so the tail is the useful part.
      else reject(new Error(`${cmd} exit ${code}\n${err.split("\n").slice(-25).join("\n")}`));
    });
  });
}

export async function probe(input: string): Promise<ProbeResult> {
  const raw = await run("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    input,
  ]);
  const json = JSON.parse(raw);
  const video = json.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
  if (!video) throw new Error("No video track found in the file.");

  return {
    duration: Number(json.format?.duration ?? 0),
    width: Number(video.width ?? 0),
    height: Number(video.height ?? 0),
    hasAudio: Boolean(json.streams?.some((s: { codec_type: string }) => s.codec_type === "audio")),
  };
}

/**
 * Strips the video track before transcription. A phone clip is tens of megabytes;
 * the mono 64k mp3 is a rounding error and uploads in a second.
 */
export async function extractAudio(input: string, outFile: string): Promise<string> {
  await mkdir(path.dirname(outFile), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-i", path.resolve(input),
    "-vn",
    "-ac", "1",
    "-ar", "16000",
    "-b:a", "64k",
    path.resolve(outFile),
  ]);
  return outFile;
}

/** `between(t,a,b)+between(t,c,d)` — summed terms act as a logical OR in ffmpeg. */
function selectExpr(plan: CutPlan): string {
  return plan.keep
    .map((s) => `between(t,${s.start.toFixed(3)},${s.end.toFixed(3)})`)
    .join("+");
}

export type RenderOptions = {
  input: string;
  plan: CutPlan;
  captions: CaptionGroup[];
  /** Directory the finished mp4 is written to. */
  outDir: string;
  /** URL path the file is served from, used to build publicUrl. */
  urlPrefix: string;
  slug: string;
  hasAudio: boolean;
  burnCaptions?: boolean;
  captionStyle?: Partial<CaptionStyle>;
};

export async function renderVertical(options: RenderOptions): Promise<RenderResult> {
  const {
    input,
    plan,
    captions,
    outDir,
    urlPrefix,
    slug,
    hasAudio,
    burnCaptions = true,
  } = options;

  const workDir = path.join(outDir, `.${slug}-work`);
  await mkdir(outDir, { recursive: true });
  await mkdir(workDir, { recursive: true });

  const outFile = path.join(outDir, `${slug}.mp4`);
  const assets =
    burnCaptions && captions.length > 0
      ? renderCaptionSet(captions, OUT_WIDTH, OUT_HEIGHT, options.captionStyle)
      : [];

  await Promise.all(assets.map((a) => writeFile(path.join(workDir, a.name), a.png)));

  const expr = selectExpr(plan);
  const base = [
    `[0:v]select='${expr}'`,
    "setpts=N/FRAME_RATE/TB",
    `scale=${OUT_WIDTH}:${OUT_HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${OUT_WIDTH}:${OUT_HEIGHT}`,
  ].join(",");

  const chains: string[] = [];
  let label = "base";
  chains.push(`${base}[${label}]`);

  // overlay's default repeatlast holds the single PNG frame for the whole clip,
  // so `enable` alone decides when a caption is visible.
  assets.forEach((a, i) => {
    const next = i === assets.length - 1 ? "v" : `ov${i}`;
    chains.push(
      `[${label}][${i + 1}:v]overlay=0:0:format=auto:` +
        `enable='between(t,${a.group.start.toFixed(3)},${a.group.end.toFixed(3)})'[${next}]`,
    );
    label = next;
  });
  if (assets.length === 0) chains[0] = `${base}[v]`;

  if (hasAudio) chains.push(`[0:a]aselect='${expr}',asetpts=N/SR/TB[a]`);

  const args = [
    "-y",
    "-i", path.resolve(input),
    ...assets.flatMap((a) => ["-i", path.join(workDir, a.name)]),
    "-filter_complex", chains.join(";"),
    "-map", "[v]",
    ...(hasAudio ? ["-map", "[a]"] : []),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "21",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    // Instagram is strict about pixel format and audio sample rate; this is the safe set.
    ...(hasAudio ? ["-c:a", "aac", "-b:a", "128k", "-ar", "44100"] : []),
    "-movflags", "+faststart",
    path.resolve(outFile),
  ];

  try {
    await run("ffmpeg", args);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  const info = await probe(outFile);
  const size = await stat(outFile);

  return {
    path: outFile,
    publicUrl: `${urlPrefix}/${slug}.mp4`,
    width: info.width,
    height: info.height,
    duration: info.duration,
    sizeBytes: size.size,
  };
}
