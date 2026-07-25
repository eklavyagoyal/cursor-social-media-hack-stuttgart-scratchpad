import Firecrawl from "@mendable/firecrawl-js";
import OpenAI from "openai";
import type { BrandGenome } from "./brand";

/**
 * Step two of the crawl: after we know how the brand talks, find out what is
 * actually being posted around it right now — and turn that into a shooting
 * decision.
 *
 * The brand genome answers "how do they sound". It cannot answer "what should
 * they film this week", because that lives on the platforms, not on their own
 * website. So this searches short-form content in their subject area, keeps the
 * evidence, and derives concrete angles: hook, format, cut structure, length.
 *
 * `context` is appended to the brand's own grounding block and handed to
 * /api/brief unchanged, so the shot list comes out shaped by what works rather
 * than by the model's idea of a Reel.
 */

// Same override as lib/brand.ts and lib/brief.ts — one knob for the whole app.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6";

/** Cost guard — each search is a Firecrawl credit and the day has a budget. */
const MAX_QUERIES = 4;
const PER_QUERY = 6;
const MAX_REFERENCES = 14;

/**
 * Restrict to the platforms we are actually making video for.
 *
 * Measured, not assumed: putting "Reel" or "hook" in the query text returns
 * creator-marketing content *about* making Reels. Restricting the domain and
 * searching only the subject returns the niche's actual posts.
 */
const SHORT_FORM = ["instagram.com", "tiktok.com", "youtube.com"];

export type Platform = "instagram" | "tiktok" | "youtube" | "linkedin" | "web";

export type ReelReference = {
  title: string;
  url: string;
  snippet: string;
  platform: Platform;
};

/** One shootable idea, with the production decision already made. */
export type ContentAngle = {
  /** What the video is about, in one line. */
  angle: string;
  /** Why this lands in this niche — must point at the evidence, not at vibes. */
  why: string;
  /** The literal first sentence. */
  hook: string;
  /** How it is shot, e.g. "Talking head am Rechner, Schnitt auf den Bildschirm". */
  format: string;
  /** Whether the creator speaks on camera or a voiceover carries it. */
  narration: "on-camera" | "voiceover" | "mixed";
  totalSeconds: number;
  cuts: { label: string; seconds: number; shoot: string }[];
};

export type MarketResearch = {
  queries: string[];
  references: ReelReference[];
  angles: ContentAngle[];
  /** Append to BriefInput.context. */
  context: string;
  /** Set when the angles could not be derived — evidence only. */
  degraded?: string;
};

const PLATFORMS: [RegExp, Platform][] = [
  [/instagram\.com/i, "instagram"],
  [/tiktok\.com/i, "tiktok"],
  [/youtube\.com|youtu\.be/i, "youtube"],
  [/linkedin\.com/i, "linkedin"],
];

function platformOf(url: string): Platform {
  return PLATFORMS.find(([re]) => re.test(url))?.[1] ?? "web";
}

const QUERY_SCHEMA = {
  type: "object",
  properties: {
    queries: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
  },
  required: ["queries"],
  additionalProperties: false,
} as const;

const QUERY_SYSTEM = `You plan search queries to find out which short videos are currently running in a brand's niche.

You get the brand profile. Return 3-4 search queries.

Rules:
- Search ONLY for the subject. No words like "reel", "short", "hook", "viral", "Instagram" — the search is already restricted to those platforms, and such words return advice ABOUT short video instead of content FROM the niche.
- Write each query in the language the target person actually speaks. If the audience sits in German industry, write German — even when the website is English. The query language decides what we find, so it follows the audience, not the interface.
- 4 to 8 words, concrete nouns from the target person's world, no marketing terms.
- Each query covers a different aspect. JSON only.`;

