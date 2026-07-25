import { NextResponse } from "next/server";
import { generateBrief } from "@/lib/brief";
import type { ShootBrief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      topic?: string;
      context?: string;
      targetSeconds?: number;
      adjust?: string;
      previous?: ShootBrief;
    };

    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "No topic given." }, { status: 400 });
    }

    // An adjustment with nothing to adjust would silently become a fresh script,
    // which is the opposite of what the operator asked for.
    if (body.adjust?.trim() && !body.previous) {
      return NextResponse.json(
        { error: "Nothing to adjust yet — build a script first." },
        { status: 400 },
      );
    }

    const brief = await generateBrief({
      topic: body.topic.trim(),
      context: body.context,
      targetSeconds: body.targetSeconds,
      ...(body.adjust?.trim() ? { adjust: body.adjust.trim() } : {}),
      ...(body.previous ? { previous: body.previous } : {}),
    });

    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
