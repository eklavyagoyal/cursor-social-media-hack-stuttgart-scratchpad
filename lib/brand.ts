import Firecrawl from "@mendable/firecrawl-js";
import OpenAI from "openai";

/**
 * One URL -> the brand's voice, look and substance.
 *
 * Two consumers:
 *  1. `context` feeds BriefInput.context, so the shoot brief is written in the
 *     creator's own words instead of generic Reel-speak.
 *  2. `look.palette` gives caption rendering the brand's actual colours.
 *
 * Without this the pipeline sounds like every other AI tool. With it, the "say"
 * lines come back using phrases the creator verifiably already uses.
 */

// Overridable so credits can be traded for quality without a deploy. Checked for
// emptiness, not just for undefined: a declared-but-blank env var is the normal
// state of an optional field in a deploy UI, and `??` would pass "" straight to
// the API.
const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5.6";

/** Pages that carry voice, as opposed to nav and legal boilerplate. */
const VOICEY =
  /about|story|manifesto|values|mission|ueber|über|team|blog|insights|philosophy|warum|why/i;

export type BrandGenome = {
  sourceUrl: string;
  name: string;
  /** Null when the site has no usable tagline — strict schemas can't omit it. */
  tagline?: string | null;
  voice: {
    /** Exactly 3 concrete adjectives — "blunt", never "professional". */
    adjectives: string[];
    /** Verbatim phrases the brand uses. The field that makes output sound like them. */
    petPhrases: string[];
    /** Words a competitor would use that they conspicuously never do. */
    forbidden: string[];
    sentenceStyle: string;
    emojiPolicy: "none" | "sparing" | "heavy";
  };
  look: { palette: string[]; typographyVibe: string; imageryStyle: string };
  substance: { pillars: string[]; icp: string; proofPoints: string[] };
  /** Opening-line patterns with {placeholders}, lifted from their own copy. */
  hooks: string[];
  /** Compact grounding text — pass straight into BriefInput.context. */
  context: string;
};

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    // Strict structured outputs require every property in `required`, so an
    // optional field has to be spelled as a nullable one instead.
    tagline: { type: ["string", "null"] },
    voice: {
      type: "object",
      properties: {
        adjectives: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        petPhrases: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
        forbidden: { type: "array", items: { type: "string" } },
        sentenceStyle: { type: "string" },
        emojiPolicy: { type: "string", enum: ["none", "sparing", "heavy"] },
      },
      required: ["adjectives", "petPhrases", "forbidden", "sentenceStyle", "emojiPolicy"],
      additionalProperties: false,
    },
    look: {
      type: "object",
      properties: {
        palette: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
        typographyVibe: { type: "string" },
        imageryStyle: { type: "string" },
      },
      required: ["palette", "typographyVibe", "imageryStyle"],
      additionalProperties: false,
    },
    substance: {
      type: "object",
      properties: {
        pillars: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
        icp: { type: "string" },
        proofPoints: { type: "array", items: { type: "string" } },
      },
      required: ["pillars", "icp", "proofPoints"],
      additionalProperties: false,
    },
    hooks: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
  },
  required: ["name", "tagline", "voice", "look", "substance", "hooks"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a brand forensics analyst. You get the scraped text of everything public about one brand.

Reverse-engineer their identity precisely enough that a script written from your output would be indistinguishable from how they actually talk on camera.

VOICE
- adjectives: exactly 3, concrete. Not "professional" or "engaging" — those describe nothing. Good: "blunt", "deadpan", "reverent", "clinical", "wry".
- petPhrases: phrases they ACTUALLY USE, quoted verbatim from the source. Their words, not paraphrases. This matters more than every other field combined.
- forbidden: words a competitor would use that they conspicuously never do (e.g. "synergy", "leverage", "solutions", "game-changing").
- sentenceStyle: their rhythm, concretely. e.g. "short declaratives, one-line paragraphs, em-dashes, opens with a contradiction".
- emojiPolicy: based on observed usage.

LOOK
- palette: exactly 5 hex codes "#RRGGBB". Prefer colours literally present in the source markup. Never return generic AI-purple.
- typographyVibe, imageryStyle: one concrete phrase each.

SUBSTANCE
- pillars: 4-6 recurring topics they could make short videos about.
- icp: one sentence, about the person — not the market segment.
- proofPoints: concrete credibility facts. Numbers, named customers, years. Never invent one.

HOOKS
- 3-5 opening-line patterns lifted from their strongest copy, generalised with {placeholders}. e.g. "Most {audience} think {belief}. They're wrong."

Ground everything in the source. Answer in the language the source is written in. JSON only.`;

async function scrapeVoiceSurface(url: string): Promise<string> {
  const fc = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

  const home: any = await fc.scrape(url, {
    formats: ["markdown", "links"],
    onlyMainContent: true,
    timeout: 20_000,
  });

  const parts = [`## ${url}\n\n${home?.markdown ?? ""}`];
  const origin = new URL(url).origin;

  const links: string[] = Array.isArray(home?.links)
    ? home.links.filter((l: unknown): l is string => typeof l === "string")
    : [];

  const targets = [...new Set(links.filter((l) => l.startsWith(origin) && VOICEY.test(l)).map((l) => l.split("#")[0]))]
    .filter((l) => l !== url && l !== `${url}/`)
    .slice(0, 4);

  const rest = await Promise.allSettled(
    targets.map(async (l) => {
      const d: any = await fc.scrape(l, { formats: ["markdown"], onlyMainContent: true, timeout: 15_000 });
      return `## ${l}\n\n${d?.markdown ?? ""}`;
    }),
  );

  for (const r of rest) {
    if (r.status === "fulfilled" && r.value.length > 200) parts.push(r.value);
  }

  const corpus = parts.join("\n\n---\n\n");
  // A JS-only SPA or a hard block gives us nothing usable. Fail loudly rather
  // than asking the model to invent a brand out of an empty string.
  if (corpus.replace(/#|\s/g, "").length < 400) {
    throw new Error(
      `brand: ${new URL(url).hostname} returned almost no readable text (JS-only or blocking)`,
    );
  }
  return corpus.slice(0, 120_000);
}

/** Render the structured genome into the grounding string the brief prompt wants. */
function toContext(g: Omit<BrandGenome, "context">): string {
  const { voice, substance } = g;
  return [
    `Marke: ${g.name}${g.tagline ? ` — ${g.tagline}` : ""}`,
    `Tonalität: ${voice.adjectives.join(", ")}`,
    `Satzbau: ${voice.sentenceStyle}`,
    `Emojis: ${voice.emojiPolicy}`,
    `Zielperson: ${substance.icp}`,
    ``,
    `Formulierungen, die die Marke wirklich benutzt — übernimm davon, wo es passt:`,
    ...voice.petPhrases.map((p) => `- "${p}"`),
    ``,
    voice.forbidden.length ? `Wörter, die NIE vorkommen dürfen: ${voice.forbidden.join(", ")}` : ``,
    substance.proofPoints.length
      ? `Belegbare Fakten, nichts dazuerfinden: ${substance.proofPoints.join(" · ")}`
      : ``,
    `Themenfelder: ${substance.pillars.join(" · ")}`,
    g.hooks.length ? `\nBewährte Hook-Muster:\n${g.hooks.map((h) => `- ${h}`).join("\n")}` : ``,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function crawlBrandGenome(url: string): Promise<BrandGenome> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const t0 = Date.now();

  const corpus = await scrapeVoiceSurface(target);
  console.error(
    JSON.stringify({ evt: "dep.ok", dep: "firecrawl", ms: Date.now() - t0, chars: corpus.length }),
  );

  const openai = new OpenAI();
  const res = await openai.responses.create({
    model: MODEL,
    // Reasoning tokens are billed against this budget, so it needs headroom the
    // genome itself never uses — a truncated response is invalid JSON.
    max_output_tokens: 8000,
    reasoning: { effort: "low" },
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `SOURCE: ${target}\n\n${corpus}` },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "brand_genome",
        strict: true,
        schema: SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  if (res.incomplete_details) {
    throw new Error(`brand: response truncated (${res.incomplete_details.reason})`);
  }
  if (!res.output_text) throw new Error("brand: no text in response");

  const raw = JSON.parse(res.output_text) as Omit<BrandGenome, "context" | "sourceUrl">;
  const genome = { ...raw, sourceUrl: target };
  return { ...genome, context: toContext(genome) };
}
