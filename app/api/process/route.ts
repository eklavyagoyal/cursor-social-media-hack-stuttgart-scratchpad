import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { buildCaptions, buildCutPlan } from "@/lib/cut";
import { concatRenders, extractAudio, probe, renderVertical, renderVoiceover } from "@/lib/render";
import { sweepOldArtifacts } from "@/lib/sweep";
import { transcribeFile } from "@/lib/transcribe";
import type { ClipMode, ClipResult, CutPlan, Transcript } from "@/lib/types";
import { speak } from "@/lib/voice";

export const runtime = "nodejs";
export const maxDuration = 600;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const RENDER_DIR = path.join(process.cwd(), "public", "renders");
const AUDIO_DIR = path.join(process.cwd(), "tmp", "audio");
const VOICE_DIR = path.join(process.cwd(), "tmp", "voice");

/** A phone clip for a Reel is tens of MB. Anything past this is a mistake or an
 *  attack, and either way it fills a small Hetzner disk in one request. */
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 250) * 1_000_000;

/**
 * A script this long is a different product, and each take costs a transcription
 * call plus an encode — so the ceiling is here to keep one request from running
 * for ten minutes, not because the pipeline cares.
 */
const MAX_CLIPS = 12;

export async function POST(req: Request) {
  try {
    // Bound the disk before writing anything new. Never fails the job.
    await sweepOldArtifacts();

    const form = await req.formData();

    // One entry per take, in shoot order. A single upload sends exactly one and
    // takes the identical path through everything below.
    const files = form.getAll("video").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No video found in the upload." }, { status: 400 });
    }
    if (files.length > MAX_CLIPS) {
      return NextResponse.json(
        { error: `${files.length} clips is past the limit of ${MAX_CLIPS} in one run.` },
        { status: 400 },
      );
    }

    const oversized = files.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      return NextResponse.json(
        {
          error:
            `"${oversized.name}" is ${(oversized.size / 1e6).toFixed(0)} MB, the limit is ` +
            `${MAX_UPLOAD_BYTES / 1e6} MB per clip. 20-40 seconds is plenty for a reel.`,
        },
        { status: 413 },
      );
    }

    const aggressive = form.get("aggressive") === "true";
    const burnCaptions = form.get("captions") !== "false";
    const language = (form.get("language") as string | null)?.trim() || undefined;

    // Headings from the script, so a result reads as "Hook" rather than "clip 1".
    const labels = parseStrings(form.get("labels"));
    // Per take: filmed sound, or the scripted line spoken by a voice.
    const modes = parseStrings(form.get("modes")).map(coerceMode);
    // What a "voice" take should say. Positional, like everything else here.
    const texts = parseStrings(form.get("texts"));
    const voiceId = (form.get("voiceId") as string | null)?.trim() || "";
    const voiceName = (form.get("voiceName") as string | null)?.trim() || undefined;

    const wantsVoice = modes.some((m) => m === "voice");
    if (wantsVoice && !voiceId) {
      return NextResponse.json(
        { error: "A voice take needs a voice — none was chosen." },
        { status: 400 },
      );
    }

    const runSlug = `clip-${Date.now().toString(36)}`;
    await mkdir(UPLOAD_DIR, { recursive: true });

    const clips: ClipResult[] = [];

    // Sequential on purpose: N parallel ffmpeg encodes will thrash a small shared
    // box, and when a take fails the operator needs to know which one.
    for (const [index, file] of files.entries()) {
      const slug = files.length === 1 ? runSlug : `${runSlug}-${index + 1}`;
      const ext = path.extname(file.name) || ".mp4";
      const rawPath = path.join(UPLOAD_DIR, `${slug}${ext}`);
      const mode: ClipMode = modes[index] ?? "original";

      await writeFile(rawPath, Buffer.from(await file.arrayBuffer()));

      const source = await probe(rawPath);
      const named = describe(labels, index, files.length);

      // Silence is only a problem when the filmed sound is the content. In voice
      // mode it is the normal case — b-roll is exactly what this path is for.
      if (mode === "original" && !source.hasAudio) {
        return NextResponse.json(
          {
            error:
              `${named} has no audio track — without sound there are no captions ` +
              `and no cuts. Switch it to a voice, or attach a clip with sound.`,
          },
          { status: 400 },
        );
      }

      let transcript: Transcript;
      let plan: CutPlan;
      let render;
      let voice: ClipResult["voice"];

      if (mode === "voice") {
        const line = texts[index]?.trim();
        if (!line) {
          return NextResponse.json(
            { error: `${named} is set to a voice but has no line to speak.` },
            { status: 400 },
          );
        }

        const spoken = await speak({ text: line, voiceId, outDir: VOICE_DIR, slug });

        // Captions come off the alignment, so they sit exactly on the spoken word
        // rather than on a transcription's estimate of it.
        plan = {
          sourceDuration: source.duration,
          outDuration: spoken.duration,
          removedSeconds: 0,
          keep: [{ start: 0, end: spoken.duration }],
          cuts: [],
        };
        transcript = { text: spoken.text, languageCode: "generated", words: spoken.words };
        const captions = buildCaptions(spoken.words, plan);

        render = await renderVoiceover({
          input: rawPath,
          audio: spoken.path,
          audioDuration: spoken.duration,
          captions,
          outDir: RENDER_DIR,
          urlPrefix: "/media/renders",
          slug,
          burnCaptions,
        });

        voice = { id: voiceId, ...(voiceName ? { name: voiceName } : {}), text: line };

        clips.push({
          index,
          ...(labels[index] ? { label: labels[index] } : {}),
          mode,
          voice,
          slug,
          source,
          rawUrl: `/media/uploads/${slug}${ext}`,
          transcript,
          plan,
          captions,
          render,
        });
        continue;
      }

      const audioPath = await extractAudio(rawPath, path.join(AUDIO_DIR, `${slug}.mp3`));
      transcript = await transcribeFile(audioPath, { languageCode: language });
      plan = buildCutPlan(transcript.words, source.duration, { aggressive });
      const captions = buildCaptions(transcript.words, plan);

      render = await renderVertical({
        input: rawPath,
        plan,
        captions,
        outDir: RENDER_DIR,
        // Served by app/media/[kind]/[name] — not as a static file, see that route.
        urlPrefix: "/media/renders",
        slug,
        hasAudio: source.hasAudio,
        burnCaptions,
      });

      clips.push({
        index,
        ...(labels[index] ? { label: labels[index] } : {}),
        mode,
        slug,
        source,
        rawUrl: `/media/uploads/${slug}${ext}`,
        transcript,
        plan,
        captions,
        render,
      });
    }

    const first = clips[0];

    // One take is already the finished reel; joining it would only re-encode it.
    const render =
      clips.length === 1
        ? first.render
        : await concatRenders({
            inputs: clips.map((c) => c.render.path),
            outDir: RENDER_DIR,
            urlPrefix: "/media/renders",
            slug: `${runSlug}-reel`,
          });

    return NextResponse.json({
      // The publish step addresses the file by slug, so this has to name whatever
      // `render` actually points at.
      slug: clips.length === 1 ? first.slug : `${runSlug}-reel`,
      source: first.source,
      rawUrl: first.rawUrl,
      transcript: first.transcript,
      plan: first.plan,
      captions: first.captions,
      render,
      clips,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

function parseStrings(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => (typeof v === "string" ? v : "")) : [];
  } catch {
    return [];
  }
}

function coerceMode(raw: string): ClipMode {
  return raw === "voice" ? "voice" : "original";
}

/** Name the take the way the operator sees it in the shoot list. */
function describe(labels: string[], index: number, total: number): string {
  if (labels[index]) return `Shot ${index + 1} "${labels[index]}"`;
  return total === 1 ? "The clip" : `Clip ${index + 1}`;
}
