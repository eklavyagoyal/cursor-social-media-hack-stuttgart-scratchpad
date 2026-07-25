import { NextResponse } from "next/server";
import type { BrandGenome } from "@/lib/brand";
import { researchMarket } from "@/lib/research";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Brand genome -> what is being posted around it right now -> shootable angles.
 *
 * Sits between /api/brand and /api/brief: the client keeps `research.context`
 * and appends it to `genome.context`, so the shoot brief is shaped by evidence
 * from the platforms instead of by the model's idea of a Reel.
 */
export async function POST(req: Request) {
  try {
    const { genome } = (await req.json()) as { genome?: BrandGenome };

    if (!genome?.substance?.pillars?.length) {
      return NextResponse.json(
        { error: "No brand profile passed — call /api/brand first." },
        { status: 400 },
      );
    }

    const research = await researchMarket(genome);
    return NextResponse.json({ research });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ evt: "dep.fail", dep: "research", err: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