/** Strip a sentence down to something a search engine matches well. */
function trimQuery(s: string): string {
  const seen = new Set<string>();
  return s
    .replace(/["'„“”]/g, "")
    .replace(/[.!?,;:]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => {
      const k = w.toLowerCase();
      if (!w || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 9)
    .join(" ");
}

const STOP = new Set(
  `the a an and or of to in on for with that never was were is are be been by from as at it its
   into not no what who which than then them they their this those these your you our we can
   der die das und oder von zu im auf für mit dass nicht kein ein eine einer eines dem den des
   als aus bei nach über unter vor durch gegen ohne um sich sind wird werden ist`
    .split(/\s+/)
    .filter(Boolean),
);

const keywordsOf = (text: string, n: number) => [
  ...new Set(
    text
      .split(/[^\p{L}\d-]+/u)
      .filter((w) => w.length > 3 && !STOP.has(w.toLowerCase()))
      .slice(0, 24),
  ),
].slice(0, n);

/**
 * Queries come from the brand, not from a topic: at this point the creator has
 * not chosen one yet — that is what this step exists to inform.
 *
 * Built from pillars anchored on the ICP's industry nouns. Pet phrases are
 * tempting here and they do not work: they are rhetorical, so searching
 * "don't let the answer retire with the expert" returns pension advice.
 */
export function fallbackQueries(genome: BrandGenome): string[] {
  // Four, not three: "production engineering lead" alone drifts into software.
  // The fourth noun is usually the industry and disambiguates the whole query.
  const anchor = keywordsOf(genome.substance.icp, 4).join(" ");
  const seeds = genome.substance.pillars.map((p) => `${keywordsOf(p, 5).join(" ")} ${anchor}`);
  return [...new Set(seeds.map(trimQuery).filter(Boolean))].slice(0, MAX_QUERIES);
}

async function planQueries(genome: BrandGenome): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) return fallbackQueries(genome);
  try {
    const res = await new OpenAI().responses.create({
      model: MODEL,
      max_output_tokens: 2000,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: QUERY_SYSTEM },
        { role: "user", content: genome.context },
      ],
      text: {
        format: { type: "json_schema", name: "search_queries", strict: true, schema: QUERY_SCHEMA },
      },
    });
    if (res.incomplete_details || !res.output_text) throw new Error("keine verwertbare Antwort");
    const { queries } = JSON.parse(res.output_text) as { queries: string[] };
    const clean = queries.map(trimQuery).filter(Boolean).slice(0, MAX_QUERIES);
    return clean.length ? clean : fallbackQueries(genome);
  } catch (err) {
    console.error(JSON.stringify({ evt: "dep.fail", dep: "research.queries", err: String(err) }));
    return fallbackQueries(genome);
  }
}

async function searchNiche(queries: string[]): Promise<ReelReference[]> {
  const fc = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

  const runs = await Promise.allSettled(
    queries.map((query) =>
      fc.search(query, {
        sources: ["web"],
        includeDomains: SHORT_FORM,
        limit: PER_QUERY,
        // Last month only. A format from 2023 is not evidence of anything.
        tbs: "qdr:m",
        timeout: 20_000,
      }),
    ),
  );

  const seen = new Set<string>();
  const refs: ReelReference[] = [];

  for (const run of runs) {
    if (run.status !== "fulfilled") continue;
    const data = run.value as Record<string, Array<Record<string, unknown>> | undefined>;
    for (const bucket of [data.web]) {
      for (const item of bucket ?? []) {
        const url = typeof item.url === "string" ? item.url : "";
        if (!url || seen.has(url)) continue;
        seen.add(url);
        refs.push({
          url,
          title: String(item.title ?? "").slice(0, 200),
          snippet: String(item.description ?? item.snippet ?? "").slice(0, 400),
          platform: platformOf(url),
        });
      }
    }
  }

  // Short-form platforms first: a blog post about Reels is weaker evidence than
  // a Reel that exists.
  const rank = (r: ReelReference) => (r.platform === "web" ? 1 : 0);
  return refs.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_REFERENCES);
}

