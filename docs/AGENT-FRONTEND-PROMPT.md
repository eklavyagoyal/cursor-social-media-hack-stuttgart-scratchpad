# Prompt for the parallel frontend agent

Paste everything below the line into a second agent (Cursor agent mode, or another
Claude Code session in the same repo).

---

You are building the frontend of **Doppel** for a hackathon demo that is judged at 16:30 today.
The backend is already built and working. **Your job is only the UI.**

## Hard file ownership — do not violate this, another agent is working in parallel

**You own, and may only create or edit:**
```
doppel/app/page.tsx
doppel/app/globals.css
doppel/app/layout.tsx
doppel/components/**          (all new files here)
doppel/lib/fixtures.ts        (create this)
```

**You must NOT touch** (another agent owns them, edits will collide):
```
doppel/lib/types.ts  prompts.ts  crawl.ts  genome.ts  drop.ts  images.ts  voice.ts  publish.ts  sse.ts
doppel/app/api/**
doppel/.env.example
```

Before pushing: `git pull --rebase origin main`, then commit **only your files**.

## What the product is

Paste one URL → Doppel reverse-engineers that brand's identity (a **Brand Genome**: voice, verbatim
pet phrases, palette, hooks, pillars) → then one topic *or* one uploaded video becomes a **Drop**:
a LinkedIn post, an X thread, a 4-slide carousel with generated on-palette images, and a vertical
short narrated in the founder's **cloned voice**.

Tagline: *"One link in. A content studio that sounds like you out."*

## Read these first

- `doppel/lib/types.ts` — `BrandGenome`, `Drop`, `Trace`. **These are contracts. Code against them exactly.**
- `doppel/lib/sse.ts` — exports `readSSE(res, onEvent)`. Use it; don't write your own parser.

## The API you're consuming

Both streaming endpoints are SSE via POST. Use `readSSE`.

```ts
// 1. URL -> Genome
const res = await fetch("/api/genome", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ url }),
});
await readSSE(res, (e) => {
  // e.t === "step" | "ok" | "warn" | "error"  -> append to the trace
  // e.t === "genome"                          -> e.genome is the BrandGenome
  // e.t === "done"                            -> stream finished
});

// 2. Genome + (topic | transcript) -> Drop
await fetch("/api/drop", { method: "POST", headers: {...},
  body: JSON.stringify({ genome, topic }) });           // typed topic
  // or: JSON.stringify({ genome, transcript, filename })  // from a video
// emits: step/ok/warn, then { t:"drop", drop } TWICE —
// first with text only, then again with imageUrls + short. Re-render on both.

// 3. Video -> transcript  (multipart, NOT sse)
const fd = new FormData(); fd.append("file", file);
const { transcript, words } = await (await fetch("/api/transcribe", { method:"POST", body: fd })).json();

// 4. Publish  (not sse) — send the ID ONLY, never the whole drop.
const r = await fetch("/api/publish", { method:"POST", headers: {...},
  body: JSON.stringify({ dropId: drop.id,
                         platforms: ["instagram","bluesky","telegram","linkedin","tiktok"] }) });
const { published, queued } = await r.json();
// published: [{ platform, url, at }]   queued: [{ platform, reason }]
// status may be 207 (partial) — that is NOT an error, render both lists.
//
// The server looks the Drop up in its own store. This is deliberate: the app is
// deployed publicly with a QR code on the tables, so a body-accepting publish
// route would let anyone post arbitrary content to the real accounts. Do not
// "helpfully" change this to send the drop object.
// A 404 here means the server restarted — regenerate the Drop.

// 5. Cached fallback for the stage
const { genome, drop } = await (await fetch("/api/demo/legacy-ai")).json();
```

## Step 1 — do this first, it unblocks you permanently

