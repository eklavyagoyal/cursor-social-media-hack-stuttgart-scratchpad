# 10 — Team Lanes

Guidebook recommends **2–3 people**. Below is the 4-lane split; collapse lanes if you're smaller.
Priority when short-handed: **D > A > B > C**. The UI is what the round-1 judge actually sees.

| Team size | Collapse to |
|---|---|
| **4** | A · B · C · D as written |
| **3** | A+C (one backend person owns Genome + publish), B, D |
| **2** | Person 1: A+B+C (all backend). Person 2: D (all frontend) + owns the video and deck. |
| **1** | Cut to: Genome card + copy + one fal image + one real Bluesky post. Skip video/audio. Still a strong submission. |

---

## The rule that makes this work: contracts at 10:20, then nobody blocks

At 10:20, before any feature code, write `BrandGenome` and `Drop` **on paper** ([`04`](04-ARCHITECTURE.md)).
Photograph it. Put it in `lib/types.ts` as commit #3.

Then **Lane D immediately builds against a hardcoded fixture** — `lib/fixtures.ts` with one complete
`BrandGenome` and one complete `Drop`, hand-written, plus 4 placeholder image URLs. Lane D never waits
for Lane A. Lane A never waits for Lane D. This one decision buys back roughly 90 minutes.

---

## Lane A — Genome (backend)

**Owns:** `POST /api/genome`, `lib/crawl.ts`, `lib/genome.ts`, `lib/prompts.ts`

| By | Deliverable |
|---|---|
| 11:00 | Firecrawl scrapes one URL, dumps markdown to the console |
| 11:45 | Claude returns schema-valid `BrandGenome` from that markdown |
| 12:20 | Multi-page crawl (about/blog/story) + `normalizeGenome` + the one unit test |
| 13:40 | SSE trace events emitted (`step` / `ok` / `done` / `error`) |
| 14:20 | Handles a JS-only SPA gracefully → falls back to cache, doesn't hang |
| 14:45 | **Cache 3 brands into `public/demo/`** — this is the stage safety net |

**Success test:** paste 5 different brand URLs. All 5 return a card whose `petPhrases` make you go
"yeah, that's them." If they feel generic, the extraction prompt is the problem, not the writer.

---

## Lane B — Studio (backend)

**Owns:** `POST /api/drop`, `POST /api/voice`, `lib/images.ts`, `lib/voice.ts`

| By | Deliverable |
|---|---|
| 10:45 | **Clone your voice ONCE** → hardcode `ELEVENLABS_VOICE_ID` in `.env.local`. Do this first — everything downstream depends on it and the tier gate might surprise you. |
| 11:30 | Claude returns a schema-valid `Drop` (all copy) from a fixture Genome |
| 12:10 | fal returns 4 carousel images with `num_images: 4` + fixed `seed` |
| 12:30 | ElevenLabs returns an mp3 of the `voScript` in the cloned voice |
| 13:50 | Audio + images uploaded to Vercel Blob, URLs in the `Drop` |
| 14:20 | Vertical `imagePrompts` render at 9:16 |
| 14:45 | Freeze. Every asset cached locally. |

**Cost guard:** hard-cap the expensive calls. `MAX_DROPS` counter in memory. Blowing the fal or
ElevenLabs credit at 14:00 ends the day.

---

## Lane C — Ship (backend + n8n)

**Owns:** n8n workflows, `POST /api/publish`, `lib/publish.ts`

| By | Deliverable |
|---|---|
| 11:00 | n8n Cloud workspace up. `wf-publish` webhook receives a POST and echoes it. |
| 11:30 | **Telegram node posts a real message.** First real "it shipped". |
| 12:10 | **Bluesky posts for real**, public URL returned to the app |
| 12:30 | Secret check + kill switch + 20s timeouts + 2 retries + error→Telegram alert |
| 13:50 | Bluesky with an image (uploadBlob → embed) |
| 14:20 | `wf-trend-sweep` with a Manual Trigger (hardcoded topics first, Firecrawl search after) |
| 14:40 | `wf-approve` Telegram buttons |
| 14:45 | **Screenshot every canvas** for the deck. Export JSON into `n8n/` and commit. |

Detail: [`07-N8N-AUTOMATION.md`](07-N8N-AUTOMATION.md) · [`08-PUBLISHING-REALITY.md`](08-PUBLISHING-REALITY.md)

---

## Lane D — Show (frontend + design) ← the most important lane

**Owns:** all three screens, the trace UI, the vertical player, and **the submission video**.

| By | Deliverable |
|---|---|
| 10:40 | `lib/fixtures.ts` — one complete fake Genome + Drop. Everything below runs off this. |
| 11:30 | **Genome card, beautiful.** Typography, palette swatches, phrase chips. This is the wow screen. |
| 12:15 | Trace UI streaming (monospace, lines landing one at a time, ✓/◐ states) |
| 12:30 | Studio screen: the 5 assets laid out, carousel swipeable |
| 13:40 | **The vertical player** — 9:16, crossfading images with slow zoom, captions synced to `audio.currentTime`, one `<audio>` element. ~40 lines. → [`01`](01-THE-PRODUCT.md) §the lazy call |
| 14:20 | Ship screen with honest per-platform status badges |
| 14:45 | Freeze. |
| **15:00–15:50** | **Records the 2-minute submission video.** → [`03`](03-DEMO-SCRIPT.md) §A |

**Design brief (30 seconds, then go):** one accent colour, one serif for headings + one sans for body,
generous whitespace, dark background so the palette swatches pop. Nothing purple, no gradient mesh,
no glassmorphism — those read as AI-default and the rubric rewards novelty. If you have taste, use it;
if you don't, copy a brand you admire.

---

## Whoever isn't coding at 13:00 does this

The submission is 40% of the score (25% execution shown via the demo + 15% presentation) and it is
the *only* thing round 1 sees. It cannot start at 16:00.

- **13:00–14:00** — draft the 5 slides in Google Slides → [`11-PITCH.md`](11-PITCH.md)
- **14:00–14:30** — write the README (screenshot, one-liner, setup, architecture diagram, sponsor list)
- **14:30–15:00** — collect **sample outputs** into `samples/` (real generated posts, images, the mp3).
  The guidebook explicitly asks for *"samples of what you generated."* Nobody will remember to do this.
- **15:00–16:15** — help record the video, then submit and verify every link logged-out

---

## Standing rules

1. **Commit every 15–20 min, push every time.** The git log is your defense against the pre-built
   penalty. It's also your undo button at 15:30.
2. **Deploy every 20 min.** Always have a last-known-good prod URL.
3. **Nobody debugs alone for more than 15 minutes.** Say it out loud, swap eyes, or cut the feature.
4. **No refactors after 13:00.** Ugly and working beats clean and broken. Always.
5. **One person owns the clock** and calls 11:00 / 12:30 / 14:45 / 15:00 / 16:15 out loud.
6. **When two people disagree on scope, the smaller scope wins.** Default to shipping.
7. **`main` is always green.** Break it, fix it or revert it immediately — no "I'll fix it after lunch."

## Names & roles (fill in at 10:00)

```
Clock owner + team lead (claims the portal perks):
Lane A · Genome:
Lane B · Studio:
Lane C · Ship:
Lane D · Show + video:
Narrator for the live pitch:
Driver for the live demo:
```
