// The two contracts. Everything codes against these. Do not change after 10:20.

export type BrandGenome = {
  id: string;
  sourceUrl: string;
  name: string;
  tagline?: string;
  voice: {
    adjectives: string[]; // 3
    petPhrases: string[]; // 8, verbatim from the source — the magic field
    forbiddenWords: string[];
    sentenceStyle: string;
    emojiPolicy: "none" | "sparing" | "heavy";
  };
  look: { palette: string[]; typographyVibe: string; imageryStyle: string };
  substance: { pillars: string[]; icp: string; proofPoints: string[] };
  hooks: string[]; // 5 patterns with {placeholders}
  voiceId?: string; // ElevenLabs cloned voice
};

export type Slide = { headline: string; body: string; imagePrompt: string; imageUrl?: string };

export type Drop = {
  id: string;
  genomeId: string;
  /** Where the idea came from: a typed topic, or a transcribed video. */
  source: { kind: "topic"; topic: string } | { kind: "video"; filename: string; transcript: string };
  linkedin: string;
  thread: string[];
  carousel: { slides: Slide[] };
  /** The vertical short. Composited in the browser — no mp4 encode. */
  short?: { imageUrls: string[]; voUrl: string; captionGroups: string[]; durationSec: number };
  status: "draft" | "approved" | "published";
  published?: { platform: string; url: string; at: string }[];
  queued?: { platform: string; reason: string }[];
};

/** SSE trace events — the UI's whole personality. */
export type Trace =
  | { t: "step"; msg: string }
  | { t: "ok"; msg: string }
  | { t: "warn"; msg: string }
  | { t: "error"; msg: string }
  | { t: "genome"; genome: BrandGenome }
  | { t: "drop"; drop: Drop }
  | { t: "done" };
