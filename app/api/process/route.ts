import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { buildCaptions, buildCutPlan } from "@/lib/cut";
import { extractAudio, probe, renderVertical } from "@/lib/render";
import { transcribeFile } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 600;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const RENDER_DIR = path.join(process.cwd(), "public", "renders");
const AUDIO_DIR = path.join(process.cwd(), "tmp", "audio");

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Kein Video im Upload gefunden." }, { status: 400 });
    }

    const aggressive = form.get("aggressive") === "true";
    const burnCaptions = form.get("captions") !== "false";
    const language = (form.get("language") as string | null)?.trim() || undefined;

    const slug = `clip-${Date.now().toString(36)}`;
    const ext = path.extname(file.name) || ".mp4";
    const rawPath = path.join(UPLOAD_DIR, `${slug}${ext}`);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(rawPath, Buffer.from(await file.arrayBuffer()));

    const source = await probe(rawPath);
    if (!source.hasAudio) {
      return NextResponse.json(
        { error: "Der Clip hat keine Tonspur — ohne Ton gibt es keine Untertitel und keinen Schnitt." },
        { status: 400 },
      );
    }

    const audioPath = await extractAudio(rawPath, path.join(AUDIO_DIR, `${slug}.mp3`));
    const transcript = await transcribeFile(audioPath, { languageCode: language });
    const plan = buildCutPlan(transcript.words, source.duration, { aggressive });
    const captions = buildCaptions(transcript.words, plan);

    const render = await renderVertical({
      input: rawPath,
      plan,
      captions,
      outDir: RENDER_DIR,
      urlPrefix: "/renders",
      slug,
      hasAudio: source.hasAudio,
      burnCaptions,
    });

    return NextResponse.json({
      slug,
      source,
      rawUrl: `/uploads/${slug}${ext}`,
      transcript,
      plan,
      captions,
      render,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