Create `doppel/lib/fixtures.ts` exporting `DEMO_GENOME: BrandGenome` and `DEMO_DROP: Drop`, fully
populated with realistic content for **legacy-ai.de** (a German B2B company that captures retiring
experts' knowledge). Use these real pet phrases:

- "Your best people retire on Friday. The know-how leaves with them."
- "answers carry citations, or none at all"
- "The expertise stays. The person moves on."
- "The most valuable answer is sometimes 'I don't know.'"
- "Honesty is the default, not a setting"

Palette: `["#0B1F1A", "#E8DCC8", "#C1440E", "#1B4D3E", "#F5F1E8"]`.
For `carousel.slides[].imageUrl` and `short.imageUrls`, use `https://picsum.photos/seed/x1/1080` etc.

**Then build every screen against the fixtures.** Wire the real API only once each screen looks
finished. This way you are never blocked and never idle.

## Step 2 — one page, three states

Single page, no routing. It progresses: `input → genome → studio`.

### State 1 · Input
One big text input, placeholder `legacy-ai.de`. One button: **Build my studio**. Nothing else on
screen. No nav, no hero copy, no feature grid.

### State 2 · Trace + Genome card
While `/api/genome` streams, render the trace as **large monospace lines that land one at a time**,
`◐` while pending → `✓` when the next event arrives. This is the personality of the product — do not
replace it with a spinner.

```
◐ reading brand surface
✓ homepage read (14,203 chars)
✓ 6 sources found
◐ extracting voice fingerprint
✓ voice: deliberate · honest · technically rigorous
✓ palette: #0B1F1A  #E8DCC8  #C1440E
```

Then the **Genome card** — the single most important screen in the build, because it's the "whoa":
- Brand name + tagline, large
- 3 voice adjectives as prominent type
- **8 pet phrases as quoted chips** ← the hero element, make these look precious
- Palette as 5 large swatches with hex labels
- 6 pillars, ICP, 3 proof points
- 5 hook patterns in mono, with `{placeholders}` visually highlighted

### State 3 · Studio
Two inputs side by side: a text field (**topic**) and a **drop-a-video** zone. Either produces a Drop.
Video → call `/api/transcribe` first, show `"transcript · 214 words"`, then call `/api/drop`.

Then the Drop, as four panels:
1. **LinkedIn** — rendered like a real LinkedIn post, preserving line breaks
2. **Thread** — 5 stacked post bubbles
3. **Carousel** — 4 slides, swipeable/arrows, headline+body overlaid on the generated image
4. **Vertical short** — see below

Bottom: a **Publish** bar. After publishing, show per-platform state honestly:
```
✅ Instagram   posted · 11s ago     [view]
✅ Bluesky     posted · 11s ago     [view]
⏳ TikTok      awaiting Content Posting API review
```

## The vertical short — read this carefully, it is the demo's gasp

**There is no video file.** You composite it live in the browser. ~40 lines:

- 9:16 container, `overflow-hidden`, dark
- `short.imageUrls` (4) crossfade, one per quarter of `short.durationSec`, each with a slow
  `transform: scale(1 → 1.08)` Ken Burns drift
- `short.captionGroups` (6 groups, ≤5 words) burn in centred, bold, large, one at a time
- ONE `<audio src={short.voUrl}>`; drive everything off `audio.currentTime` via `timeupdate`
- Big play button overlay when paused

Index maths: `captionIndex = floor(currentTime / duration * captionGroups.length)`, same shape for
images. Don't use `setInterval` — sync to the audio element or it drifts.

It must look like a Reel on a projector. **Test it at 125% browser zoom** — that's how it'll be seen.

## Design direction (Presentation is 15% of the score)

- **Dark**: near-black background (`#0A0A0A`), so the brand's extracted palette pops against it
- **Two fonts only**: one editorial serif for headings, one mono for the trace/hooks. Body sans.
- Generous whitespace. Large type. Few borders — use spacing and weight for hierarchy
- **Forbidden**, they read as AI-default and cost you novelty marks: purple/indigo gradients,
  glassmorphism, emoji as icons, gradient mesh backgrounds, Inter as a display face, rounded-3xl
  cards with soft shadows everywhere
- Motion: one thing at a time, 200–300ms, ease-out. Trace lines land. Cards fade up. Nothing bounces.

## Acceptance — you are done when

1. `pnpm dev`, paste `legacy-ai.de`, and the full flow works end to end without a console error
2. Every screen also works with `?demo=1` reading from fixtures (no network) — this is the stage fallback
3. `npx tsc --noEmit -p tsconfig.json` is clean
4. The vertical short plays with audio and the captions stay in sync to the end
5. It looks good **in a screen recording at 125% zoom** — that's what gets judged

## Rules

- Commit every 15 minutes. `git pull --rebase origin main` before every push.
- No new dependencies. Tailwind is installed; that is enough.
- No auth, no database, no routing, no settings, no dark-mode toggle, no mobile layout.
- If something takes more than 20 minutes, simplify it and move on. Ugly and working beats clean and broken.
- **Hard stop at 14:45.** After that: no new code, only making things look right on camera.
