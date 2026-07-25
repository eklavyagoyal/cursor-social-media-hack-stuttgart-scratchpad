import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Word } from "./types";

const API = "https://api.elevenlabs.io/v1";

/** Multilingual, so a German script reads correctly in the same voice. */
const DEFAULT_MODEL = "eleven_multilingual_v2";

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing from .env.local");
  return key;
}

export type VoiceOption = {
  id: string;
  name: string;
  /** "premade" for stock voices, "cloned" for one of your own. */
  category: string;
  /** Free-form tags from ElevenLabs: "social_media", "male", "young", … */
  labels: string[];
  /** Short sample, so a voice can be judged before a render is spent on it. */
  previewUrl?: string;
};

type RawVoice = {
  voice_id?: string;
  name?: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
};

/**
 * Voices the account can actually use.
 *
 * Cached for the life of the process: the list changes only when someone clones a
 * voice, and the picker would otherwise re-fetch on every page load.
 */
let cache: { at: number; voices: VoiceOption[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

export async function listVoices(): Promise<VoiceOption[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.voices;

  const res = await fetch(`${API}/voices`, {
    headers: { "xi-api-key": apiKey() },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs voices ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { voices?: RawVoice[] };
  const voices: VoiceOption[] = (json.voices ?? [])
    .filter((v) => v.voice_id)
    .map((v) => ({
      id: v.voice_id as string,
      name: (v.name ?? "").replace(/\s*-\s*.*$/, "").trim() || (v.voice_id as string),
      category: v.category ?? "premade",
      labels: Object.values(v.labels ?? {}).filter(Boolean),
      ...(v.preview_url ? { previewUrl: v.preview_url } : {}),
    }))
    // A voice of your own belongs at the top of the list, ahead of the stock ones.
    .sort((a, b) => {
      const own = Number(b.category !== "premade") - Number(a.category !== "premade");
      return own !== 0 ? own : a.name.localeCompare(b.name);
    });

  cache = { at: Date.now(), voices };
  return voices;
}

export type SpokenLine = {
  /** Where the mp3 was written. */
  path: string;
  duration: number;
  /** Word timings on the spoken timeline, exact rather than inferred. */
  words: Word[];
  text: string;
};

type TimestampResponse = {
  audio_base64?: string;
  alignment?: Alignment;
  normalized_alignment?: Alignment;
};

type Alignment = {
  characters?: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
};

/**
 * Groups the per-character alignment into words.
 *
 * This is the reason the with-timestamps endpoint is worth the larger response:
 * ElevenLabs reports when each character is actually spoken, so captions over a
 * generated voice are exact. Scribe timings on filmed audio are a transcription's
 * best estimate — good, but estimated.
 */
function wordsFromAlignment(al: Alignment): Word[] {
  const chars = al.characters ?? [];
  const starts = al.character_start_times_seconds ?? [];
  const ends = al.character_end_times_seconds ?? [];

  const words: Word[] = [];
  let text = "";
  let start = 0;
  let end = 0;

  const flush = () => {
    const trimmed = text.trim();
    if (trimmed && end > start) {
      words.push({ text: trimmed, start, end, type: "word" });
    }
    text = "";
  };

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      flush();
      continue;
    }
    if (!text) start = starts[i] ?? end;
    text += c;
    end = ends[i] ?? end;
  }
  flush();

  return words;
}

export type SpeakOptions = {
  text: string;
  voiceId: string;
  /** Written here as `${slug}.mp3`. */
  outDir: string;
  slug: string;
  modelId?: string;
};

/** Speaks one line and returns it with word-level timings. */
export async function speak(options: SpeakOptions): Promise<SpokenLine> {
  const text = options.text.trim();
  if (!text) throw new Error("Nothing to speak — the shot has no line.");

  const url =
    `${API}/text-to-speech/${encodeURIComponent(options.voiceId)}/with-timestamps` +
    `?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: options.modelId ?? DEFAULT_MODEL }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as TimestampResponse;
  if (!json.audio_base64) throw new Error("ElevenLabs returned no audio.");

  const al = json.alignment ?? json.normalized_alignment;
  if (!al) throw new Error("ElevenLabs returned no alignment — captions would be guesswork.");

  const words = wordsFromAlignment(al);
  const duration = al.character_end_times_seconds?.at(-1) ?? words.at(-1)?.end ?? 0;
  if (!duration) throw new Error("The spoken line came back empty.");

  await mkdir(options.outDir, { recursive: true });
  const outFile = path.join(options.outDir, `${options.slug}.mp3`);
  await writeFile(outFile, Buffer.from(json.audio_base64, "base64"));

  return { path: outFile, duration, words, text };
}
