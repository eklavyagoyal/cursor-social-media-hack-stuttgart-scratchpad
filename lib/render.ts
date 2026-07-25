import { spawn } from "node:child_process";
import { mkdir, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import { renderCaptionSet, type CaptionStyle } from "./caption-image";
import type { CaptionGroup, CutPlan, RenderResult } from "./types";

export const OUT_WIDTH = 1080;
export const OUT_HEIGHT = 1920;

/**
 * Every take is levelled to the same loudness before it is joined.
 *
 * Without this a mixed reel jumps: a phone recording lands around −15 LUFS while a
 * generated voice comes back near −25, and the join makes that a 10 dB drop in the
 * middle of the reel. −16 LUFS is the level the social platforms normalise toward,
 * so matching it here also means they leave the audio alone.
 *
 * `speechnorm` rather than `loudnorm`: single-pass loudnorm measures as it goes and
 * mangles the first second of a short clip, and our takes are three to six seconds.
 *
 * The peak target stays below full scale on purpose. Instagram re-encodes whatever
 * it is handed, and a lossy encoder fed a signal that already touches 0 dBFS is
 * where audible distortion comes from — headroom here costs nothing.
 */
const LEVEL_AUDIO = "speechnorm=e=10:r=0.0005:p=0.85:l=1";

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

  if (hasAudio) chains.push(`[0:a]aselect='${expr}',asetpts=N/SR/TB,${LEVEL_AUDIO}[a]`);

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

export type VoiceoverOptions = {
  /** The filmed clip. Its own audio, if any, is discarded. */
  input: string;
  /** The spoken line from lib/voice.ts. */
  audio: string;
  /** Length of the spoken line — this, not the clip, decides the output length. */
  audioDuration: number;
  captions: CaptionGroup[];
  outDir: string;
  urlPrefix: string;
  slug: string;
  burnCaptions?: boolean;
  captionStyle?: Partial<CaptionStyle>;
};

/**
 * Renders a clip against a generated voice instead of its own audio.
 *
 * The voice sets the length and the picture follows. The alternative — stretching
 * the audio to fit the footage — is audible immediately, and a voice that sounds
 * processed defeats the point of using a good one.
 *
 * Footage shorter than the line is looped rather than frozen on its last frame:
 * b-roll is the whole reason this path exists, and a still frame reads as a
 * playback failure. `-stream_loop -1` with `-t` handles both directions in one
 * code path — long footage is trimmed, short footage repeats.
 *
 * There is no cut plan here. A generated line has no dead air and no filler to
 * remove, so the cutter would have nothing to do.
 */
export async function renderVoiceover(options: VoiceoverOptions): Promise<RenderResult> {
  const {
    input,
    audio,
    audioDuration,
    captions,
    outDir,
    urlPrefix,
    slug,
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

  const base = [
    "[0:v]setpts=N/FRAME_RATE/TB",
    `scale=${OUT_WIDTH}:${OUT_HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${OUT_WIDTH}:${OUT_HEIGHT}`,
  ].join(",");

  const chains: string[] = [];
  let label = "base";
  chains.push(`${base}[${label}]`);

  assets.forEach((a, i) => {
    const next = i === assets.length - 1 ? "v" : `ov${i}`;
    chains.push(
      `[${label}][${i + 2}:v]overlay=0:0:format=auto:` +
        `enable='between(t,${a.group.start.toFixed(3)},${a.group.end.toFixed(3)})'[${next}]`,
    );
    label = next;
  });
  if (assets.length === 0) chains[0] = `${base}[v]`;

  // Levelled to the same target as a filmed take, so a mixed reel does not step
  // down in volume the moment the voice takes over.
  chains.push(`[1:a]${LEVEL_AUDIO}[a]`);

  const args = [
    "-y",
    // Before -i, so it applies to the footage and not to the voice.
    "-stream_loop", "-1",
    "-i", path.resolve(input),
    "-i", path.resolve(audio),
    ...assets.flatMap((a) => ["-i", path.join(workDir, a.name)]),
    "-filter_complex", chains.join(";"),
    "-map", "[v]",
    "-map", "[a]",
    "-t", audioDuration.toFixed(3),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "21",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "44100",
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

export type ConcatOptions = {
  /** Finished mp4s in shoot order. Every one must come from renderVertical. */
  inputs: string[];
  outDir: string;
  urlPrefix: string;
  slug: string;
};

/**
 * Joins the per-clip renders into the reel that actually gets posted.
 *
 * Each part is cut and captioned on its own first, which is what makes a shoot of
 * six takes work at all: one bad take is re-shot and re-processed without touching
 * the other five, and a transcript never has to span a hard cut between takes.
 *
 * Re-encodes rather than stream-copying. Copying would be instant and every input
 * does share our own encoder settings, but concatenated copies carry their source
 * timestamps, and the failure that produces is audio drifting out of sync a few
 * takes in — silent, invisible until playback, and not something to discover on
 * stage. A few seconds of CPU is the cheaper side of that trade.
 */
export async function concatRenders(options: ConcatOptions): Promise<RenderResult> {
  const { inputs, outDir, urlPrefix, slug } = options;
  if (inputs.length === 0) throw new Error("Nothing to join.");

  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${slug}.mp4`);

  // A single take needs no join; copying it keeps one code path in the caller.
  if (inputs.length === 1) {
    await run("ffmpeg", ["-y", "-i", path.resolve(inputs[0]), "-c", "copy",
      "-movflags", "+faststart", path.resolve(outFile)]);
  } else {
    const workDir = path.join(outDir, `.${slug}-join`);
    await mkdir(workDir, { recursive: true });
    const listFile = path.join(workDir, "parts.txt");

    // The concat demuxer reads single-quoted paths, so a quote in a filename has
    // to be escaped or it ends the token early. Our slugs never contain one, but
    // the list is built from paths and not from slugs.
    const list = inputs
      .map((f) => `file '${path.resolve(f).replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listFile, `${list}\n`, "utf8");

    try {
      await run("ffmpeg", [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "21",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-movflags", "+faststart",
        path.resolve(outFile),
      ]);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
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
