import Anthropic from "@anthropic-ai/sdk";
import { GENOME_SCHEMA, GENOME_SYSTEM, genomeUser, normalizeGenome } from "./prompts";
import type { BrandGenome } from "./types";

const anthropic = new Anthropic();

export async function extractGenome(sourceUrl: string, corpus: string): Promise<BrandGenome> {
  const res = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: GENOME_SYSTEM,
    output_config: { format: { type: "json_schema", schema: GENOME_SCHEMA as any } },
    messages: [{ role: "user", content: genomeUser(sourceUrl, corpus) }],
  });

  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("genome: no text block in response");

  return normalizeGenome(JSON.parse(text.text), sourceUrl);
}
