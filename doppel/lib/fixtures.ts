import type { BrandGenome, Drop, Trace } from "./types";

/**
 * The stage fallback, and the thing every screen is built against.
 * `?demo=1` renders the whole app from here with no network at all.
 */

export const DEMO_GENOME: BrandGenome = {
  id: "gen_legacyai",
  sourceUrl: "https://legacy-ai.de",
  name: "Legacy AI",
  tagline: "The expertise stays. The person moves on.",
  voice: {
    adjectives: ["deliberate", "honest", "technically rigorous"],
    petPhrases: [
      "Your best people retire on Friday. The know-how leaves with them.",
      "answers carry citations, or none at all",
      "The expertise stays. The person moves on.",
      "The most valuable answer is sometimes 'I don't know.'",
      "Honesty is the default, not a setting",
      "Thirty years of judgement, not thirty years of documents",
      "Built for the shop floor, not the showroom",
      "No confident guessing. Ever.",
    ],
    forbiddenWords: [
      "revolutionary",
      "game-changer",
      "AI-powered",
      "synergy",
      "seamless",
      "disrupt",
      "unlock",
    ],
    sentenceStyle:
      "Short declaratives. One idea per line. Concrete nouns, almost no adjectives. A single-sentence paragraph used as a full stop.",
    emojiPolicy: "none",
  },
  look: {
    palette: ["#0B1F1A", "#E8DCC8", "#C1440E", "#1B4D3E", "#F5F1E8"],
    typographyVibe:
      "Industrial grotesk headlines over generous leading. Engineering-drawing restraint — rules, not boxes.",
    imageryStyle:
      "Documentary photography of workshops and control rooms. Deep shadow, one warm accent, real hands on real machines. No stock smiles.",
  },
  substance: {
    pillars: [
      "The demographic cliff in German industry",
      "Structured expert interviews, at scale",
      "Citation-bound retrieval",
      "Knowledge that survives the handover",
      "On-premise and GDPR by default",
      "Measurable time-to-answer on the shop floor",
    ],
    icp: "Mittelstand manufacturers, 200–5,000 employees, where a handful of specialists over 60 hold the process knowledge. Plant managers, heads of maintenance, and knowledge leads who already know the date of the first retirement.",
    proofPoints: [
      "41 expert interviews captured at a Baden-Württemberg tooling group before the lead machinist retired",
      "Median time-to-answer for a line stoppage question fell from 3 days to 4 minutes",
      "Every answer ships with the interview timestamp and document page it came from",
    ],
  },
  hooks: [
    "Your best {role} retires in {timeframe}. What leaves with them?",
    "{number} years of judgement. {number} pages of documentation. These are not the same asset.",
    "We asked {role} the question nobody writes down: {question}",
    "The most expensive sentence in a factory: {quote}",
    "{company} lost {knowledge} on a Friday. Here is what we changed on the Monday.",
  ],
  voiceId: "demo-cloned-voice",
};

const LINKEDIN = `Your best people retire on Friday. The know-how leaves with them.

We spent March in a tooling group outside Stuttgart. One machinist, 38 years on the same five machines, four months from retirement. Nobody could name a successor.

His knowledge was not in the documentation. It was in the way he listened to a spindle before a bearing failed.

So we asked him. 41 interviews, structured, recorded, timestamped.

What we learned about capturing that kind of expertise:

1. Documents are the wrong starting point. They record decisions, not judgement. The judgement lives in the exceptions — and the exceptions were never written down.

2. The interview has to be adversarial, gently. "How do you know?" three times in a row gets you further than any questionnaire.

3. Answers carry citations, or none at all. When a 26-year-old technician asks the system why a tolerance is 0.02 and not 0.05, they get the answer and the minute of the interview it came from. Trust is a chain of custody.

4. The most valuable answer is sometimes "I don't know." A system that guesses confidently on a shop floor is worse than no system.

He retired in June. The line still runs.

The expertise stays. The person moves on.`;

