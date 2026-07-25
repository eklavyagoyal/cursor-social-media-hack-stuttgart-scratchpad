import Firecrawl from "@mendable/firecrawl-js";

const fc = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

/** Pages that actually carry brand voice, in priority order. */
const VOICEY = /about|story|manifesto|values|mission|who-we-are|team|blog|insights|philosophy|why/i;

export type Page = { url: string; markdown: string };

/**
 * One URL -> the brand's voice-bearing surface.
 * Homepage first (always), then up to 5 voicey subpages, all best-effort.
 */
export async function crawlBrand(
  url: string,
  onProgress?: (msg: string) => void
): Promise<Page[]> {
  const home: any = await fc.scrape(url, {
    formats: ["markdown", "links"],
    onlyMainContent: true,
    timeout: 20_000,
  });

  const homeMd: string = home?.markdown ?? "";
  const pages: Page[] = [{ url, markdown: homeMd }];
  onProgress?.(`homepage read (${homeMd.length.toLocaleString()} chars)`);

  // ponytail: links come back on the scrape; no separate map() call needed.
  const links: string[] = Array.isArray(home?.links) ? home.links : [];
  const origin = new URL(url).origin;
  const targets = Array.from(
    new Set(
      links
        .filter((l) => typeof l === "string" && l.startsWith(origin) && VOICEY.test(l))
        .map((l) => l.split("#")[0])
    )
  )
    .filter((l) => l !== url && l !== `${url}/`)
    .slice(0, 5);

  if (targets.length) onProgress?.(`following ${targets.length} voice-bearing pages`);

  const rest = await Promise.allSettled(
    targets.map(async (l) => {
      const d: any = await fc.scrape(l, {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 15_000,
      });
      return { url: l, markdown: d?.markdown ?? "" } as Page;
    })
  );

  for (const r of rest) {
    if (r.status === "fulfilled" && r.value.markdown.length > 200) pages.push(r.value);
  }

  return pages;
}

/** True when a site gave us nothing usable — a JS-only SPA or a hard block. */
export function isThinCrawl(pages: Page[]) {
  return pages.reduce((n, p) => n + p.markdown.length, 0) < 500;
}

export const corpusOf = (pages: Page[]) =>
  pages.map((p) => `## ${p.url}\n\n${p.markdown}`).join("\n\n---\n\n");
