import path from "node:path";
import { NextResponse } from "next/server";
import { publishToInstagram, publishToTelegram, publishingEnabled } from "@/lib/publish";
import { toPublicUrl } from "@/lib/storage";
import type { PublishResult, PublishTarget } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 600;

const RENDER_DIR = path.join(process.cwd(), "public", "renders");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      slug?: string;
      caption?: string;
      targets?: PublishTarget[];
    };

    if (!body.slug) return NextResponse.json({ error: "slug fehlt." }, { status: 400 });
    const caption = body.caption ?? "";
    const targets = body.targets?.length ? body.targets : (["instagram", "telegram"] as PublishTarget[]);

    if (!publishingEnabled()) {
      return NextResponse.json({
        results: targets.map(
          (target): PublishResult => ({
            target,
            status: "skipped",
            error: "PUBLISH_ENABLED ist false — Sicherheitsschalter aktiv.",
          }),
        ),
      });
    }

    // Basename only: the slug comes from the client and must not escape the dir.
    const safeSlug = path.basename(body.slug);
    const filePath = path.join(RENDER_DIR, `${safeSlug}.mp4`);
    const publicUrl = await toPublicUrl(filePath, `/renders/${safeSlug}.mp4`);

    const results: PublishResult[] = [];
    if (targets.includes("instagram")) {
      results.push(await publishToInstagram({ videoUrl: publicUrl, caption }));
    }
    if (targets.includes("telegram")) {
      results.push(await publishToTelegram(publicUrl, caption));
    }

    return NextResponse.json({ publicUrl, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
