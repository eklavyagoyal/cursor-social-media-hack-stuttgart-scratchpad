# 10 — Team Lanes

# ⭐ THE TWO-PERSON PLAN (this is us)

**Budget: ~7 person-hours of build** (10:20→14:45, minus lunch, ×2). That's it. Two consequences:

### 1. n8n moves off the publish path
Building `wf-publish` in n8n *and* the app is doing the same job twice. Instead:

- **Publish directly from the app** — `/api/publish` → Bluesky + Telegram. ~40 lines. Saves ~40 min.
- **n8n does only the nightly trend loop** — cron → Firecrawl search → Claude rank → Telegram with
  approval buttons. One workflow, ~30 min, built **last** (14:00) if P0 is green.

You keep the sponsor integration, you keep the canvas screenshot, you keep the autonomy story — and
it's *more* honest: *"the app publishes on approve; n8n is what runs at 6am when nobody's looking."*

### 2. The deck gets drafted before you leave the house
With 2 people, **both are coding at 13:00**, so nobody can draft slides then. And 15:00–16:30 already
holds the video + repo hygiene + samples + submit. Draft the 5 slides' **words** now, screenshots
blank. It's notes, it's allowed, and it's the single biggest de-risk available this morning.

### Who does what

| | **P1 — Backend** (owns A+B+C) | **P2 — Frontend** (owns D + submission) |
|---|---|---|
| 10:20 | `lib/types.ts` — write it, push it, tell P2 | `lib/fixtures.ts` — fake Genome + Drop, then never blocked again |
| 10:45 | **Clone the voice.** Hardcode `ELEVENLABS_VOICE_ID`. Do this FIRST — the tier gate is the day's biggest unknown. | Genome card. Typography, palette swatches, phrase chips. **The wow screen.** |
| 11:30 | Firecrawl → Claude → valid `BrandGenome` | Genome card done + trace UI streaming |
| 12:15 | One Claude call → LinkedIn + thread + 4 slides + VO script + captions | Studio screen laid out |
| 12:30 | 🔔 **E2E checkpoint** — both stop, run the whole flow, fake data OK | ↑ |
| 13:25 | fal: 4 images in ONE call (`num_images: 4`, fixed `seed`) | **The vertical player** (~40 lines) |
| 14:00 | ElevenLabs VO → Blob URL. Then `/api/publish` → Bluesky + Telegram | Ship screen + honest status badges |
| 14:30 | n8n nightly loop **only if everything above is green** | Polish whatever looks worst on camera |
| 14:45 | 🔒 Cache 3 brands into `public/demo/`. **Test with wifi OFF.** | Freeze. Set up the recording. |
| 15:00 | Repo hygiene: README, LICENSE, `samples/`, n8n JSON | **Record the 2-min video.** 3 takes. |
| 15:50 | Fill the deck's blank screenshots | ↑ finish + upload |
| 16:15 | Both: open every submission link in incognito → **submit** | ↑ |

### The 2-person P0 (tighter than the 4-person list in `01`)
```
✅ URL → Genome card
✅ One Claude call → LinkedIn + thread + carousel copy + VO script + captions
✅ 4 fal images, in the brand palette
✅ ElevenLabs cloned VO + the DOM vertical player
✅ Direct publish → Bluesky + Telegram (NOT via n8n)
✅ Cached demo path, verified offline
✅ Deployed URL
─── P1, in this order ───
◻ n8n nightly loop (30 min — the highest-innovation item left)
◻ German dub (one API call, big wow)
✂ CUT: audio note · calendar · Mastodon · mp4 export · wf-publish in n8n
```

### Two-person rules
- **Never both debug the same thing.** You have no slack. Split, then report.
- **15-minute rule is now a 10-minute rule.** Stuck 10 min → say it out loud → swap or cut.
- P2 builds **for the camera**. Every screen gets screen-recorded at 15:15; if it looks bad in a
  recording it *is* bad, regardless of how it feels in the browser.
- The live round: **P2 narrates, P1 drives.** Decide this now, don't negotiate it at 17:25.

---

# Reference: the 4-lane split

Below is the full split for larger teams. **Read it for the lane deliverables and success tests** —
the 2-person table above is just a remapping of these.

| Team size | Collapse to |
|---|---|
| **4** | A · B · C · D as written |
| **3** | A+C (one backend person owns Genome + publish), B, D |
| **2** | ⭐ see the plan above |
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

1. **Commit AND PUSH every 15 minutes — and after every unit that works.** Not at the end, not
   "when it's clean." Two people plus multiple agents are writing to this repo simultaneously;
   unpushed work is invisible to everyone else, and a second agent that can't see your work will
   write the same file again. `git pull --rebase origin main` before every push. `npx tsc --noEmit`
   clean before every push — a red `main` blocks your teammate. Never force-push, never rewrite
   pushed history. The canonical version of this rule lives in `AGENTS.md`, which every agent
   auto-reads.
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
