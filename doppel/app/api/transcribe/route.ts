import { transcribe } from "@/lib/voice";

export const maxDuration = 300;

/**
 * multipart upload of a video/audio file -> transcript.
 * The front door of the video path: record on a phone, drop it in, get content.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "no file in form field 'file'" }, { status: 400 });
  }

  const t0 = Date.now();
  try {
    const transcript = await transcribe(file);
    console.error(
      JSON.stringify({
        evt: "dep.ok",
        dep: "elevenlabs.stt",
        ms: Date.now() - t0,
        bytes: file.size,
        words: transcript.split(/\s+/).length,
      })
    );
    return Response.json({
      filename: file.name,
      words: transcript.split(/\s+/).length,
      transcript,
    });
  } catch (err) {
    console.error(JSON.stringify({ evt: "dep.fail", dep: "elevenlabs.stt", err: String(err) }));
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
