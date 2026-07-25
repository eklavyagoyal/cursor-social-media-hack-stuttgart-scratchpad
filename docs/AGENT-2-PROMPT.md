# Prompt for agent #2 — verify the demo path, then build the submission artifacts

Paste everything below the `---` into a second agent.

---

You are on a hackathon team. **Submission deadline 16:30, coding stops 15:00.** The app works and
typechecks. Your job is the two things nobody has done: **prove the demo path actually runs**, and
**produce the artifacts the judges read**. Round 1 is judged *offline* from those artifacts — no
live demo, no team in the room. They are not a formality; they are the whole first round.

Read `AGENTS.md` at the repo root first. **Commit and push every 15 minutes** — two other people are
writing to this repo right now, and unpushed work is invisible to them.

## Hard file ownership — do not touch anything else

**You own:**
```
README.md                 (repo root — rewrite it, it's judged)
samples/**                (create)
docs/DECK.md              (create)
scripts/smoke.mts         (create)
```

**Do NOT touch:** `lib/**`, `app/**`, `components/**`, `Dockerfile`, `package.json`, `docs/0*.md`,
`docs/1*.md`. Other agents own those. If you think one needs changing, say so instead of doing it.

## What the product is

**legacy-creator** — topic in, shoot brief out, film it on a phone, and it auto-cuts the silence and
filler, burns captions, renders a vertical mp4, and posts it to Instagram.

The new first step reads a brand's website (`/api/brand`) and extracts its voice, so the brief is
written in the creator's own words rather than generic Reel-speak. First user: **legacy-ai.de**, a
German company that captures retiring experts' knowledge — the founders are the creators.

Read `docs/11-PITCH.md` for the positioning and `docs/00-WIN-CONDITIONS.md` for how it's scored.

---

## Task 1 — smoke-test the cached demo path (do this FIRST)

There is **no `ANTHROPIC_API_KEY`**, so the generative routes 401. Everything else must still work
from cached fixtures. Nobody has verified this. Write `scripts/smoke.mts` (runs with `npx tsx`) that:

1. `GET /api/health` → assert `status: "ok"` and `render.ffmpeg === true`
2. `GET /demo/genome.json`, `/demo/brief.json`, `/demo/result.json` → assert each parses and has the
   fields the UI reads (check against `lib/types.ts` and `lib/brand.ts`)
3. `GET /demo/demo.mp4` → assert it's >100 KB and `content-type: video/mp4`
4. `POST /api/publish` with **no** `x-publish-secret` → assert **401**. This is a security regression
   test: that route posts to a real Instagram account and the app is publicly deployed.
5. Print a clear pass/fail table and exit non-zero on any failure.

```bash
npm run dev          # in one terminal
npx tsx scripts/smoke.mts
```

**Report what fails — do not fix code outside your lane.** A failure here is the most valuable thing
you can find today; tell the team instead of patching around it.

## Task 2 — `samples/` (the submission explicitly asks for this)

The submission requires *"samples of what you generated."* Nobody will remember this at 16:20.

Create `samples/` containing, copied from `public/demo/`:
- `shoot-brief.md` — `demo/brief.json` rendered as readable markdown: hook, the shot table
  (n · label · seconds · say · camera), caption, hashtags, CTA, sound idea, best post time
- `brand-genome.md` — `demo/genome.json` as markdown: the 8 verbatim pet phrases, the palette as hex
  swatches, pillars, ICP, proof points, hook patterns
- `cut-report.md` — from `demo/result.json`: source duration → output duration, seconds removed, and
  the cut table with reasons (silence / filler / head / tail), plus the caption timings
- `reel.mp4` — copy of `demo/demo.mp4`
- `samples/README.md` — one paragraph explaining these are real pipeline outputs and which command
  produced each

Everything in `samples/` must be **real output**, never invented. If a field is missing from the
fixtures, leave it out rather than filling it in.

## Task 3 — rewrite the root `README.md`

A judge in round 1 opens the repo and forms an opinion in 30 seconds. Currently it's the war-room
plan, which is the wrong audience. Rewrite for a judge:

1. **One sentence** on what it does, then a screenshot or the `samples/reel.mp4` link
2. **The pipeline as a diagram** — topic → brief → film → transcribe (word-level) → cut → caption →
   render → publish. Name the tool at each step: Claude, ElevenLabs Scribe, ffmpeg, @napi-rs/canvas,
   Firecrawl, Instagram Graph API
3. **What's real vs what's stubbed** — be exact and honest. Cut/render/captions are real and verified
   (`npm run verify:render` prints the numbers). Instagram publishing needs a Business account token.
   Judges respect a precise limitations section; they distrust a vague one.
4. **Run it:** `npm i`, `.env.example` → `.env.local`, `npm run dev`. Plus `docker build`.
5. **`npm run verify:render`** — highlight this. It proves the hard part works in ~10 seconds on a
   reviewer's machine, with no API keys. That is an unusually strong thing for a judge to find.
6. Architecture table: one line per `lib/*.ts` saying what it does
7. MIT license note

Keep it under 150 lines. Skimmable. No marketing voice.

## Task 4 — `docs/DECK.md`, 5 slides

The guidebook prescribes exactly 5 slides. Content and structure are already written in
`docs/11-PITCH.md` — turn it into actual slide-ready markdown, one `##` per slide, speaker notes as
blockquotes underneath. Slide 3 is **sample output** and gets the most space; reference the real files
in `samples/`.

Do **not** invent metrics, customers, or traction. Every factual claim must be traceable to
legacy-ai.de's real site copy or to `samples/`.

## Acceptance

1. `npx tsx scripts/smoke.mts` runs and its pass/fail table is accurate
2. `samples/` contains only real pipeline output
3. `README.md` reads like a product a stranger could run in 5 minutes
4. `docs/DECK.md` is 5 slides, no invented facts
5. `npx tsc --noEmit` still clean, and you touched nothing outside your lane

## Rules

- Commit and push every 15 minutes. `git pull --rebase origin main` first, every time.
- No new dependencies. `tsx` is already installed.
- **Never invent output, metrics, customers, or quotes.** If it isn't in the repo or on
  legacy-ai.de, it doesn't go in.
- **Hard stop 14:45.**
