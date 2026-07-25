import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Transcript, Word, WordType } from "./types";

const SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/**
 * Called over REST rather than through the SDK: the generated client mangles the
 * `words` field of the response, and word timings are the whole point here.
 */
type ScribeWord = {
  text: string;
  start?: number;
  end?: number;
  type?: string;
};

type ScribeResponse = {
  language_code?: string;
  text?: string;
  words?: ScribeWord[];
};

function coerceType(raw: string | undefined): WordType {
  if (raw === "spacing" || raw === "audio_event") return raw;
  return "word";
}

export type TranscribeOptions = {
  /** ISO code, e.g. "de". Omit to let Scribe detect it. */
  languageCode?: string;
  modelId?: string;
};

export async function transcribeFile(
  filePath: string,
  options: TranscribeOptions = {},
): Promise<Transcript> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing from .env.local");

  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)]), path.basename(filePath));
  form.append("model_id", options.modelId ?? "scribe_v1");
  form.append("timestamps_granularity", "word");
  form.append("diarize", "false");
  form.append("tag_audio_events", "false");
  if (options.languageCode) form.append("language_code", options.languageCode);

  const res = await fetch(SCRIBE_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Scribe ${res.status}: ${detail.slice(0, 400)}`);
  }

  const json = (await res.json()) as ScribeResponse;
  const words: Word[] = (json.words ?? [])
    .filter((w) => typeof w.start === "number" && typeof w.end === "number")
    .map((w) => ({
      text: w.text ?? "",
      start: w.start as number,
      end: w.end as number,
      type: coerceType(w.type),
    }));

  return {
    text: json.text ?? "",
    languageCode: json.language_code ?? options.languageCode ?? "unknown",
    words,
  };
}
