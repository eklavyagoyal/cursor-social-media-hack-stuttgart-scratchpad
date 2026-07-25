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
    if (url.length > 2048) {
      return NextResponse.json({ error: "URL zu lang." }, { status: 400 });
    }

    // Scheme allowlist. Our server never fetches this URL — Firecrawl's
    // infrastructure does — so private-IP filtering would be pointless here
    // (their crawler can't reach our network). But `new URL()` happily accepts
    // file:, gopher: and data:, and we shouldn't forward those to a paid API.
    let parsed: URL;
    try {
      parsed = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
    } catch {
      return NextResponse.json({ error: "Not a valid URL." }, { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: `Schema ${parsed.protocol} nicht erlaubt.` }, { status: 400 });
    }

    const genome = await crawlBrandGenome(parsed.toString());
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
