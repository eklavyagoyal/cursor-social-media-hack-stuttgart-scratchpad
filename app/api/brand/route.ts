import { NextResponse } from "next/server";
import { crawlBrandGenome } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * One URL -> the brand's genome. The client keeps `genome.context` and passes it
 * to /api/brief, so every shoot brief is written in the creator's own voice.
 */
export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };

    if (!url?.trim()) {
      return NextResponse.json({ error: "Keine URL angegeben." }, { status: 400 });
    }

    const genome = await crawlBrandGenome(url.trim());
    return NextResponse.json({ genome });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // A JS-only site is an expected outcome, not a server fault — the UI falls
    // back to the cached genome and says so.
    const thin = msg.includes("almost no readable text");
    console.error(JSON.stringify({ evt: "dep.fail", dep: "brand", thin, err: msg }));
    return NextResponse.json({ error: msg, thin }, { status: thin ? 422 : 500 });
  }
}
