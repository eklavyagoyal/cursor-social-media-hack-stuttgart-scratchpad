/**
 * Builds the cached demo path: a processed clip that renders with no API keys and
 * no network. Run it once before the demo, then test with wifi off.
 *
 *   npm run seed:demo                 # synthetic clip, canned transcript
 *   npm run seed:demo -- clip.mov     # your footage, real transcription if keys exist
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { buildCaptions, buildCutPlan } from "../lib/cut";
import { FIXTURE_BRIEF, FIXTURE_WORDS } from "../lib/fixtures";
import { extractAudio, probe, renderVertical } from "../lib/render";
import { transcribeFile } from "../lib/transcribe";
import type { ProcessResult, Transcript } from "../lib/types";

const SLUG = "demo";
// Everything lands in one directory so the cached path is self-contained and can
// be committed — that is what makes the wifi-off test possible.
const DEMO = "public/demo";

function sh(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args);
    let err = "";
    c.stderr.on("data", (d) => (err += d));
    c.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}\n${err.slice(-1200)}`)),
    );
  });
}

const input = process.argv[2];

await mkdir(DEMO, { recursive: true });

const ext = input ? path.extname(input) || ".mp4" : ".mp4";
const rawPath = path.join(DEMO, `${SLUG}-raw${ext}`);

if (input) {
  console.log(`▸ using ${input}`);
  await copyFile(input, rawPath);
} else {
  console.log("▸ no input given — generating a 12s synthetic clip");
  await sh("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "testsrc=size=1280x720:rate=30:duration=12",
    "-f", "lavfi", "-i", "sine=frequency=320:duration=12",
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest",
    rawPath,
  ]);
}

const source = await probe(rawPath);
console.log(`  ${source.width}x${source.height} · ${source.duration.toFixed(2)}s · audio=${source.hasAudio}`);

let transcript: Transcript;
if (input && process.env.ELEVENLABS_API_KEY) {
  console.log("▸ transcribing with Scribe");
  const audio = await extractAudio(rawPath, `tmp/audio/${SLUG}.mp3`);
  transcript = await transcribeFile(audio);
  console.log(`  ${transcript.words.length} Wörter · ${transcript.languageCode}`);
} else {
  console.log("▸ using the canned transcript (no key, or no input file)");
  transcript = { text: FIXTURE_WORDS.map((w) => w.text).join(" "), languageCode: "de", words: FIXTURE_WORDS };
}

const plan = buildCutPlan(transcript.words, source.duration);
const captions = buildCaptions(transcript.words, plan);
console.log(
  `▸ ${plan.sourceDuration.toFixed(1)}s → ${plan.outDuration.toFixed(1)}s ` +
    `(${plan.cuts.length} Schnitte, ${captions.length} Untertitelgruppen)`,
);

console.log("▸ rendering");
const render = await renderVertical({
  input: rawPath,
  plan,
  captions,
  outDir: DEMO,
  urlPrefix: "/demo",
  slug: SLUG,
  hasAudio: source.hasAudio,
});

const result: ProcessResult = {
  slug: SLUG,
  source,
  rawUrl: `/demo/${SLUG}-raw${ext}`,
  transcript,
  plan,
  captions,
  render,
};

await writeFile(path.join(DEMO, "result.json"), JSON.stringify(result, null, 2), "utf8");
await writeFile(path.join(DEMO, "brief.json"), JSON.stringify(FIXTURE_BRIEF, null, 2), "utf8");

console.log(`\n✓ Demo-Pfad liegt bereit. ${render.width}x${render.height} · ${render.duration.toFixed(1)}s`);
console.log("  public/demo/result.json + public/demo/brief.json");
