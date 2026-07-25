# 06 — Sponsor Playbook

**"Strong sponsor tool integration" is written into the 30% Technical Innovation criterion.**
Using all five isn't prize-farming — it's scoring. Each is on the critical path below.

> ⚠️ **Model slugs and SDK method names drift.** Every snippet here is structurally right; verify the
> exact model ID / method against the provider's dashboard or docs at 10:00. Marked 🔍 where it matters.

| Sponsor | Role in Doppel | Where it shows in the demo |
|---|---|---|
| **Firecrawl** | URL → brand surface | The trace: *"8 sources found"* |
| **Claude** | Genome extraction + all copy | The Genome card + every asset |
| **fal.ai** | On-palette images (+ P1 video) | The carousel + the vertical short |
| **ElevenLabs** | Voice clone → VO (+ P1 dub) | **The gasp.** The narration. |
| **n8n** | Publish fan-out + nightly loop | The canvas + the real post |
| **Cursor** | How we built it | 3-second nod in the video |

---

## 1 · Firecrawl — one URL → the brand surface

**Prize hook:** *"We turn a single URL into a structured brand identity — Firecrawl is the sensor."*
This is arguably the best possible Firecrawl demo: schema'd extraction, not scraping.

```ts
// lib/crawl.ts
import FirecrawlApp from "@mendable/firecrawl-js";
const fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

// 🔍 v1 = scrapeUrl(); newer builds expose scrape(). Check the installed package's types.
export async function crawlBrand(url: string) {
  const home = await fc.scrapeUrl(url, {
    formats: ["markdown", "links"],
    onlyMainContent: true,
    timeout: 20_000,
  });

  // Follow the pages that actually carry voice
  const juicy = (home.links ?? [])
    .filter((l: string) => /about|story|blog|manifesto|values|team|press/i.test(l))
    .slice(0, 5);

  const pages = await Promise.allSettled(
    juicy.map((l) => fc.scrapeUrl(l, { formats: ["markdown"], onlyMainContent: true, timeout: 15_000 }))
  );

  return [home, ...pages.filter((p) => p.status === "fulfilled").map((p: any) => p.value)];
}
```

**Also worth 20 minutes (big innovation points):** Firecrawl `search` for the nightly trend sweep —
*"it finds what's trending in the creator's niche before it writes."* → [`07`](07-N8N-AUTOMATION.md)

**Gotchas:** JS-only SPAs return near-empty markdown → fall back to the cached Genome and say
*"their site's fighting us."* Budget your credits: 6 pages/brand × ~15 brands = fine on free tier.

---

## 2 · Claude — Genome extraction with guaranteed JSON

Use **`claude-opus-5`** with structured outputs so the card can never render broken.

```ts
// lib/genome.ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic();               // reads ANTHROPIC_API_KEY

export async function extractGenome(pages: { markdown: string }[], sourceUrl: string) {
  const corpus = pages.map((p) => p.markdown).join("\n\n---\n\n").slice(0, 120_000);

  const res = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: { format: { type: "json_schema", schema: GENOME_SCHEMA } },
    system: GENOME_SYSTEM,                        // → docs/09-PROMPTS.md
    messages: [{ role: "user", content: `SOURCE: ${sourceUrl}\n\n${corpus}` }],
  });

  const text = res.content.find((b) => b.type === "text")!.text;
  return normalizeGenome(JSON.parse(text));      // clamp array lengths, normalize hex
}
```

`GENOME_SCHEMA`, `GENOME_SYSTEM` and the copy prompts live in [`09-PROMPTS.md`](09-PROMPTS.md).

For the **copy** call, stream it (`anthropic.messages.stream`) so text appears while images render.
Pricing: opus-5 is $5/$25 per M tokens. A day of this is a few euros. Don't downgrade the model to
save cents — quality of voice-mimicry is the entire product.

---

## 3 · fal.ai — on-palette images

**Prize hook:** *"Every image is generated inside the brand's own palette, extracted seconds earlier."*
Grounding generation in extracted brand data is a much better story than "we made a picture."

```ts
// lib/images.ts
import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_KEY });

// 🔍 verify slugs at fal.ai/models — flux/schnell is fast+cheap, flux/dev is prettier
export async function carouselImage(prompt: string, palette: string[], i: number) {
  const r: any = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: `${prompt}. Editorial, abstract, generous negative space for text overlay.
