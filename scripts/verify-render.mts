/**
 * Proves the cut + caption + encode chain works end to end on a synthetic clip.
 * Run: node scripts/verify-render.mts
 */
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { buildCutPlan, buildCaptions } from "../lib/cut";
import { probe, renderVertical } from "../lib/render";
import type { Word } from "../lib/types";

const TMP = "tmp/verify";

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

// A 12s clip: talking, a 2.4s dead pause, an "ähm", then talking again.
const words: Word[] = [
  word("Das", 0.9, 1.15),
  word("hier", 1.15, 1.45),
  word("ist", 1.45, 1.7),
  word("ein", 1.7, 1.9),
  word("Test.", 1.9, 2.4),
  // dead air 2.4 -> 5.6
  word("ähm", 5.6, 6.0),
  word("Und", 6.1, 6.4),
  word("jetzt", 6.4, 6.8),
  word("kommt", 6.8, 7.2),
  word("der", 7.2, 7.4),
  word("Schnitt.", 7.4, 8.0),
  // dead air 8.0 -> 10.2
  word("Fertig!", 10.2, 10.9),
];

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

console.log("▸ generating a 12s landscape test clip");
await sh("ffmpeg", [
  "-y",
  "-f", "lavfi", "-i", "testsrc=size=1280x720:rate=30:duration=12",
  "-f", "lavfi", "-i", "sine=frequency=440:duration=12",
  "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-shortest",
  `${TMP}/raw.mp4`,
]);

const info = await probe(`${TMP}/raw.mp4`);
console.log(`  source: ${info.width}x${info.height} · ${info.duration.toFixed(2)}s · audio=${info.hasAudio}`);

const plan = buildCutPlan(words, info.duration);
console.log(`\n▸ cut plan: ${plan.keep.length} keep spans, ${plan.cuts.length} cuts`);
console.log(`  ${plan.sourceDuration.toFixed(2)}s → ${plan.outDuration.toFixed(2)}s (−${plan.removedSeconds.toFixed(2)}s)`);
for (const c of plan.cuts) {
  console.log(`  ✂ ${c.start.toFixed(2)}–${c.end.toFixed(2)}  ${c.reason}${c.text ? ` "${c.text}"` : ""}`);
}

const captions = buildCaptions(words, plan);
console.log(`\n▸ ${captions.length} caption groups (output timeline)`);
for (const c of captions) {
  console.log(`  ${c.start.toFixed(2)}–${c.end.toFixed(2)}  ${c.text}`);
}

console.log("\n▸ rendering 1080x1920 with burned captions");
const t0 = Date.now();
const result = await renderVertical({
  input: `${TMP}/raw.mp4`,
  plan,
  captions,
  outDir: TMP,
  urlPrefix: "/verify",
  slug: "out",
  hasAudio: info.hasAudio,
});

console.log(
  `  ✓ ${result.width}x${result.height} · ${result.duration.toFixed(2)}s · ` +
    `${(result.sizeBytes / 1024).toFixed(0)} KB · ${((Date.now() - t0) / 1000).toFixed(1)}s encode`,
);

const drift = Math.abs(result.duration - plan.outDuration);
if (result.width !== 1080 || result.height !== 1920) throw new Error("Falsche Ausgabegröße.");
if (drift > 0.6) throw new Error(`Dauer weicht ab: erwartet ${plan.outDuration.toFixed(2)}s, ist ${result.duration.toFixed(2)}s`);

console.log(`\n✓ Kette funktioniert. Drift ${drift.toFixed(3)}s. Datei: ${result.path}`);
