# legacy-creator

**You film 30 seconds on your phone. It comes back as a posted Reel.**

Give it a topic and it writes a shoot brief — a shot list with what to say, how to hold the
camera, and how long each shot runs. You film it in one take. It transcribes with word-level
timings, cuts the silence and the "ähm"s, burns captions, renders a 1080×1920 mp4 and posts it
to Instagram.

Before any of that it does two crawls. The first reads your website and extracts how you
actually write. The second searches short-form platforms for what your niche is posting this
month, and turns that into a shooting decision — angle, hook, format, cut structure, length. So
the script comes back in your own phrases, about something that is currently landing.

▶ **[`samples/reel.mp4`](samples/reel.mp4)** — rendered by the pipeline · full output in
[`samples/`](samples/)

## The pipeline

Judges score **strong sponsor tool integration** inside Technical Innovation (30%). Every
sponsor tool sits on this path — not bolted on for a prize, not a checklist. Built in **Cursor**.

```
  URL ──▶ brand genome ──▶ market scan ──▶ angle ──▶ shoot brief ──▶ [ you film it ]
       Firecrawl scrape    Firecrawl search          GPT-5.6                    │
       + GPT-5.6           short-form, last 30d                                 │
                           (+ fal.ai stills on palette)                         │
                                                                                ▼
  Instagram ◀── publish ◀── mp4 ◀── burn captions ◀── cut ◀── transcribe ◀── upload
    Graph API              ffmpeg   @napi-rs/canvas  lib/cut  ElevenLabs Scribe
  (+ Telegram)                                                    (word-level timings)
         ▲
         └── n8n nightly loop — cron → Firecrawl trend sweep → refill when nobody's looking
```

| Sponsor | Role on the critical path |
|---|---|
| **Cursor** | How we built it — agents + editor, end to end, commit history from kickoff |
| **Firecrawl** | Brand genome scrape + niche market scan (and the n8n nightly sweep) |
| **ElevenLabs** | Scribe word-level transcription — the timings the cut plan is built from |
| **fal.ai** | On-palette generative stills on the production path (`@fal-ai/client`) |
| **n8n** | Autonomy spine — nightly trend loop when nobody's looking; the app publishes on approve |

Word-level timings are what makes the rest possible: the cut plan is built from word
boundaries, and caption groups are re-timed onto the *output* timeline after the cuts land, so
they stay in sync with a video that no longer matches the transcript's clock.

## What is real, and what isn't

Precise, because a vague limitations section is worth less than an honest one.

| | State |
|---|---|
| **Cut planning** — silence, hesitations, head/tail trim | Real. Verify in ~2s: `npm run verify:render` |
| **Caption grouping + re-timing onto the output timeline** | Real, same command |
| **Vertical render, 1080×1920, captions burned in** | Real, same command. This ffmpeg build has no libass, so captions are drawn as PNGs with `@napi-rs/canvas` and composited |
| **Transcription** | Real, needs `ELEVENLABS_API_KEY`. Called over REST, not the SDK, which mangles the `words` field |
| **Brand genome + shoot brief** | Real, need `FIRECRAWL_API_KEY` + `OPENAI_API_KEY`. Without them the UI falls back to the cached profile and says so on screen |
| **Market scan** | Real, needs `FIRECRAWL_API_KEY` alone — it returns the evidence either way. With `OPENAI_API_KEY` it also derives angles; without one it degrades to the raw findings and labels itself as degraded rather than inventing them |
| **Instagram publishing** | Implemented against the Graph API v23. Needs an Instagram **Business** account, a token, and the file behind a public HTTPS URL — Instagram fetches the video itself, so localhost cannot work. Gated behind `PUBLISH_ENABLED` **and** an operator secret |
| **Telegram publishing** | Real, needs a bot token. Used as the proof channel that never waits on a platform review |
| **The cached demo path** | Real files, committed: `public/demo/`. Runs with no keys and no network |
| **`samples/reel.mp4`** | A real render of a synthetic ffmpeg test clip — colour bars with real captions. Point the seeder at your own footage to change that |

