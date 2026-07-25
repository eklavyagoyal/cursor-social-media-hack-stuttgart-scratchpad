import type { BrandGenome } from "./brand";
import type { ShootBrief, Word } from "./types";

/**
 * Hand-written so the UI can be built and demoed with no API keys and no network.
 * The cached demo path depends on this too.
 *
 * The wording is load-bearing, not decorative: BriefPanel highlights the brand's
 * petPhrases only where they appear verbatim in the script, so the phrases below
 * and the script above have to stay character-identical. Edit one, edit both, or
 * the cached demo quietly loses the one claim it exists to prove.
 */
export const FIXTURE_BRIEF: ShootBrief = {
  id: "brief-fixture",
  topic: "Why our espresso blend gets roasted three times",
  hook: "Most roasters roast once. We roast three times — and there's an unpleasant reason.",
  totalSeconds: 28,
  shots: [
    {
      n: 1,
      label: "Hook",
      seconds: 4,
      say: "Most roasters roast once. We roast three times. And that's really laziness — just the other way round.",
      camera:
        "Phone vertical at chest height, arm extended, standing right in front of the drum. Face fills the top third.",
      onScreen: "3× roasted",
    },
    {
      n: 2,
      label: "Problem",
      seconds: 8,
      say: "Roasting once means you commit to a compromise. The bean that needs sweetness gets the same heat as the one that needs acidity.",
      camera:
        "Rest the phone on the bean tray, pull up slowly to eye level. One move, no cut.",
    },
    {
      n: 3,
      label: "Proof",
      seconds: 10,
      say: "So we separate them. Every varietal gets its own curve, roasted on its own. We only blend afterwards. That takes three times as long and burns three times the gas.",
      camera:
        "Close on your hands as you slide three separate trays next to each other. Phone at table height, angled slightly from above.",
      onScreen: "3 curves, 1 blend",
    },
    {
      n: 4,
      label: "Payoff",
      seconds: 6,
      say: "That's why the espresso still tastes like something once there's milk in it. Try it, and if you can't taste the difference, tell me straight.",
      camera:
        "Back to eye level, hold the cup into frame, talk straight into the camera. Hold still for the last second.",
    },
  ],
  caption:
    "Roasting three times sounds like showing off. It's just what follows from a problem most roasters blend away.\n\nEvery varietal gets its own curve, and we only blend afterwards. Takes longer, burns more gas — but it still comes through milk.",
  hashtags: ["#espresso", "#coffeeroasting", "#specialtycoffee", "#craft", "#stuttgart"],
  cta: "Tell me in the comments whether you can taste the difference.",
  soundIdea: "Room sound — the drum noise is half the video.",
  bestPostTime: "Tue–Thu 18:30–20:00",
  createdAt: "2026-07-25T08:00:00.000Z",
};

/**
 * The brand behind the fixture brief, so the cached demo path tells one story
 * end to end: genome → brief → clip. Written from the same voice as
 * FIXTURE_BRIEF rather than a second brand, because a fallback that contradicts
 * itself is worse than no fallback.
 *
 * Shipped to the browser as public/demo/genome.json.
 */
const GENOME_FIELDS: Omit<BrandGenome, "context"> = {
  sourceUrl: "https://southside-roastworks.com",
  name: "Southside Roastworks",
  tagline: "Three roasts. One blend.",
  voice: {
    adjectives: ["direct", "dry", "unshowy"],
    petPhrases: [
      "Most roasters roast once. We roast three times.",
      "that's really laziness — just the other way round",
      "Every varietal gets its own curve",
      "We only blend afterwards",
      "Takes longer, burns more gas",
      "it still comes through milk",
      "Try it, and if you can't taste the difference, tell me straight.",
      "Room sound — the drum noise is half the video.",
    ],
    forbidden: [
      "coffee journey",
      "moment of indulgence",
      "hand-picked",
      "premium",
      "unique",
      "taste experience",
      "revolutionary",
    ],
    sentenceStyle:
      "Short main clauses. A number instead of an adjective. Often a contradiction in the first sentence, resolved in the second. Second person throughout, and it admits the downside first.",
    emojiPolicy: "sparing",
  },
  look: {
    palette: ["#1A120B", "#E8DCC8", "#C1440E", "#5C4033", "#F5F1E8"],
    typographyVibe:
      "Narrow grotesque in caps on the bags, serif for body copy. Lots of white space, almost no frames.",
    imageryStyle:
      "Workshop photos under artificial light: drum, hands, beans in half shadow. No latte-art stock.",
  },
  substance: {
    pillars: [
      "Separate roast curves per varietal",
      "Why we only blend after roasting",
      "Espresso that survives milk",
      "Direct trade and what it actually costs",
      "Grind and water at home",
      "Craft without the jargon",
    ],
    icp: "The restaurant owner or heavy home cook who already buys good coffee and still wonders why the espresso at home tastes like nothing.",
    proofPoints: [
      "Three separate roast curves per blend, blended only afterwards",
      "Triple the gas consumption of a single pass",
      "Drum roasted in Stuttgart, no hot air",
    ],
  },
  hooks: [
    "Most {trade} do {the_usual_way}. We {deviation} — and there's an unpleasant reason.",
    "{number}× {process} sounds like showing off. It's just what follows from {problem}.",
    "Takes longer, costs more {resource}. In return, {result}.",
    "Try it, and if you can't taste {no_difference}, tell me straight.",
    "That's really {accusation} — just the other way round.",
  ],
};

/**
 * Mirrors `toContext` in lib/brand.ts — same shape, so a cached genome and a
 * freshly crawled one ground the brief prompt identically.
 */
function toContext(g: Omit<BrandGenome, "context">): string {
  const { voice, substance } = g;
  return [
    `Brand: ${g.name}${g.tagline ? ` — ${g.tagline}` : ""}`,
    `Voice: ${voice.adjectives.join(", ")}`,
    `Sentence style: ${voice.sentenceStyle}`,
    `Emojis: ${voice.emojiPolicy}`,
    `Target person: ${substance.icp}`,
    `Phrases the brand actually uses — reuse them where they fit:`,
    ...voice.petPhrases.map((p) => `- "${p}"`),
    `Words that must NEVER appear: ${voice.forbidden.join(", ")}`,
    `Verifiable facts, invent nothing beyond them: ${substance.proofPoints.join(" · ")}`,
    `Content pillars: ${substance.pillars.join(" · ")}`,
    `\nProven hook patterns:\n${g.hooks.map((h) => `- ${h}`).join("\n")}`,
  ].join("\n");
}

export const FIXTURE_GENOME: BrandGenome = {
  ...GENOME_FIELDS,
  context: toContext(GENOME_FIELDS),
};

/**
 * Stand-in transcript with a dead pause, a hesitation and one discourse filler,
 * so the cut logic has something real to chew on when no transcription key is
 * configured — including something the aggressive toggle can visibly remove.
 */
export const FIXTURE_WORDS: Word[] = [
  ["Most", 0.8, 1.05], ["roasters", 1.05, 1.5], ["roast", 1.5, 1.8], ["once.", 1.8, 2.3],
  ["um", 3.1, 3.5],
  ["We", 5.9, 6.1], ["roast", 6.1, 6.4], ["three", 6.4, 6.7], ["times.", 6.7, 7.2],
  ["And", 7.4, 7.6], ["that's", 7.6, 7.85], ["basically", 7.85, 8.35], ["laziness", 8.35, 8.95],
  ["just", 9.9, 10.1], ["backwards.", 10.1, 10.9],
].map(([text, start, end]) => ({
  text: text as string,
  start: start as number,
  end: end as number,
  type: "word" as const,
}));
