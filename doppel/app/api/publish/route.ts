import { ALL_PLATFORMS, publishDrop } from "@/lib/publish";
import { recallDrop } from "@/lib/store";

export const maxDuration = 120;

/**
 * Publish by id only.
 *
 * The Drop is looked up server-side rather than accepted from the body. This app
 * is deployed publicly with a QR code on the tables, so a body-accepting version
 * of this route would be an open "post arbitrary content to our real accounts"
 * endpoint, and every imageUrl inside it an SSRF vector. Clients can only ask us
 * to ship something we generated.
 */
export async function POST(req: Request) {
  const { dropId, platforms } = (await req.json()) as { dropId?: string; platforms?: string[] };

  if (!dropId) return Response.json({ error: "dropId required" }, { status: 400 });

  const drop = recallDrop(dropId);
  if (!drop) {
    return Response.json(
      { error: "unknown dropId — generate a drop first (server restarted?)" },
      { status: 404 }
    );
  }

  const requested = platforms?.length
    ? platforms.filter((p) => ALL_PLATFORMS.includes(p))
    : ALL_PLATFORMS;

  const { published, queued } = await publishDrop(drop, requested);

  return Response.json(
    { dropId: drop.id, published, queued },
    // 207 when something didn't make it — the UI shows honest per-platform state.
    { status: queued.length && !published.length ? 502 : queued.length ? 207 : 200 }
  );
}
