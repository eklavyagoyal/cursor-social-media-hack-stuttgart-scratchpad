# 09 — Prompts & Schemas

The product's quality *is* these prompts. Everything else is plumbing. Copy them verbatim into
`lib/prompts.ts` at the venue.

Model: **`claude-opus-5`**. Always force JSON with `output_config.format` — never parse prose.

---

## 1 · Brand Genome extraction

### Schema (`GENOME_SCHEMA`)

```ts
export const GENOME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "voice", "look", "substance", "hooks"],
  properties: {
    name: { type: "string" },
    tagline: { type: "string" },
    voice: {
      type: "object", additionalProperties: false,
      required: ["adjectives", "petPhrases", "forbiddenWords", "sentenceStyle", "emojiPolicy"],
      properties: {
        adjectives:     { type: "array", items: { type: "string" } },  // want 3
        petPhrases:     { type: "array", items: { type: "string" } },  // want 8, verbatim
        forbiddenWords: { type: "array", items: { type: "string" } },
        sentenceStyle:  { type: "string" },
        emojiPolicy:    { type: "string", enum: ["none", "sparing", "heavy"] },
      },
    },
    look: {
      type: "object", additionalProperties: false,
      required: ["palette", "typographyVibe", "imageryStyle"],
      properties: {
        palette:        { type: "array", items: { type: "string" } },  // hex, want 5
        typographyVibe: { type: "string" },
        imageryStyle:   { type: "string" },
      },
    },
    substance: {
      type: "object", additionalProperties: false,
      required: ["pillars", "icp", "proofPoints"],
      properties: {
        pillars:     { type: "array", items: { type: "string" } },     // want 6
        icp:         { type: "string" },
        proofPoints: { type: "array", items: { type: "string" } },
      },
    },
    hooks: { type: "array", items: { type: "string" } },               // want 5, with {placeholders}
  },
} as const;
```

### System prompt (`GENOME_SYSTEM`)

```
You are a brand forensics analyst. You are given the raw scraped text of everything public about
one brand: their website, their about page, their posts.

Your job is to reverse-engineer their identity precisely enough that a writer who has never heard of
them could produce a post indistinguishable from theirs.

Extract, strictly grounded in the source text:

VOICE
- adjectives: exactly 3, specific. Not "professional" or "engaging" — those describe nothing.
  Good: "blunt", "deadpan", "evangelical", "clinical", "chatty", "reverent".
- petPhrases: 8 phrases they ACTUALLY USE, quoted verbatim from the source. Their words, not
  paraphrases. Include their filler, their sign-offs, their tics. This field matters more than any
  other in the whole object.
- forbiddenWords: words a competitor would use that they conspicuously never do
  (e.g. "synergy", "leverage", "solutions", "revolutionary", "game-changing").
- sentenceStyle: describe their rhythm concretely. e.g. "short declaratives, frequent one-line
  paragraphs, em-dashes, opens with a contradiction".
- emojiPolicy: none | sparing | heavy, based on observed usage.

LOOK
- palette: exactly 5 hex codes, "#RRGGBB". Prefer colours literally present in the source CSS/markup.
  If absent, infer from described imagery. Never return generic AI-purple.
- typographyVibe, imageryStyle: one short concrete phrase each.

SUBSTANCE
- pillars: 6 recurring topics they post about.
- icp: one sentence describing who they talk to. Be specific about the person, not the market.
- proofPoints: 3 concrete credibility facts (numbers, named clients, years, awards).

HOOKS
- 5 opening-line patterns lifted from their best-performing content, generalised with
  {placeholders}. e.g. "Most {audience} think {belief}. They're wrong." — patterns, not sentences.

RULES
- Ground everything in the source. If the source is too thin for a field, infer the most plausible
  value and keep it consistent with the rest — never return an empty array or "unknown". An empty
  field renders as a broken product.
- No hedging, no meta-commentary, no explanation. JSON only.
```

### User message
```
SOURCE URL: {url}

--- SCRAPED CONTENT ---
{markdown, truncated to ~120k chars}
```

### Normalizer — the thing that keeps the card from ever breaking

```ts
export function normalizeGenome(raw: any): BrandGenome {
  const arr = (v: any, n: number, fill: string) => {
    const a = Array.isArray(v) ? v.filter(Boolean).map(String) : [];
    while (a.length < n) a.push(fill);
    return a.slice(0, n);
  };
  const hex = (c: string) => {
    const s = String(c).trim().replace(/^#?/, "#");
    return /^#[0-9a-f]{6}$/i.test(s) ? s.toUpperCase() : "#111111";
  };
  return {
    ...raw,
    voice: {
      ...raw.voice,
      adjectives: arr(raw.voice?.adjectives, 3, "direct"),
      petPhrases: arr(raw.voice?.petPhrases, 8, "—"),
      forbiddenWords: Array.isArray(raw.voice?.forbiddenWords) ? raw.voice.forbiddenWords : [],
      emojiPolicy: ["none", "sparing", "heavy"].includes(raw.voice?.emojiPolicy)
        ? raw.voice.emojiPolicy : "sparing",
    },
    look: { ...raw.look, palette: arr(raw.look?.palette, 5, "#111111").map(hex) },
    substance: { ...raw.substance, pillars: arr(raw.substance?.pillars, 6, "brand") },
    hooks: arr(raw.hooks, 5, "Most {audience} get {topic} wrong."),
  };
}
```

