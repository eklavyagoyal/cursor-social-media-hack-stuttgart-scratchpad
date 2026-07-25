import type { CaptionGroup, Cut, CutPlan, KeepSpan, Word } from "./types";

/**
 * Pure hesitation sounds. Safe to remove — they never carry meaning.
 */
const HESITATIONS = new Set([
  "ähm", "ähm.", "äh", "ah", "ehm", "öhm", "em", "hm", "hmm", "mhm",
  "um", "uh", "erm", "uhm", "eh",
]);

/**
 * Discourse fillers. Removing these reads as a tighter edit, but they *can* be
 * load-bearing ("also" as "therefore", "like" as a comparison), so they are
 * opt-in rather than default.
 */
const DISCOURSE = new Set([
  "also", "halt", "quasi", "irgendwie", "sozusagen", "eigentlich", "genau",
  "like", "basically", "actually", "literally", "honestly",
]);

export type CutOptions = {
  /** Pauses longer than this get removed. */
  maxPause: number;
  /** Breathing room kept around each speech span so consonants aren't clipped. */
  pad: number;
  /** Spans shorter than this are dropped instead of becoming a one-frame flash. */
  minSpan: number;
  /** Cuts shorter than this aren't worth the jump — leave them in. */
  minCut: number;
  /** Also strip "also", "quasi", "like", ... */
  aggressive: boolean;
};

export const DEFAULT_CUT_OPTIONS: CutOptions = {
  maxPause: 0.35,
  pad: 0.07,
  minSpan: 0.2,
  minCut: 0.12,
  aggressive: false,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:…"'„“”]/g, "").trim();
}

export function isFiller(text: string, aggressive: boolean): boolean {
  const t = normalize(text);
  if (!t) return false;
  if (HESITATIONS.has(t)) return true;
  return aggressive && DISCOURSE.has(t);
}

function spokenWords(words: Word[]): Word[] {
  return words
    .filter(
      (w) =>
        w.type === "word" &&
        Number.isFinite(w.start) &&
        Number.isFinite(w.end) &&
        w.end > w.start,
    )
    .sort((a, b) => a.start - b.start);
}

export function buildCutPlan(
  words: Word[],
  sourceDuration: number,
  options: Partial<CutOptions> = {},
): CutPlan {
  const opt = { ...DEFAULT_CUT_OPTIONS, ...options };
  const speech = spokenWords(words);

  // No usable transcript: keep the clip untouched rather than guessing.
  if (speech.length === 0) {
    return {
      sourceDuration,
      outDuration: sourceDuration,
      removedSeconds: 0,
      keep: [{ start: 0, end: sourceDuration }],
      cuts: [],
    };
  }

  const fillers = speech.filter((w) => isFiller(w.text, opt.aggressive));
  const kept = speech.filter((w) => !isFiller(w.text, opt.aggressive));
  if (kept.length === 0) {
    return {
      sourceDuration,
      outDuration: sourceDuration,
      removedSeconds: 0,
      keep: [{ start: 0, end: sourceDuration }],
      cuts: [],
    };
  }

  const clamp = (t: number) => Math.min(Math.max(t, 0), sourceDuration);

  let spans: KeepSpan[] = [];
  let cur: KeepSpan = {
    start: clamp(kept[0].start - opt.pad),
    end: clamp(kept[0].end + opt.pad),
  };

  for (const w of kept.slice(1)) {
    const gap = w.start - opt.pad - cur.end;
    if (gap <= opt.maxPause) {
      cur.end = clamp(w.end + opt.pad);
    } else {
      spans.push(cur);
      cur = { start: clamp(w.start - opt.pad), end: clamp(w.end + opt.pad) };
    }
  }
  spans.push(cur);

  spans = spans.filter((s) => s.end - s.start >= opt.minSpan);
  if (spans.length === 0) spans = [{ start: 0, end: sourceDuration }];

  // A cut shorter than minCut is more distracting than the pause it removes.
  const merged: KeepSpan[] = [spans[0]];
  for (const s of spans.slice(1)) {
    const prev = merged[merged.length - 1];
    if (s.start - prev.end < opt.minCut) prev.end = s.end;
    else merged.push({ ...s });
  }

  const cuts: Cut[] = [];
  const addCut = (start: number, end: number, fallback: Cut["reason"]) => {
    if (end - start < opt.minCut) return;
    const filler = fillers.find((f) => f.start >= start - 0.02 && f.end <= end + 0.02);
    cuts.push({
      start,
      end,
      reason: filler ? "filler" : fallback,
      ...(filler ? { text: filler.text.trim() } : {}),
    });
  };

  addCut(0, merged[0].start, "head");
  for (let i = 0; i < merged.length - 1; i++) {
    addCut(merged[i].end, merged[i + 1].start, "silence");
  }
  addCut(merged[merged.length - 1].end, sourceDuration, "tail");

  const outDuration = merged.reduce((sum, s) => sum + (s.end - s.start), 0);

  return {
    sourceDuration,
    outDuration,
    removedSeconds: Math.max(0, sourceDuration - outDuration),
    keep: merged,
    cuts,
  };
}

/**
 * Maps a timestamp on the source timeline onto the output timeline.
 * Returns null when the timestamp falls inside a removed region.
 */
export function toOutputTime(keep: KeepSpan[], t: number): number | null {
  let offset = 0;
  for (const s of keep) {
    if (t < s.start) return null;
    if (t <= s.end) return offset + (t - s.start);
    offset += s.end - s.start;
  }
  return null;
}

export type CaptionOptions = {
  maxWords: number;
  maxSeconds: number;
  uppercase: boolean;
};

export const DEFAULT_CAPTION_OPTIONS: CaptionOptions = {
  maxWords: 3,
  maxSeconds: 1.3,
  uppercase: true,
};

/**
 * Word-grouped captions on the output timeline. Short groups are what makes
 * captions readable on a phone — full sentences are unreadable at 9:16.
 */
export function buildCaptions(
  words: Word[],
  plan: CutPlan,
  options: Partial<CaptionOptions> = {},
): CaptionGroup[] {
  const opt = { ...DEFAULT_CAPTION_OPTIONS, ...options };

  const mapped = spokenWords(words)
    .map((w) => {
      const start = toOutputTime(plan.keep, w.start);
      const end = toOutputTime(plan.keep, w.end);
      return start === null || end === null || end <= start
        ? null
        : { text: w.text.trim(), start, end };
    })
    .filter((w): w is { text: string; start: number; end: number } => w !== null)
    .filter((w) => w.text.length > 0);

  const groups: CaptionGroup[] = [];
  let buf: typeof mapped = [];

  const flush = () => {
    if (buf.length === 0) return;
    const text = buf.map((w) => w.text).join(" ");
    groups.push({
      start: buf[0].start,
      end: buf[buf.length - 1].end,
      text: opt.uppercase ? text.toUpperCase() : text,
    });
    buf = [];
  };

  for (const w of mapped) {
    buf.push(w);
    const spanTooLong = w.end - buf[0].start >= opt.maxSeconds;
    const endsSentence = /[.!?…]$/.test(w.text);
    if (buf.length >= opt.maxWords || spanTooLong || endsSentence) flush();
  }
  flush();

  // Close small holes so captions don't flicker between groups.
  for (let i = 0; i < groups.length - 1; i++) {
    const gap = groups[i + 1].start - groups[i].end;
    if (gap > 0 && gap < 0.2) groups[i].end = groups[i + 1].start;
  }

  return groups;
}
