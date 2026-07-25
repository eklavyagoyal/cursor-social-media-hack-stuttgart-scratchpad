# 04 — Architecture

Design goal: **the shortest path from URL to gasp.** Every choice below is the laziest option that
survives a live demo. Read [§What we deliberately don't build](#what-we-deliberately-dont-build)
before adding anything.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) on Vercel** | One repo, API routes + UI, deploy in 40s, free HTTPS URL for the QR |
| Runtime | **Node.js (Fluid Compute, the default)** | Full Node APIs, 300s timeout — video gen needs it. Do *not* use `runtime = 'edge'`. |
| Streaming | **SSE from a route handler** | Works on Node runtime with zero config. Powers the trace UI. |
| LLM | **Claude Opus 5** (`claude-opus-5`) | Genome extraction + copywriting. Structured output via `output_config.format`. |
| Crawl | **Firecrawl** | URL → markdown + schema'd JSON in one call |
| Images | **fal.ai** | FLUX for carousel + vertical backplates. **No mp4 render in P0** — the vertical is a DOM player ([`01`](01-THE-PRODUCT.md) §the lazy call). fal image→video is P1. |
| Voice | **ElevenLabs** | Instant voice clone + TTS + (P1) dubbing |
| Automation | **n8n Cloud** | Publish fan-out, nightly trend cron, Telegram approvals |
| Storage | **Vercel Blob** for assets, **JSON on disk** for state | No schema, no migrations, no ORM at 11am |
| DB | **none** (Neon only if the calendar must survive redeploys) | See below |

## Shape

```
                    ┌──────────────────────────────────────────┐
   one URL ────────▶│  POST /api/genome        (SSE stream)    │
   + 30s voice      │   Firecrawl ──▶ Claude ──▶ BrandGenome   │──▶ blob + genome.json
                    └──────────────────────────────────────────┘
                                        │
   one topic ──────▶┌──────────────────────────────────────────┐
                    │  POST /api/drop          (SSE stream)    │
                    │   Claude  ──▶ copy (LI / thread / slides)│
                    │   fal     ──▶ 4 carousel + 4 vertical    │──▶ Drop
                    │   11Labs  ──▶ cloned VO mp3 + captions   │
                    └──────────────────────────────────────────┘
                         the "video" = images + mp3 + captions,
                         composited live in the browser. No encode.
                                        │  approve
                                        ▼
                    ┌──────────────────────────────────────────┐
                    │  n8n  POST /webhook/doppel-publish        │
                    │   ├▶ Bluesky   (real, instant)            │
                    │   ├▶ Telegram  (real, instant)            │
                    │   ├▶ Mastodon  (real, instant)            │
                    │   └▶ LI/IG/TT  (queued — honest state)    │
                    └──────────────────────────────────────────┘
                                        ▲
                    ┌───────────────────┴──────────────────────┐
                    │  n8n cron 06:00 · Firecrawl trend sweep  │
                    │   → Claude ranks vs Genome → 5 drafts    │
                    │   → Telegram ✅/✏️/❌ approval buttons     │
                    └──────────────────────────────────────────┘
```

## Data model — two types, that's it

```ts
// lib/types.ts  — write this FIRST, on paper, before anyone codes.
export type BrandGenome = {
  id: string;
  sourceUrl: string;
  name: string;
  voice: {
    adjectives: string[];       // exactly 3
    petPhrases: string[];       // 8
    forbiddenWords: string[];
    sentenceStyle: string;      // e.g. "short declaratives, one-line paragraphs"
    emojiPolicy: "none" | "sparing" | "heavy";
  };
  look: { palette: string[]; typographyVibe: string; imageryStyle: string };
  substance: { pillars: string[]; icp: string; proofPoints: string[] };
  hooks: string[];              // 5 patterns w/ {placeholders}
  voiceId?: string;             // ElevenLabs cloned voice
};

export type Drop = {
  id: string;
  genomeId: string;
  topic: string;
  linkedin: string;
  thread: string[];
  carousel: { slides: { headline: string; body: string; imageUrl: string }[] };
  // the vertical short: rendered in the browser from these parts, not an mp4
  video?: { imageUrls: string[]; voUrl: string; captionGroups: string[]; durationSec: number };
  audioNote?: { url: string };
  status: "draft" | "approved" | "published";
  published?: { platform: string; url: string; at: string }[];
};
```

**Contracts first.** Lane D builds the UI against a hardcoded fixture of these two objects at 10:20
and never blocks on Lanes A/B. This is the single most important architectural decision of the day.

## Route handlers

