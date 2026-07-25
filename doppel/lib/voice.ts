import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { put } from "@vercel/blob";

const el = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

/**
 * Instant voice clone. Run ONCE (~10:45), put the id in ELEVENLABS_VOICE_ID,
 * never call this again today.
 */
export async function cloneVoice(name: string, sample: File | Blob): Promise<string> {
  const v: any = await el.voices.ivc.create({ name, files: [sample as any] });
  const id = v?.voiceId ?? v?.voice_id;
  if (!id) throw new Error("clone: no voice id returned");
  return id as string;
}

/** Text -> mp3 in the cloned voice -> public Blob URL. */
export async function speak(text: string, voiceId = process.env.ELEVENLABS_VOICE_ID) {
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID not set — clone a voice first");

  const stream = await el.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });

  const bytes = Buffer.from(await new Response(stream as any).arrayBuffer());
  const { url } = await put(`vo/${Date.now()}.mp3`, bytes, {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: true,
  });

  // Rough duration: mp3 at 128 kbps ≈ 16 kB/s. Good enough to pace captions.
  return { url, durationSec: Math.max(1, Math.round(bytes.length / 16_000)) };
}

/** Video/audio file -> transcript. This is the video path's front door. */
export async function transcribe(file: File | Blob): Promise<string> {
  const res: any = await el.speechToText.convert({
    file: file as any,
    modelId: "scribe_v1",
  });
  const text = res?.text ?? res?.transcript;
  if (!text) throw new Error("transcribe: no text returned");
  return String(text);
}
