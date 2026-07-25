import { NextResponse } from "next/server";
import { generateBrief } from "@/lib/brief";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      topic?: string;
      context?: string;
      targetSeconds?: number;
    };

    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "Kein Thema angegeben." }, { status: 400 });
    }

    const brief = await generateBrief({
      topic: body.topic.trim(),
      context: body.context,
      targetSeconds: body.targetSeconds,
    });

    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
