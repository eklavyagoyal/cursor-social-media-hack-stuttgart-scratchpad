import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The stage safety net. Pre-baked Genome + Drop for a known brand, served from
 * disk so it works with wifi off. Populate public/demo/<slug>.json at 14:45.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return Response.json({ error: "bad slug" }, { status: 400 });
  }

  try {
    const raw = await readFile(join(process.cwd(), "public", "demo", `${slug}.json`), "utf8");
    return new Response(raw, {
      headers: { "content-type": "application/json", "x-doppel-source": "cache" },
    });
  } catch {
    return Response.json({ error: `no cached demo for "${slug}"` }, { status: 404 });
  }
}
