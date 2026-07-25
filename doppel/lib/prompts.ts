import type { BrandGenome } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
   1. BRAND GENOME — one URL → a structured brand identity
   ──────────────────────────────────────────────────────────────────────────── */

export const GENOME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "voice", "look", "substance", "hooks"],
  properties: {
    name: { type: "string" },
    tagline: { type: "string" },
    voice: {
      type: "object",
      additionalProperties: false,
      required: ["adjectives", "petPhrases", "forbiddenWords", "sentenceStyle", "emojiPolicy"],
      properties: {
        adjectives: { type: "array", items: { type: "string" } },
        petPhrases: { type: "array", items: { type: "string" } },
        forbiddenWords: { type: "array", items: { type: "string" } },
        sentenceStyle: { type: "string" },
        emojiPolicy: { type: "string", enum: ["none", "sparing", "heavy"] },
      },
    },
    look: {
      type: "object",
      additionalProperties: false,
      required: ["palette", "typographyVibe", "imageryStyle"],
      properties: {
        palette: { type: "array", items: { type: "string" } },
        typographyVibe: { type: "string" },
        imageryStyle: { type: "string" },
      },
    },
    substance: {
      type: "object",
      additionalProperties: false,
      required: ["pillars", "icp", "proofPoints"],
      properties: {
        pillars: { type: "array", items: { type: "string" } },
        icp: { type: "string" },
        proofPoints: { type: "array", items: { type: "string" } },
      },
    },
    hooks: { type: "array", items: { type: "string" } },
  },
} as const;

export const GENOME_SYSTEM = `You are a brand forensics analyst. You are given the raw scraped text of everything public about one brand: their website, their about page, their posts.

Your job is to reverse-engineer their identity precisely enough that a writer who has never heard of them could produce a post indistinguishable from theirs.

Extract, strictly grounded in the source text:

VOICE
- adjectives: exactly 3, specific. Not "professional" or "engaging" — those describe nothing. Good: "blunt", "deadpan", "evangelical", "clinical", "reverent", "wry".
- petPhrases: 8 phrases they ACTUALLY USE, quoted verbatim from the source. Their words, not paraphrases. Include their sign-offs, their framings, their tics. This field matters more than any other in the whole object — it is what makes generated content recognisably them.
- forbiddenWords: words a competitor would use that they conspicuously never do (e.g. "synergy", "leverage", "solutions", "revolutionary", "game-changing").
- sentenceStyle: describe their rhythm concretely. e.g. "short declaratives, frequent one-line paragraphs, em-dashes, opens with a contradiction".
- emojiPolicy: none | sparing | heavy, based on observed usage.

LOOK
- palette: exactly 5 hex codes, "#RRGGBB". Prefer colours literally present in the source markup or CSS. If absent, infer from described imagery and the brand's mood. Never return generic AI-purple.
- typographyVibe, imageryStyle: one short concrete phrase each.

SUBSTANCE
- pillars: 6 recurring topics they post about.
- icp: one sentence describing who they talk to. Be specific about the person, not the market.
- proofPoints: 3 concrete credibility facts (numbers, named clients, years, certifications, awards).

HOOKS
- 5 opening-line patterns lifted from their strongest existing copy, generalised with {placeholders}. e.g. "Most {audience} think {belief}. They're wrong." Patterns, not finished sentences.

RULES
- Ground everything in the source. If the source is thin for a field, infer the most plausible value consistent with the rest — never return an empty array or "unknown". An empty field renders as a broken product.
- No hedging, no meta-commentary, no explanation. JSON only.`;

export const genomeUser = (url: string, corpus: string) =>
  `SOURCE URL: ${url}\n\n--- SCRAPED CONTENT ---\n${corpus.slice(0, 120_000)}`;

