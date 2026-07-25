# Prompt for the parallel frontend agent (v2 — post-merge)

> ⚠️ v1 of this file targeted a `doppel/` app that has been superseded. If an agent is still
> running against v1, stop it. This version targets the real app at the repo root.

Paste everything below the line into the agent.

---

You are finishing the frontend of **legacy-creator**, a hackathon project judged at 16:30 today.
The backend is complete and working. Most of the frontend exists too. **You are integrating, not
rewriting.**

## Read these four files before you write anything

1. `app/page.tsx` — 321 lines, already works. Phases: brief → process → publish, plus a `loadDemo()`
   cached path. **Do not rewrite it. Extend it.**
2. `lib/types.ts` — `ShootBrief`, `Shot`, `Transcript`, `CutPlan`, `CaptionGroup`, `ProcessResult`,
   `PublishResult`. Contracts. Do not change them.
3. `lib/brand.ts` — `BrandGenome` + `crawlBrandGenome`. New. This is what you're wiring in.
4. `components/GenomeCard.tsx` — already written and typechecking. Renders a `BrandGenome`.

## What the product is

**Topic → shoot brief → you film it on a phone → auto-cut → captioned vertical mp4 → Instagram.**

`ShootBrief` gives the creator a shot list with exactly what to *say*, how to hold the camera, and
how long each shot runs. They film it. The pipeline transcribes with word-level timings, cuts
silence and filler, renders a real mp4 with burned captions, and posts it.

**Your job adds the missing first step: the brand.** Right now briefs are written from a topic alone,
so they sound like generic Reel-speak. With a brand genome they sound like the creator.

## Hard file ownership — another agent works in parallel

**You own:**
```
app/page.tsx
app/globals.css
app/layout.tsx
components/**
lib/fixtures.ts
```

**Do NOT touch:**
```
lib/brand.ts  brief.ts  cut.ts  render.ts  caption-image.ts  transcribe.ts  publish.ts  storage.ts  types.ts
app/api/**
package.json
```

`git pull --rebase origin main` before every push. Commit only your files. This repo uses **npm**, not pnpm.

## Task 1 — delete the dead app (do this first, 10 seconds)

```bash
git rm -rf doppel
```
It's a superseded parallel implementation, excluded from `tsconfig.json` and kept only so nothing
in flight got destroyed. It's dead now. Removing it also lets you drop `"doppel"` from the
`exclude` array in `tsconfig.json`.

## Task 2 — the brand step (the real work)

Add a step *before* the topic input in `app/page.tsx`.

```ts
// 1. URL -> genome
const res = await fetch("/api/brand", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ url }),
});
const { genome, error, thin } = await res.json();
// 422 + thin:true  => JS-only or blocking site. Fall back to the cached genome
//                     and show a quiet notice. This is expected, not a crash.

// 2. keep it, render it
<GenomeCard genome={genome} />

// 3. pass its grounding text into the existing brief call
await fetch("/api/brief", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ topic, context: genome.context, targetSeconds }),
});
```

`genome.context` is a pre-rendered German grounding block. **Pass it through verbatim** — don't
reformat it, don't build your own string from the genome fields.

**Flow after your change:**
```
URL  ─▶ GenomeCard ─▶ topic ─▶ ShootBrief ─▶ [film it] ─▶ upload ─▶ CutTimeline ─▶ ReelPreview ─▶ ShipPanel
```

Make the brand step **skippable** — a "skip, just use a topic" link. If someone has no site, the
old path must still work exactly as it does now.

## Task 3 — wire `TraceStream` into the waits

`components/TraceStream.tsx` exists. `/api/brand`, `/api/brief` and `/api/process` are all slow
enough to need it (crawl + LLM, LLM, transcribe + cut + render).

These routes are **plain JSON, not SSE** — so drive the trace from client-side phase state, not from
a stream. Something like:

```
◐ Marken-Oberfläche lesen
✓ 6 Quellen gefunden
◐ Tonalität extrahieren
✓ Stimme: nüchtern · direkt · technisch
```

Don't replace it with a spinner. A trace that lands line by line is what makes the wait feel like
competence instead of latency. Fake the intermediate lines on a timer if you have to — the timings
are honest approximations of real work.

## Task 4 — make it look right on a projector

Presentation is 15% of the score and *"engaging video"* is named in the rubric. The design system in
`app/globals.css` and the Instrument_Serif / JetBrains_Mono / Geist setup in `app/layout.tsx` are
already in place — **stay consistent with them**, don't introduce a second visual language.

- The **GenomeCard** and the **ReelPreview** are the two screens that get screenshotted. Spend your
  polish time there.
- Test everything at **125% browser zoom** — that's how a judge sees it in a screen recording.
- **Forbidden**, they read as AI-default and cost novelty marks: purple/indigo gradients,
  glassmorphism, emoji as icons, gradient mesh, `rounded-3xl` + soft shadow on everything.
- Motion: one thing at a time, 200–300ms, ease-out. Nothing bounces.

## Task 5 — extend the cached demo path

`loadDemo()` already reads `/demo/brief.json` and `/demo/result.json`. Add `/demo/genome.json` so
the **whole** flow works with no keys and no network. Generate it once with a real call, commit it.

This is not optional polish — *"stable during the demo"* is written into the 25% execution criterion,
and the venue wifi is a real risk. **The demo must survive with wifi off.**

## Acceptance — you are done when

1. `npm run dev`, enter `legacy-ai.de`, and the full chain works: genome → brief → upload a video →
   cut → render → publish, no console errors
2. Skipping the brand step still works exactly as before
3. `npx tsc --noEmit` is clean and `doppel/` is gone
4. Everything works from the cached demo path with the network disabled
5. It looks good in a screen recording at 125% zoom

## Rules

- Commit every 15 minutes. Pull --rebase before every push.
- **No new dependencies.** Tailwind v4 is installed; that's enough.
- No auth, no database, no routing, no settings, no dark-mode toggle, no mobile layout.
- If something takes more than 20 minutes, simplify and move on. Ugly and working beats clean and broken.
- **Hard stop at 14:45.** After that: nothing new, only making it look right on camera.