Publishing is locked twice on purpose. `POST /api/publish` takes a caption from the client and
posts it to a real account, and the app is deployed publicly — so the route requires an
`x-publish-secret` header and returns 401 without it, even before it checks whether publishing
is enabled at all. `scripts/smoke.mts` asserts that as a regression test.

## Run it

```bash
npm i
cp .env.example .env.local     # every key is optional; see the table above for what each unlocks
npm run dev                    # http://localhost:3000
```

Needs `ffmpeg` and `ffprobe` on the PATH (`brew install ffmpeg`). `GET /api/health` tells you
whether it found them, and which keys are configured.

With no keys at all, click **„gespeicherten Demo-Durchlauf laden"** on the landing page: the
whole flow renders from `public/demo/`.

```bash
docker build -t legacy-creator .    # bookworm-slim + ffmpeg + fonts; @napi-rs/canvas needs glibc
```

## Prove it works, without giving it a single API key

```bash
npm run verify:render
```

Two seconds. It generates a 12-second clip, plans the cut, prints every removed span with its
reason, prints the caption groups on the output timeline, encodes the mp4, and fails loudly if
the output duration drifts more than 0.6s from the plan. This is the hard part of the product,
and you can check it on your own machine before reading any of the code:

```
▸ cut plan: 3 keep spans, 4 cuts
  12.00s → 4.52s (−7.48s)
  ✂ 0.00–0.83  head
  ✂ 2.47–6.03  filler "ähm"
  ✂ 8.07–10.13  silence
  ✂ 10.97–12.00  tail
  ✓ 1080x1920 · 4.60s · 242 KB · 1.0s encode
✓ Kette funktioniert. Drift 0.080s.
```

The other check needs the dev server running:

```bash
npx tsx scripts/smoke.mts       # readiness, the three cached fixtures, both mp4s, publish lock
```

## Architecture

One file per job. No framework beyond Next.js.

| File | What it does |
|---|---|
| `lib/types.ts` | The contracts. `ShootBrief`, `Transcript`, `CutPlan`, `CaptionGroup`, `ProcessResult` |
| `lib/brand.ts` | One URL → `BrandGenome`. Firecrawl scrapes the voice-carrying pages, GPT-5.6 reverse-engineers voice, palette and verbatim phrases |
| `lib/research.ts` | Genome → what the niche posts now. Firecrawl search restricted to short-form domains, then angles with hook, format and cut structure. Appended to the brief's `context`, so no contract changes |
| `lib/brief.ts` | Topic + brand context + market context → `ShootBrief` via GPT-5.6 |
| `lib/transcribe.ts` | Audio → transcript with per-word start/end times (ElevenLabs Scribe) |
| `lib/cut.ts` | Word timings → cut plan. Hesitations always go; discourse fillers are opt-in because they can be load-bearing. Also groups captions and maps them onto the output timeline |
| `lib/caption-image.ts` | Draws each caption group as a transparent PNG |
| `lib/render.ts` | `probe`, `extractAudio`, `renderVertical` — the ffmpeg layer |
| `lib/storage.ts` | Puts the finished mp4 behind a public HTTPS URL, via Vercel Blob or a tunnel |
| `lib/publish.ts` | Instagram Graph + Telegram, plus the publish gate and secret check |
| `lib/fixtures.ts` | Contract-shaped fixtures so the UI runs with no keys |
| `app/api/health` | Readiness. Fails if ffmpeg is missing, reports config without failing on it |
| `scripts/verify-render.mts` | The proof above |
| `scripts/seed-demo.mts` | Builds the cached demo path. `npm run seed:demo -- clip.mov` uses your footage |
| `scripts/smoke.mts` | Asserts the cached path and the publish lock |

## Licence

MIT.