/** Clamp, fill and normalize so the Genome card can never render broken. */
export function normalizeGenome(raw: any, sourceUrl: string): BrandGenome {
  const arr = (v: unknown, n: number, fill: string) => {
    const a = Array.isArray(v) ? v.filter(Boolean).map(String) : [];
    while (a.length < n) a.push(fill);
    return a.slice(0, n);
  };
  const hex = (c: string) => {
    const s = String(c).trim().replace(/^#?/, "#");
    return /^#[0-9a-f]{6}$/i.test(s) ? s.toUpperCase() : "#111111";
  };
  return {
    id: `gen_${Date.now().toString(36)}`,
    sourceUrl,
    name: String(raw?.name ?? new URL(sourceUrl).hostname),
    tagline: raw?.tagline ? String(raw.tagline) : undefined,
    voice: {
      adjectives: arr(raw?.voice?.adjectives, 3, "direct"),
      petPhrases: arr(raw?.voice?.petPhrases, 8, "—"),
      forbiddenWords: Array.isArray(raw?.voice?.forbiddenWords)
        ? raw.voice.forbiddenWords.map(String)
        : [],
      sentenceStyle: String(raw?.voice?.sentenceStyle ?? "short declaratives"),
      emojiPolicy: (["none", "sparing", "heavy"] as const).includes(raw?.voice?.emojiPolicy)
        ? raw.voice.emojiPolicy
        : "sparing",
    },
    look: {
      palette: arr(raw?.look?.palette, 5, "#111111").map(hex),
      typographyVibe: String(raw?.look?.typographyVibe ?? "clean sans, generous leading"),
      imageryStyle: String(raw?.look?.imageryStyle ?? "editorial, abstract, high negative space"),
    },
    substance: {
      pillars: arr(raw?.substance?.pillars, 6, "brand"),
      icp: String(raw?.substance?.icp ?? ""),
      proofPoints: Array.isArray(raw?.substance?.proofPoints)
        ? raw.substance.proofPoints.map(String)
        : [],
    },
    hooks: arr(raw?.hooks, 5, "Most {audience} get {topic} wrong."),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   2. DROP — one idea (typed, or transcribed from video) → five assets
   ──────────────────────────────────────────────────────────────────────────── */

export const DROP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["linkedin", "thread", "carousel", "short"],
  properties: {
    linkedin: { type: "string" },
    thread: { type: "array", items: { type: "string" } },
    carousel: {
      type: "object",
      additionalProperties: false,
      required: ["slides"],
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "body", "imagePrompt"],
            properties: {
              headline: { type: "string" },
              body: { type: "string" },
              imagePrompt: { type: "string" },
            },
          },
        },
      },
    },
    short: {
      type: "object",
      additionalProperties: false,
      required: ["voScript", "captionGroups", "imagePrompts"],
      properties: {
        voScript: { type: "string" },
        captionGroups: { type: "array", items: { type: "string" } },
        imagePrompts: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export const DROP_SYSTEM = `You write as ONE specific brand. Their identity is given as a BRAND GENOME. Your only job is to be indistinguishable from them.

Non-negotiable rules:
1. Use their petPhrases. Work at least 3 of them in naturally across the assets. This is the single most important instruction here.
2. Never use a word from forbiddenWords.
3. Match sentenceStyle exactly — their rhythm, their paragraph length, their punctuation habits.
4. Obey emojiPolicy strictly. "none" means zero emoji, including in the carousel.
5. Open with one of their hook patterns, filled in. Do not invent a new hook shape.
6. Ground claims in their proofPoints. Never invent a statistic, client, or number.

Asset rules:
- linkedin: 120-200 words. Hook on line 1, then a blank line. Their paragraph rhythm. Max 3 hashtags, and only if they use hashtags at all.
- thread: 5 posts. Post 1 is the hook and must work alone. Each <= 270 characters. No "1/5" numbering unless they do that.
- carousel: exactly 4 slides. headline <= 8 words, body <= 20 words. Slide 1 hooks, slide 4 carries the takeaway. imagePrompt describes an ABSTRACT editorial image with generous negative space for text overlay — never text, letters, logos, or human faces.
- short.voScript: about 55 words, which is roughly 20 seconds spoken. Written to be SAID, not read: short clauses, no parentheses, no lists, no URLs, no "link in bio". One idea only.
- short.captionGroups: split voScript into exactly 6 groups of <= 5 words, in order, covering the whole script.
- short.imagePrompts: exactly 4 vertical 9:16 images, same abstract rules as the carousel, strictly in their palette.

Output JSON only. No preamble, no explanation.`;

export const dropUserFromTopic = (genome: BrandGenome, topic: string) =>
  `BRAND GENOME:\n${JSON.stringify(genome, null, 2)}\n\nTOPIC: ${topic}\n\nWrite one Drop about this topic, as this brand.`;

/** Video path: the transcript is the source of ideas AND of authentic phrasing. */
export const dropUserFromTranscript = (genome: BrandGenome, transcript: string) =>
  `BRAND GENOME:\n${JSON.stringify(genome, null, 2)}\n\n--- TRANSCRIPT OF A VIDEO THE FOUNDER JUST RECORDED ---\n${transcript.slice(0, 40_000)}\n\nThis transcript is the raw material. Find the single strongest idea in it and build one Drop around that idea.

Extra rules for the video path:
- Prefer the founder's OWN phrasing from the transcript over anything you would write yourself. If they said something well, reuse their exact words.
- Do not summarise the whole video. Pick ONE idea and go deep.
- Drop verbal filler, false starts, and tangents. Keep the substance and the voice.`;

/* ────────────────────────────────────────────────────────────────────────────
   3. IDEATION — one video → several distinct angles (for the queue)
   ──────────────────────────────────────────────────────────────────────────── */

export const IDEAS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["angle", "hook", "quote", "pillar"],
        properties: {
          angle: { type: "string" },  // <= 12 words: what this post argues
          hook: { type: "string" },   // the opening line, in their voice
          quote: { type: "string" },  // the verbatim line from the transcript it came from
          pillar: { type: "string" }, // which content pillar it serves
        },
      },
    },
  },
} as const;

export const IDEAS_SYSTEM = `You are a content strategist mining one video for a founder-led brand.

Given the BRAND GENOME and a video transcript, extract the 5 strongest DISTINCT content angles. Each must stand alone as its own post — not five framings of one point.

For each: the angle (<= 12 words), a hook line written in their voice using one of their hook patterns, the verbatim quote from the transcript that grounds it, and which of their pillars it serves.

Prefer angles where the founder said something specific, opinionated, or counterintuitive. Skip generic advice. If they contradicted conventional wisdom, that is your best angle.

JSON only.`;

export const ideasUser = (genome: BrandGenome, transcript: string) =>
  `BRAND GENOME:\n${JSON.stringify(genome, null, 2)}\n\n--- TRANSCRIPT ---\n${transcript.slice(0, 40_000)}`;
