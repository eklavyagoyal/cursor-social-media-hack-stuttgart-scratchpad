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

/** What POST /api/process returns. */
export type ProcessResult = {
  slug: string;
  source: SourceInfo;
  rawUrl: string;
  transcript: Transcript;
  plan: CutPlan;
  captions: CaptionGroup[];
  render: RenderResult;
};

export type PublishTarget = "instagram" | "telegram";

export type PublishResult = {
  target: PublishTarget;
  status: "posted" | "queued" | "skipped" | "error";
  url?: string;
  id?: string;
  error?: string;
};
