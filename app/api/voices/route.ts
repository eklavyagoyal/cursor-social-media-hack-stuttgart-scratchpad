import { NextResponse } from "next/server";
import { listVoices } from "@/lib/voice";

export const runtime = "nodejs";

export async function GET() {
  // A missing key is the normal case on a machine without ElevenLabs, and it must
  // not read as a broken picker — the UI just falls back to original sound.
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ voices: [], configured: false });
  }
  try {
    return NextResponse.json({ voices: await listVoices(), configured: true });
  } catch (e) {
    return NextResponse.json(
      { voices: [], configured: true, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
