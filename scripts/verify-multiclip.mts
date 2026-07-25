/**
 * Proves a multi-take shoot cuts per clip and joins into one reel.
 * Run: npm run verify:multiclip
 *
 * Transcription is stubbed with fixed word timings so this runs with no API keys
 * — the join is the part that can break, and it breaks in ways that only show up
 * in the output file: parts silently dropped, or audio drifting behind the picture
 * a few takes in.
 */
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { buildCaptions, buildCutPlan } from "../lib/cut";
import { concatRenders, probe, renderVertical } from "../lib/render";
import type { Word } from "../lib/types";

const TMP = "tmp/verify-multi";

function sh(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args);
    let err = "";
    c.stderr.on("data", (d) => (err += d));
    c.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}\n${err.slice(-1500)}`)),
    );
  });
}

const word = (text: string, start: number, end: number): Word => ({
  text,
  start,
  end,
  type: "word",
});

/** Speech, a dead pause, a hesitation, more speech — one take's worth. */
function take(offsetHz: number): Word[] {
  return [
    word("This", 0.8, 1.05),
    word("is", 1.05, 1.3),
    word("take", 1.3, 1.7),
    word(`number`, 1.7, 2.2),
    // dead air 2.2 -> 5.4
    word("um", 5.4, 5.8),
    word("and", 6.0, 6.25),
    word("here", 6.25, 6.6),
    word("it", 6.6, 6.8),
    word("ends.", 6.8, 7.4),
  ].map((w) => ({ ...w, text: offsetHz > 400 ? w.text.toUpperCase() : w.text }));
}

const SHOTS = [
  { label: "Hook", seconds: 10, tone: 320 },
  { label: "Problem", seconds: 12, tone: 440 },
  { label: "Payoff", seconds: 9, tone: 560 },
];

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

const renders: string[] = [];
let expected = 0;

for (const [i, shot] of SHOTS.entries()) {
  const raw = `${TMP}/take-${i + 1}.mp4`;
  console.log(`\n▸ take ${i + 1} "${shot.label}" — generating ${shot.seconds}s`);
  await sh("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", `testsrc=size=1280x720:rate=30:duration=${shot.seconds}`,
    "-f", "lavfi", "-i", `sine=frequency=${shot.tone}:duration=${shot.seconds}`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest",
    raw,
  ]);

  const info = await probe(raw);
  const words = take(shot.tone);
  const plan = buildCutPlan(words, info.duration);
  const captions = buildCaptions(words, plan);

  const render = await renderVertical({
    input: raw,
    plan,
    captions,
    outDir: TMP,
    urlPrefix: "/verify",
    slug: `out-${i + 1}`,
    hasAudio: info.hasAudio,
  });

  console.log(
    `  cut ${plan.sourceDuration.toFixed(2)}s → ${plan.outDuration.toFixed(2)}s · ` +
      `${captions.length} caption groups · rendered ${render.duration.toFixed(2)}s`,
  );

  renders.push(render.path);
  expected += render.duration;
}

console.log(`\n▸ joining ${renders.length} takes`);
const t0 = Date.now();
const reel = await concatRenders({
  inputs: renders,
  outDir: TMP,
  urlPrefix: "/verify",
  slug: "reel",
});

console.log(
  `  ✓ ${reel.width}x${reel.height} · ${reel.duration.toFixed(2)}s · ` +
    `${(reel.sizeBytes / 1024).toFixed(0)} KB · ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);

const drift = Math.abs(reel.duration - expected);
if (reel.width !== 1080 || reel.height !== 1920) {
  throw new Error(`Wrong output dimensions: ${reel.width}x${reel.height}`);
}
// A dropped take is the failure this catches: the file still plays, just shorter.
if (drift > 0.5) {
  throw new Error(
    `Joined length is off: expected ${expected.toFixed(2)}s, got ${reel.duration.toFixed(2)}s`,
  );
}

// The audio has to survive the join, or the reel posts silent.
const joined = await probe(reel.path);
if (!joined.hasAudio) throw new Error("The joined reel has no audio track.");

console.log(
  `\n✓ ${SHOTS.length} takes → one reel. Expected ${expected.toFixed(2)}s, ` +
    `got ${reel.duration.toFixed(2)}s (drift ${drift.toFixed(3)}s). File: ${reel.path}`,
);