const ANGLE_SCHEMA = {
  type: "object",
  properties: {
    angles: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          angle: { type: "string" },
          why: { type: "string", description: "Point at what in the evidence suggests this." },
          hook: { type: "string", description: "The literal first sentence, spoken." },
          format: {
            type: "string",
            description:
              "How it is shot with one phone. Concrete: what is in frame, what it cuts to.",
          },
          narration: { type: "string", enum: ["on-camera", "voiceover", "mixed"] },
          totalSeconds: { type: "number" },
          cuts: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                seconds: { type: "number" },
                shoot: { type: "string", description: "What the camera is pointed at." },
              },
              required: ["label", "seconds", "shoot"],
              additionalProperties: false,
            },
          },
        },
        required: ["angle", "why", "hook", "format", "narration", "totalSeconds", "cuts"],
        additionalProperties: false,
      },
    },
  },
  required: ["angles"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a content strategist for vertical short video, and you read search results like an editor.

You get (1) the brand profile of an account and (2) real search hits for short videos from its niche. From those you derive 3-4 concrete shooting ideas.

Rules:
- Lean on the hits. "why" must visibly point at a hit, not at instinct. If the hits give you little, say so in "why" instead of inventing it.
- "hook" is the literal first sentence, spoken, 12 words max. It has to work on mute too.
- "format" is a shooting decision, not a mood. So "mid-shot at the desk, cut to the monitor, hands in frame" — not "dynamic and modern".
- "narration": on-camera when the person speaks and is visible. voiceover when picture and voice are separate (the voice can be synthetic later). mixed when both occur.
- The "cuts" seconds must add up to "totalSeconds". Between 15 and 40 seconds.
- Carry over the brand's tone and its phrases. Use no word from the forbidden list.
- Answer in English, even when the hits are in another language. JSON only.`;

async function deriveAngles(
  genome: BrandGenome,
  refs: ReelReference[],
): Promise<ContentAngle[]> {
  const evidence = refs
    .map((r, i) => `${i + 1}. [${r.platform}] ${r.title}\n   ${r.snippet}\n   ${r.url}`)
    .join("\n");

  const res = await new OpenAI().responses.create({
    model: MODEL,
    // Reasoning tokens come out of this budget; a truncated response is invalid JSON.
    max_output_tokens: 8000,
    reasoning: { effort: "low" },
    input: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `MARKEN-PROFIL\n${genome.context}\n\nGEFUNDENE KURZVIDEOS AUS DEM THEMENFELD\n${evidence}`,
      },
    ],
    text: {
      format: { type: "json_schema", name: "content_angles", strict: true, schema: ANGLE_SCHEMA },
    },
  });

  if (res.incomplete_details) {
    throw new Error(`Antwort abgebrochen (${res.incomplete_details.reason})`);
  }
  if (!res.output_text) throw new Error("The model returned no text.");

  return (JSON.parse(res.output_text) as { angles: ContentAngle[] }).angles;
}

/** The grounding block appended to the brand context before /api/brief. */
function toContext(refs: ReelReference[], angles: ContentAngle[]): string {
  const lines: string[] = [];

  if (refs.length) {
    lines.push(
      `What the niche is running right now (search hits from the last month, as evidence, not to copy):`,
      ...refs.slice(0, 8).map((r) => `- [${r.platform}] ${r.title}`),
    );
  }

  for (const a of angles) {
    lines.push(
      ``,
      `Chosen angle: ${a.angle}`,
      `Rationale: ${a.why}`,
      `Hook: "${a.hook}"`,
      `Format: ${a.format} · Sprechweise: ${a.narration} · ca. ${a.totalSeconds}s`,
      `Schnittfolge:`,
      ...a.cuts.map((c) => `- ${c.label} · ${c.seconds}s · ${c.shoot}`),
    );
  }

  return lines.join("\n");
}

export async function researchMarket(genome: BrandGenome): Promise<MarketResearch> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY fehlt in .env.local");

  const queries = await planQueries(genome);
  const t0 = Date.now();
  const references = await searchNiche(queries);
  console.error(
    JSON.stringify({
      evt: "dep.ok",
      dep: "firecrawl.search",
      ms: Date.now() - t0,
      queries: queries.length,
      hits: references.length,
    }),
  );

  if (!references.length) {
    return {
      queries,
      references,
      angles: [],
      context: "",
      degraded: "Keine aktuellen Kurzvideos im Themenfeld gefunden.",
    };
  }

  // Evidence is useful on its own. Without a key we return it rather than
  // failing the step — the creator can still pick a topic from what they see.
  if (!process.env.OPENAI_API_KEY) {
    return {
      queries,
      references,
      angles: [],
      context: toContext(references, []),
      degraded: "Ohne OPENAI_API_KEY nur Fundstellen, keine abgeleiteten Winkel.",
    };
  }

  try {
    const angles = await deriveAngles(genome, references);
    return { queries, references, angles, context: toContext(references, angles) };
  } catch (err) {
    console.error(JSON.stringify({ evt: "dep.fail", dep: "research.angles", err: String(err) }));
    return {
      queries,
      references,
      angles: [],
      context: toContext(references, []),
      degraded: `Winkel konnten nicht abgeleitet werden: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