Strict palette: ${palette.join(", ")}. No text, no letters, no logos, no watermark.`,
      image_size: "square_hd",       // portrait_16_9 for the vertical short
      num_inference_steps: 4,
      seed: 1000 + i,                // deterministic → identical reruns for the demo
    },
  });
  return r.data.images[0].url as string;
}
```

**Rules that save you:**
- **Always `seed`.** Deterministic output means the cached demo path matches the live path exactly.
- **`num_images: 4`** in one call for the carousel — one round trip, not four.
- Ask for *negative space*, forbid text. Diffusion models write garbled letters; overlay text in CSS.
- P1 video: `fal-ai/kling-video/*/image-to-video` or `fal-ai/ltx-video` (🔍 verify slug). **Cap it** —
  it's the expensive call. One video per Drop, hard counter at 20.

---

## 4 · ElevenLabs — the voice clone (this is the gasp)

**Prize hook:** *"Every video is narrated by the creator's own cloned voice — they never record again."*

```ts
// lib/voice.ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
const el = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// 🔍 method surface moves between SDK majors — check node_modules types if this errors
export async function cloneVoice(name: string, file: Blob) {
  const v = await el.voices.ivc.create({ name, files: [file] });   // instant voice clone
  return v.voiceId;
}

export async function speak(voiceId: string, text: string) {
  const audio = await el.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_multilingual_v2",   // use eleven_turbo_v2_5 if latency hurts
    outputFormat: "mp3_44100_128",
  });
  return audio;   // stream → Buffer → Vercel Blob → URL
}
```

**Requires a paid tier for cloning** — verify at 10:00 that the portal credits unlock it. If not,
Starter (~€5) is worth it immediately; the clone is the single highest-impact feature in the build.

**Clone once at 10:30, reuse the `voiceId` all day.** Hardcode it in `.env.local`.

### P1 that punches far above its cost: the German dub
```
POST https://api.elevenlabs.io/v1/dubbing   (multipart: file, target_lang=de)
```
🔍 verify the current endpoint/params. *"Same short, same voice, now in German"* in a Stuttgart room,
for one API call, is one of the best wow-per-minute trades available today.

### Captions
Don't build word-level alignment. Split the VO script into ~6 caption groups, take the audio's
`duration`, distribute proportionally by character count, and sync off `audio.currentTime`. It looks
perfect on screen and it's 15 lines.

---

## 5 · n8n — the autonomous spine

**Prize hook:** *"n8n is the runtime, not a demo prop — publishing fan-out and the nightly loop both
run there."* Full node-by-node build in [`07-N8N-AUTOMATION.md`](07-N8N-AUTOMATION.md).

The app never calls a social API directly. It calls one n8n webhook:

```ts
// lib/publish.ts
export async function publish(drop: Drop, platforms: string[]) {
  if (process.env.DOPPEL_PUBLISH_ENABLED !== "true") return { skipped: true };  // kill switch
  const res = await fetch(process.env.N8N_PUBLISH_WEBHOOK!, {
    method: "POST",
    headers: { "content-type": "application/json", "x-doppel-secret": process.env.N8N_SECRET! },
    body: JSON.stringify({ dropId: drop.id, platforms, drop }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`n8n publish failed: ${res.status}`);
  return res.json();   // → [{ platform, url }]
}
```

**Show the canvas in the video.** A workflow diagram reads as "real system" to a judge in a way that
code never does. It's free credibility and it takes 4 seconds of screen time.

---

## 6 · Cursor — build in it, then show it

**Prize hook:** *"Four hours, five APIs, three people — we built it in Cursor."*

- Do the actual work in Cursor. Point it at `docs/` — these files are a written spec, which is
  exactly what agent mode is good at consuming.
- Put `docs/04-ARCHITECTURE.md` and `docs/09-PROMPTS.md` in context when generating route handlers.
- **In the submission video: 3 seconds of the Cursor agent panel.** No more. One line of narration:
  *"Built in Cursor — the whole spec is in the repo as markdown, the agent implemented against it."*
  That's a genuinely interesting Cursor story, not a plug.

---

## The all-five sentence (memorize — say it in Q&A and to sponsor reps)

> **"Firecrawl reads the brand, Claude writes it, fal renders it in their palette, ElevenLabs speaks
> it in their voice, and n8n ships it every morning."**

Twenty-two words. Covers 30% of the rubric. Say it at least twice on the day.
