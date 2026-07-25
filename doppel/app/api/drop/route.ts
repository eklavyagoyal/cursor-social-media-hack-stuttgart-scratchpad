import { writeCopy } from "@/lib/drop";
import { generateImages } from "@/lib/images";
import { sseResponse } from "@/lib/sse";
import { rememberDrop } from "@/lib/store";
import type { BrandGenome, Drop } from "@/lib/types";
import { speak } from "@/lib/voice";

export const maxDuration = 300;

let dropCount = 0;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    genome: BrandGenome;
    topic?: string;
    transcript?: string;
    filename?: string;
  };

  return sseResponse(async (say) => {
    const { genome } = body;
    if (!genome) throw new Error("no genome given");

    // Cost guard — blowing fal/11Labs credits mid-afternoon ends the day.
    if (++dropCount > Number(process.env.MAX_DROPS ?? 25)) {
      throw new Error("MAX_DROPS reached — bump the env var if this is intentional");
    }

    const source: Drop["source"] = body.transcript
      ? { kind: "video", filename: body.filename ?? "recording", transcript: body.transcript }
      : { kind: "topic", topic: body.topic ?? "" };

    if (source.kind === "video") {
      say({ t: "ok", msg: `transcript: ${source.transcript.split(/\s+/).length} words` });
      say({ t: "step", msg: "finding the strongest idea in the recording" });
    } else {
      say({ t: "step", msg: `writing as ${genome.name}` });
    }

    // 1. All copy in one call.
    const copy = await writeCopy(genome, source);
    say({ t: "ok", msg: `LinkedIn post · ${copy.linkedin.split(/\s+/).length} words` });
    say({ t: "ok", msg: `thread · ${copy.thread.length} posts` });
    say({ t: "ok", msg: `carousel · ${copy.carousel.slides.length} slides` });

    const drop: Drop = {
      id: `drop_${Date.now().toString(36)}`,
      genomeId: genome.id,
      source,
      linkedin: copy.linkedin,
      thread: copy.thread,
      carousel: { slides: copy.carousel.slides },
      status: "draft",
    };
    rememberDrop(drop); // /api/publish only ships Drops it can find here
    say({ t: "drop", drop }); // stream text first — images render behind it

    // 2. Images and voice in parallel; neither is allowed to kill the other.
    say({ t: "step", msg: "rendering visuals in their palette" });
    const [carouselImgs, shortImgs, vo] = await Promise.allSettled([
      generateImages(
        copy.carousel.slides.map((s) => s.imagePrompt),
        genome.look.palette,
        { seed: 100 }
      ),
      generateImages(copy.short.imagePrompts, genome.look.palette, { vertical: true, seed: 200 }),
      speak(copy.short.voScript, genome.voiceId),
    ]);

    if (carouselImgs.status === "fulfilled") {
      drop.carousel.slides.forEach((s, i) => (s.imageUrl = carouselImgs.value[i]));
      say({ t: "ok", msg: `${carouselImgs.value.length} carousel images` });
    } else {
      say({ t: "warn", msg: "carousel images unavailable — using cached" });
    }

    if (vo.status === "fulfilled") {
      say({ t: "ok", msg: `voiceover · ${vo.value.durationSec}s in their cloned voice` });
      if (shortImgs.status === "fulfilled") {
        drop.short = {
          imageUrls: shortImgs.value,
          voUrl: vo.value.url,
          captionGroups: copy.short.captionGroups,
          durationSec: vo.value.durationSec,
        };
        say({ t: "ok", msg: "vertical short assembled" });
      }
    } else {
      say({ t: "warn", msg: "voiceover unavailable — check ELEVENLABS_VOICE_ID" });
    }

    rememberDrop(drop); // re-store with images + VO attached
    say({ t: "drop", drop });
  });
}
