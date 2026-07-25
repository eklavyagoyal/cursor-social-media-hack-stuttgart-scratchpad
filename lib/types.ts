// The two contracts everything else codes against. Do not widen these after 13:00.

export type Shot = {
  n: number;
  label: string;
  seconds: number;
  say: string;
  camera: string;
  onScreen?: string;
};

export type ShootBrief = {
  id: string;
  topic: string;
  hook: string;
  totalSeconds: number;
  shots: Shot[];
  caption: string;
  hashtags: string[];
  cta: string;
  soundIdea: string;
  bestPostTime: string;
  createdAt: string;
};

export type WordType = "word" | "spacing" | "audio_event";

export type Word = {
  text: string;
  start: number;
  end: number;
  type: WordType;
};

export type Transcript = {
  text: string;
  languageCode: string;
  words: Word[];
};

export type KeepSpan = { start: number; end: number };

export type CutReason = "silence" | "filler" | "head" | "tail";

export type Cut = {
  start: number;
  end: number;
  reason: CutReason;
  text?: string;
};

export type CutPlan = {
  sourceDuration: number;
  outDuration: number;
  removedSeconds: number;
  keep: KeepSpan[];
  cuts: Cut[];
};

/** Caption timings live on the *output* timeline, after cuts are applied. */
export type CaptionGroup = { start: number; end: number; text: string };

export type RenderResult = {
  path: string;
  publicUrl: string;
  width: number;
  height: number;
  duration: number;
  sizeBytes: number;
};

export type SourceInfo = {
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
};

/**
 * Where a take's audio comes from.
 *
 * "original" is the filmed sound: transcribed, then cut on its silences and
 * fillers. "voice" discards it and speaks the shot's scripted line instead, which
 * is what makes silent footage usable.
 */
export type ClipMode = "original" | "voice";

/** One uploaded take: cut and captioned on its own before anything is joined. */
export type ClipResult = {
  /** Position in the shoot order, which is the shot it was filmed for. */
  index: number;
  /** The shot's heading, carried through so the result reads like the script. */
  label?: string;
  mode: ClipMode;
  /** Present for "voice" takes: which voice spoke, and what it said. */
  voice?: { id: string; name?: string; text: string };
  slug: string;
  source: SourceInfo;
  rawUrl: string;
  transcript: Transcript;
  plan: CutPlan;
  captions: CaptionGroup[];
  render: RenderResult;
};

/**
 * What POST /api/process returns.
 *
 * The single-clip fields are still required, because one clip is still the
 * shortest path to a finished reel and every existing view codes against them.
 * A multi-clip run fills them from its first take and puts the whole shoot in
 * `clips`, with `render` pointing at the joined result rather than that take.
 */
export type ProcessResult = {
  slug: string;
  source: SourceInfo;
  rawUrl: string;
  transcript: Transcript;
  plan: CutPlan;
  captions: CaptionGroup[];
  render: RenderResult;
  /** Always present; length 1 for a single upload. */
  clips: ClipResult[];
};

export type PublishTarget = "instagram" | "telegram";

export type PublishResult = {
  target: PublishTarget;
  status: "posted" | "queued" | "skipped" | "error";
  url?: string;
  id?: string;
  error?: string;
};
