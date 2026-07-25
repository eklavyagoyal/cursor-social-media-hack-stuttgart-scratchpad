import Anthropic from "@anthropic-ai/sdk";
import {
  DROP_SCHEMA,
  DROP_SYSTEM,
  IDEAS_SCHEMA,
  IDEAS_SYSTEM,
  dropUserFromTopic,
  dropUserFromTranscript,
  ideasUser,
} from "./prompts";
import type { BrandGenome, Drop } from "./types";

const anthropic = new Anthropic();

async function json<T>(system: string, user: string, schema: unknown, maxTokens = 8000): Promise<T> {
  const res = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: maxTokens,
    system,
    output_config: { format: { type: "json_schema", schema: schema as any } },
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text block in response");
  return JSON.parse(block.text) as T;
}

export type DropCopy = {
  linkedin: string;
  thread: string[];
  carousel: { slides: { headline: string; body: string; imagePrompt: string }[] };
  short: { voScript: string; captionGroups: string[]; imagePrompts: string[] };
};

/** All five assets' copy in one call — five calls would drift stylistically. */
export function writeCopy(genome: BrandGenome, src: Drop["source"]) {
  const user =
    src.kind === "topic"
      ? dropUserFromTopic(genome, src.topic)
      : dropUserFromTranscript(genome, src.transcript);
  return json<DropCopy>(DROP_SYSTEM, user, DROP_SCHEMA);
}

export type Idea = { angle: string; hook: string; quote: string; pillar: string };

/** One video -> 5 distinct angles. Fills the queue; each can become its own Drop. */
export async function mineIdeas(genome: BrandGenome, transcript: string): Promise<Idea[]> {
  const { ideas } = await json<{ ideas: Idea[] }>(
    IDEAS_SYSTEM,
    ideasUser(genome, transcript),
    IDEAS_SCHEMA,
    4000
  );
  return ideas;
}
