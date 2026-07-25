import { ALL_PLATFORMS, publishDrop } from "@/lib/publish";
import type { Drop } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { drop, platforms } = (await req.json()) as { drop: Drop; platforms?: string[] };
  if (!drop) return Response.json({ error: "no drop given" }, { status: 400 });

  const { published, queued } = await publishDrop(drop, platforms ?? ALL_PLATFORMS);

  return Response.json(
    { dropId: drop.id, published, queued },
    // 207 when something didn't make it — the UI shows honest per-platform state.
    { status: queued.length && !published.length ? 502 : queued.length ? 207 : 200 }
  );
}