→ this is what the one test in [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) covers.

---

## 2 · Drop generation (all copy in one call)

### Schema (`DROP_SCHEMA`)

```ts
export const DROP_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["linkedin", "thread", "carousel", "video"],
  properties: {
    linkedin: { type: "string" },
    thread: { type: "array", items: { type: "string" } },     // 5 posts, ≤270 chars each
    carousel: {
      type: "object", additionalProperties: false, required: ["slides"],
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object", additionalProperties: false,
            required: ["headline", "body", "imagePrompt"],
            properties: {
              headline:    { type: "string" },   // ≤ 8 words
              body:        { type: "string" },   // ≤ 20 words
              imagePrompt: { type: "string" },   // for fal — abstract, negative space, no text
            },
          },
        },
      },
    },
    video: {
      type: "object", additionalProperties: false,
      required: ["voScript", "captionGroups", "imagePrompts"],
      properties: {
        voScript:      { type: "string" },                              // ~55 words ≈ 20s
        captionGroups: { type: "array", items: { type: "string" } },     // 6 groups, ≤5 words each
        imagePrompts:  { type: "array", items: { type: "string" } },     // 4, vertical
      },
    },
  },
} as const;
```

### System prompt (`DROP_SYSTEM`)

```
You write as ONE specific brand. Their identity is given as a BRAND GENOME. Your only job is to be
indistinguishable from them.

Non-negotiable rules:
1. Use their petPhrases. Work at least 3 of them in naturally across the assets. This is the single
   most important instruction here.
2. Never use a word from forbiddenWords.
3. Match sentenceStyle exactly — their rhythm, their paragraph length, their punctuation habits.
4. Obey emojiPolicy strictly. "none" means zero emoji, including in the carousel.
5. Open with one of their hook patterns, filled in. Don't invent a new hook shape.
6. Ground claims in their proofPoints. Never invent a statistic, client, or number.

Asset rules:
- linkedin: 120–200 words. Hook on line 1, then a blank line. Their paragraph rhythm. No hashtag
  wall — max 3 hashtags, and only if they use hashtags at all.
- thread: 5 posts. Post 1 is the hook and must work alone. Each ≤270 characters. No "1/5" numbering
  unless they do that.
- carousel: 4 slides. headline ≤8 words, body ≤20 words. Slide 1 hooks, slide 4 has the takeaway.
  imagePrompt describes an ABSTRACT editorial image with generous negative space — never text,
  letters, logos, or people's faces.
- video.voScript: ~55 words, which is about 20 seconds spoken. Written to be SAID, not read: short
  clauses, no parentheses, no lists, no URLs, no "click the link in bio". One idea.
- video.captionGroups: split the voScript into exactly 6 groups of ≤5 words, in order, covering the
  whole script. These get burned on screen in sync with the audio.
- video.imagePrompts: 4 vertical 9:16 images, same abstract rules as the carousel, strictly in
  their palette.

Output JSON only. No preamble, no explanation.
```

### User message
```
BRAND GENOME:
{JSON.stringify(genome, null, 2)}

TOPIC: {topic}

Write one Drop about this topic, as this brand.
```

---

## 3 · Trend ranking (for the n8n nightly loop)

```
You are a content strategist for one brand. Below is their BRAND GENOME and 5 trending items
found today in their niche.

Pick the 3 that this brand could speak on CREDIBLY — where their proofPoints give them standing.
Reject anything that would read as bandwagoning. For each pick, write one hook in their voice using
one of their hook patterns.

Return JSON: { "picks": [{ "title", "url", "why" (≤15 words), "hook" }] }
```

## 4 · The learning loop (P2 — the "it gets smarter" story)

```
Below is a brand's GENOME and the engagement results of their last 10 posts.

Identify which hook patterns and pillars outperformed. Return an UPDATED hooks array (5 patterns,
same format) that promotes what worked and drops what didn't, plus one sentence explaining the
change. Change nothing else about the genome.

Return JSON: { "hooks": [...], "rationale": "..." }
```

---

## Prompt hygiene (the rules that actually matter under time pressure)

| Rule | Why |
|---|---|
| **Always `output_config.format`** | Never write a JSON-repair function at 14:30. Schema-forced output is free. |
| **Stream the copy call** | `anthropic.messages.stream()` → text appears while images render. Feels 3× faster. |
| **Genome in the user turn, instructions in `system`** | Keeps the system prompt byte-stable → prompt cache hits across every Drop. Free latency win. |
| **One call for all copy, not five** | 5 assets in one response are stylistically consistent with each other. Five calls drift. |
| **Never ask for "engaging" or "professional"** | Meaningless adjectives produce mean-of-the-internet output. Demand concrete, observed traits. |
| **`petPhrases` is the magic** | Verbatim phrases are what make output *recognisably them*. If the demo feels generic, this field is thin — fix the extraction, not the writer. |
| **Cap the corpus at ~120k chars** | Opus 5 has 1M context but you're paying and waiting for tokens you don't need. |
| **Test on a brand with a strong voice first** | A bland corporate site produces bland output and you'll wrongly blame your prompt. Use a brand with real personality to validate. |
