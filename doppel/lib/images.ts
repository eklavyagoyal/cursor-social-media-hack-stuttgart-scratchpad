import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

// ponytail: schnell over dev — 4 steps, cents, and the demo needs speed not fidelity.
const MODEL = "fal-ai/flux/schnell";

const guard = (palette: string[]) =>
  `Strict colour palette, use only these: ${palette.join(", ")}. ` +
  `Editorial, abstract, generous negative space for text overlay. ` +
  `No text, no letters, no numbers, no logos, no watermarks, no human faces.`;

/**
 * All N images in ONE call. Fixed seed so a rerun is byte-identical —
 * that's what makes the cached demo path match the live path exactly.
 */
export async function generateImages(
  prompts: string[],
  palette: string[],
  opts: { vertical?: boolean; seed?: number } = {}
): Promise<string[]> {
  const { vertical = false, seed = 7 } = opts;

  const results = await Promise.all(
    prompts.map(async (p, i) => {
      const r: any = await fal.subscribe(MODEL, {
        input: {
          prompt: `${p}. ${guard(palette)}`,
          image_size: vertical ? "portrait_16_9" : "square_hd",
          num_inference_steps: 4,
          num_images: 1,
          seed: seed + i,
          enable_safety_checker: false,
        },
      });
      const url = r?.data?.images?.[0]?.url ?? r?.images?.[0]?.url;
      if (!url) throw new Error(`fal: no image url for prompt ${i}`);
      return url as string;
    })
  );

  return results;
}
