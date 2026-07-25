/**
 * Clone a voice from an audio sample and print the voiceId.
 * Run ONCE, then paste the id into ELEVENLABS_VOICE_ID in .env.local.
 *
 *   node --env-file=.env.local scripts/clone-voice.ts ~/voice-sample.m4a "Eklavya"
 *
 * Needs: ElevenLabs Starter tier or above (Creator is fine — IVC is included).
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const [path, name = "Founder"] = process.argv.slice(2);
if (!path) {
  console.error("usage: node --env-file=.env.local scripts/clone-voice.ts <audio-file> [name]");
  process.exit(1);
}

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY missing — is .env.local filled in?");
  process.exit(1);
}

const el = new ElevenLabsClient({ apiKey: key });

const bytes = await readFile(path.replace(/^~/, process.env.HOME ?? "~"));
const mime = path.endsWith(".mp3")
  ? "audio/mpeg"
  : path.endsWith(".wav")
    ? "audio/wav"
    : "audio/mp4"; // .m4a from a phone voice memo

console.log(`uploading ${basename(path)} (${(bytes.length / 1024).toFixed(0)} kB) as "${name}"…`);

const v: any = await el.voices.ivc.create({
  name,
  files: [new File([new Uint8Array(bytes)], basename(path), { type: mime })] as any,
});

const id = v?.voiceId ?? v?.voice_id;
if (!id) {
  console.error("no voice id returned:", JSON.stringify(v).slice(0, 400));
  process.exit(1);
}

console.log(`\n✓ cloned.\n\n  ELEVENLABS_VOICE_ID=${id}\n\nPaste that into .env.local.`);

// Prove it works end to end, so a broken clone surfaces now and not at 15:00.
const stream = await el.textToSpeech.convert(id, {
  text: "This is my cloned voice. If you can hear this, the gasp is live.",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
});
const out = Buffer.from(await new Response(stream as any).arrayBuffer());
const { writeFile } = await import("node:fs/promises");
await writeFile("public/demo/clone-test.mp3", out);
console.log("→ wrote public/demo/clone-test.mp3 — play it. That's the demo's gasp.");