const THREAD = [
  "Your best people retire on Friday. The know-how leaves with them.\n\nWe spent March capturing 38 years of one machinist's judgement before he walked out the door. Here is what actually worked.",
  "The documentation was never the problem.\n\nEvery process was written down. None of it explained how he knew a bearing was going three weeks before the sensors did.\n\nThirty years of judgement, not thirty years of documents.",
  "Structured interviews beat document ingestion, every time.\n\nThe trick is asking \"how do you know?\" three times in a row. The first answer is the procedure. The third answer is the expertise.",
  "Every answer the system gives cites the interview minute it came from.\n\nA technician asks why the tolerance is 0.02. They get the reason, and they get to hear him say it.\n\nAnswers carry citations, or none at all.",
  "And when it doesn't know, it says so.\n\nOn a shop floor, a confident guess costs more than a shrug. The most valuable answer is sometimes \"I don't know.\"\n\nHe retired in June. The line still runs.",
];

export const DEMO_DROP: Drop = {
  id: "drop_demo_legacyai",
  genomeId: "gen_legacyai",
  source: { kind: "topic", topic: "capturing expert knowledge before retirement" },
  linkedin: LINKEDIN,
  thread: THREAD,
  carousel: {
    slides: [
      {
        headline: "Friday, 4pm",
        body: "38 years of judgement walks out of the building. The documentation stays. It was never the part that mattered.",
        imagePrompt:
          "Empty machine shop at dusk, single warm work lamp, long shadows, documentary photography",
        imageUrl: "https://picsum.photos/seed/x1/1080",
      },
      {
        headline: "Ask how you know",
        body: "Three times in a row. The first answer is the procedure. The third answer is the expertise.",
        imagePrompt: "Close crop of weathered hands on a lathe control, deep green shadow, warm rim light",
        imageUrl: "https://picsum.photos/seed/x2/1080",
      },
      {
        headline: "Citations, or nothing",
        body: "Every answer ships with the interview minute it came from. Trust is a chain of custody.",
        imagePrompt:
          "Annotated engineering drawing on a workbench, ochre accent marks, overhead documentary shot",
        imageUrl: "https://picsum.photos/seed/x3/1080",
      },
      {
        headline: "The line still runs",
        body: "He retired in June. The expertise stays. The person moves on.",
        imagePrompt: "Production line running at night, shallow depth of field, one warm orange accent",
        imageUrl: "https://picsum.photos/seed/x4/1080",
      },
    ],
  },
  short: {
    imageUrls: [
      "https://picsum.photos/seed/s1/1080/1920",
      "https://picsum.photos/seed/s2/1080/1920",
      "https://picsum.photos/seed/s3/1080/1920",
      "https://picsum.photos/seed/s4/1080/1920",
    ],
    voUrl: "/demo/vo.m4a",
    captionGroups: [
      "Your best people",
      "retire on Friday",
      "The know-how leaves",
      "Thirty years of judgement",
      "not thirty years of documents",
      "The expertise stays",
    ],
    durationSec: 17.9,
  },
  status: "draft",
};

/** Replayed on a timer in demo mode so the offline run looks identical to the live one. */
export const DEMO_GENOME_TRACE: Trace[] = [
  { t: "step", msg: "reading brand surface" },
  { t: "ok", msg: "homepage read (14,203 chars)" },
  { t: "ok", msg: "6 sources found" },
  { t: "step", msg: "extracting voice fingerprint" },
  { t: "ok", msg: "voice: deliberate · honest · technically rigorous" },
  { t: "ok", msg: "palette: #0B1F1A  #E8DCC8  #C1440E" },
  { t: "ok", msg: "8 pet phrases captured" },
  { t: "genome", genome: DEMO_GENOME },
  { t: "done" },
];

export const DEMO_DROP_TRACE: Trace[] = [
  { t: "step", msg: "writing as Legacy AI" },
  { t: "ok", msg: "LinkedIn post · 231 words" },
  { t: "ok", msg: "thread · 5 posts" },
  { t: "ok", msg: "carousel · 4 slides" },
  { t: "step", msg: "rendering visuals in their palette" },
  { t: "ok", msg: "4 carousel images" },
  { t: "ok", msg: "voiceover · 18s in their cloned voice" },
  { t: "ok", msg: "vertical short assembled" },
  { t: "done" },
];