| Route | Does |
|---|---|
| `POST /api/genome` | SSE. Firecrawl → Claude → `BrandGenome`. Emits trace lines as it goes. |
| `POST /api/drop` | SSE. Claude copy → fal images (parallel, one call w/ `num_images`) → 11Labs VO → `Drop`. |
| `POST /api/voice` | Upload 30s sample → ElevenLabs instant voice clone → `voiceId` |
| `POST /api/publish` | Forwards the `Drop` to the n8n webhook. Returns post URLs. |
| `GET /api/demo/:slug` | Returns a **cached** Genome+Drop. The stage safety net. |

## Streaming the trace (this is the UI's whole personality)

```ts
// app/api/genome/route.ts — Node runtime, SSE. No edge, no extra deps.
export async function POST(req: Request) {
  const { url } = await req.json();
  const stream = new ReadableStream({
    async start(c) {
      const enc = new TextEncoder();
      const say = (o: unknown) => c.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      try {
        say({ t: "step", msg: "reading brand surface" });
        const pages = await crawl(url);
        say({ t: "ok", msg: `${pages.length} sources found` });

        say({ t: "step", msg: "extracting voice fingerprint" });
        const genome = await extractGenome(pages);
        say({ t: "ok", msg: `voice: ${genome.voice.adjectives.join(", ")}` });
        say({ t: "done", genome });
      } catch (e) {
        // ponytail: surface the failure to the UI, never swallow — the demo
        // needs to fall back to cache visibly, not hang forever.
        say({ t: "error", msg: String(e) });
      } finally {
        c.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-store" },
  });
}
```

Client side: `new EventSource` won't do POST — use `fetch` + `response.body.getReader()` and a
tiny line splitter, or just `POST` to create a job and `GET` the SSE. Either is ~15 lines.

## Reliability rules (these are demo-survival rules, not enterprise theatre)

Every external call is on stage. Treat it accordingly.

1. **Bounded timeouts, always.** `AbortSignal.timeout(20_000)` on Firecrawl/fal/11Labs. A hung
   fetch on stage is worse than an error, because an error can fall back.
2. **Bounded retries: 2 max, exponential + jitter.** No retry storms; the demo has one shot.
3. **Every route has a cached fallback.** On failure, return `/api/demo/:slug` content and set a
   `x-doppel-source: cache` header so the UI can show a subtle "cached" chip. Honest and invisible.
4. **Idempotency on publish.** `key = sha256(dropId + platform)`. Double-clicking Approve on stage
   must not double-post. This *will* happen.
5. **Kill switch.** `DOPPEL_PUBLISH_ENABLED=false` short-circuits all publishing. Flip it during
   testing so you don't spam the demo account, flip it on at 16:00.
6. **Fail loud, log structured.** `console.error(JSON.stringify({ evt, dep, ms, err }))`. When
   something breaks at 15:40 you need to know *which dependency* in 5 seconds, not grep prose.
7. **Cost guard.** fal video is the expensive call. Cap it: one video per Drop, `MAX_VIDEOS=20`
   counter in memory. Blowing the credit at 14:00 ends the day.

## What we deliberately don't build

| Not building | Because | Add when |
|---|---|---|
| Auth / accounts | Nothing in the demo needs a user | Someone other than us uses it |
| Database | Two JSON blobs and a filesystem cover it | Calendar must survive redeploy → one Neon table |
| Queue / worker infra | **n8n is the queue.** That's why it's in the stack. | n8n falls over |
| Real IG / TikTok OAuth | Needs app review; not achievable today (see `08`) | Post-hackathon, with a real creator |
| mp4 encoding (ffmpeg / fal video) | The DOM player looks identical on screen, renders in 0ms, and can't fail live | A user needs a downloadable file |
| Editing / regeneration UI | Not in a 3-minute demo | A user asks for it |
| Multi-tenant, RBAC, teams | One brand at a time on stage | Never, today |
| Tests | Except **one** check on the Genome JSON parse (below) | Anything money- or auth-adjacent |
| Error boundaries per component | One top-level boundary + cached fallback | Never, today |

## The one test worth writing

The Genome parse is the only piece of non-trivial logic the whole demo hinges on. Everything else
is glue you'll see fail immediately. So: one file, no framework.

```ts
// lib/genome.test.ts   run: node --test
import { test } from "node:test";
import assert from "node:assert";
import { normalizeGenome } from "./genome.ts";

test("normalizeGenome survives a model that returns almost-right JSON", () => {
  const g = normalizeGenome({
    name: "Acme", voice: { adjectives: ["warm", "blunt", "dry", "extra"], petPhrases: [] },
    look: { palette: ["0B3D2E", "#E8DCC8"] },
  });
  assert.equal(g.voice.adjectives.length, 3);          // clamps to 3
  assert.ok(g.voice.petPhrases.length >= 1);           // never renders an empty card
  assert.ok(g.look.palette.every((c) => c.startsWith("#"))); // hex normalized
});
```

If that passes, the Genome card never renders broken on stage. That's the whole point.
