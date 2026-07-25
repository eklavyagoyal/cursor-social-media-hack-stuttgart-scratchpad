import { corpusOf, crawlBrand, isThinCrawl } from "@/lib/crawl";
import { extractGenome } from "@/lib/genome";
import { sseResponse } from "@/lib/sse";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url?: string };

  return sseResponse(async (say) => {
    if (!url) throw new Error("no url given");
    const target = url.startsWith("http") ? url : `https://${url}`;
    const t0 = Date.now();

    say({ t: "step", msg: "reading brand surface" });
    const pages = await crawlBrand(target, (msg) => say({ t: "ok", msg }));
    console.error(JSON.stringify({ evt: "dep.ok", dep: "firecrawl", ms: Date.now() - t0, pages: pages.length }));

    if (isThinCrawl(pages)) {
      // A JS-only SPA or a hard block. Say so — the UI falls back to cache.
      say({ t: "warn", msg: "site returned almost no readable text" });
      throw new Error("thin crawl: site is JS-only or blocking");
    }
    say({ t: "ok", msg: `${pages.length} sources found` });

    say({ t: "step", msg: "extracting voice fingerprint" });
    const genome = await extractGenome(target, corpusOf(pages));

    say({ t: "ok", msg: `voice: ${genome.voice.adjectives.join(" · ")}` });
    say({ t: "ok", msg: `palette: ${genome.look.palette.slice(0, 3).join("  ")}` });
    say({ t: "ok", msg: `${genome.voice.petPhrases.length} pet phrases captured` });
    say({ t: "genome", genome });
  });
}
