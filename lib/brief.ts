import OpenAI from "openai";
import type { ShootBrief, Shot } from "./types";

// Overridable so credits can be traded for quality without a deploy. Checked for
// emptiness, not just for undefined: a declared-but-blank env var is the normal
// state of an optional field in a deploy UI, and `??` would pass "" straight to
// the API.
const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5.6";

const SHOT_SCHEMA = {
  type: "object",
  properties: {
    n: { type: "integer", description: "1-based shot number" },
    label: { type: "string", description: "Role of the shot, e.g. Hook, Problem, Beweis, Payoff" },
    seconds: { type: "number", description: "Target length in seconds" },
    say: { type: "string", description: "Exactly what to say on camera. Spoken language, no bullet points." },
    camera: { type: "string", description: "Concrete framing and movement for a single phone, no crew." },
    // Strict structured outputs require every property in `required`, so an
    // optional field has to be spelled as a nullable one instead.
    onScreen: {
      type: ["string", "null"],
      description: "Short on-screen text, or null when the shot needs none.",
    },
  },
  required: ["n", "label", "seconds", "say", "camera", "onScreen"],
  additionalProperties: false,
} as const;

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    hook: { type: "string", description: "The first sentence. Must work in the first 2 seconds, muted." },
    totalSeconds: { type: "number" },
    shots: { type: "array", items: SHOT_SCHEMA, minItems: 3, maxItems: 6 },
    caption: { type: "string", description: "Instagram caption, first line readable before the More cut." },
    hashtags: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 12 },
    cta: { type: "string" },
    soundIdea: { type: "string", description: "What kind of audio to use, or 'Originalton'." },
    bestPostTime: { type: "string", description: "Local time window, e.g. 'Di 18:30-20:00'." },
  },
  required: ["hook", "totalSeconds", "shots", "caption", "hashtags", "cta", "soundIdea", "bestPostTime"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a director and content strategist for Instagram Reels.

You get a topic and deliver a SHOOTING SCRIPT one person can film on a phone in
under 10 minutes. No crew, no lighting setup, no studio.

Rules:
- The hook has to land in the first 2 seconds, sound off.
- "say" is spoken language, the way people actually talk. No bullet points, no
  marketing filler, no words nobody says out loud.
- "camera" is a concrete instruction: framing, height, movement, distance.
  Example: "phone vertical at chest height, arm extended, walking as you talk" —
  not "dynamic shot".
- Total length between 15 and 40 seconds. The shots must add up to it.
- Address the creator as "you".
- Answer in English, whatever language the topic or the brand context is in.`;

export type BriefInput = {
  topic: string;
  /** Optional voice/brand grounding, e.g. scraped profile or website text. */
  context?: string;
  targetSeconds?: number;
};

function normalize(raw: Record<string, unknown>, topic: string): ShootBrief {
  const shots: Shot[] = (Array.isArray(raw.shots) ? raw.shots : []).map(
    (s: Record<string, unknown>, i: number) => ({
      n: typeof s.n === "number" ? s.n : i + 1,
      label: String(s.label ?? `Shot ${i + 1}`),
      seconds: Number(s.seconds ?? 5),
      say: String(s.say ?? ""),
      camera: String(s.camera ?? ""),
      ...(s.onScreen ? { onScreen: String(s.onScreen) } : {}),
    }),
  );

  const hashtags = (Array.isArray(raw.hashtags) ? raw.hashtags : [])
    .map((h) => String(h).trim())
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .filter((h) => h.length > 1);

  return {
    id: `brief-${Date.now().toString(36)}`,
    topic,
    hook: String(raw.hook ?? ""),
    totalSeconds:
      Number(raw.totalSeconds) || shots.reduce((sum, s) => sum + s.seconds, 0) || 25,
    shots,
    caption: String(raw.caption ?? ""),
    hashtags,
    cta: String(raw.cta ?? ""),
    soundIdea: String(raw.soundIdea ?? "Originalton"),
    bestPostTime: String(raw.bestPostTime ?? ""),
    createdAt: new Date().toISOString(),
  };
}

export async function generateBrief(input: BriefInput): Promise<ShootBrief> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY fehlt in .env.local");
  const client = new OpenAI();

  const parts = [`THEMA: ${input.topic}`];
  if (input.targetSeconds) parts.push(`TARGET LENGTH: about ${input.targetSeconds} seconds`);
  if (input.context) {
    parts.push(
      `ACCOUNT CONTEXT (match this voice):\n${input.context.slice(0, 20_000)}`,
    );
  }

  const res = await client.responses.create({
    model: MODEL,
    // Reasoning tokens are billed against this budget, so it needs headroom the
    // brief itself never uses — a truncated response is invalid JSON.
    max_output_tokens: 8000,
    // Writing a shoot brief is a creative task, not an analytical one. Low effort
    // keeps it fast, and latency is what the room feels during a live demo.
    reasoning: { effort: "low" },
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: parts.join("\n\n") },
    ],
    text: {
      format: { type: "json_schema", name: "shoot_brief", strict: true, schema: BRIEF_SCHEMA },
    },
  });

  if (res.incomplete_details) {
    throw new Error(
      `Answer cut off (${res.incomplete_details.reason}) — check OPENAI_MODEL or the token budget.`,
    );
  }
  if (!res.output_text) throw new Error("The model returned no text.");

  return normalize(JSON.parse(res.output_text) as Record<string, unknown>, input.topic);
}
