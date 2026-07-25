# 01 — The Product: DOPPEL

## One-liner (memorize this exact sentence)

> **"Doppel takes one link and builds a content studio that sounds like you — it learns your voice,
> writes and produces the posts, and ships them every day without you."**

Variants by listener:
- **Creator (this is the scored ICP):** *"You post on four platforms a day and sound like yourself on none. Doppel fixes that from one link."*
- **Agency owner (the GTM story):** *"One operator, twelve clients, every client sounds like themselves."*
- **Sponsor / technical:** *"Firecrawl reads the brand, Claude writes it, fal renders it, ElevenLabs speaks it, n8n ships it."*

## Who has the problem (be specific — the guidebook demands it)

> **Founder-led brands and solo creators with 10k–200k followers** who post daily across LinkedIn,
> Instagram, TikTok and X, have no team, and whose "brand voice" lives entirely in their own head.

How they solve it today, and why it sucks:
- **Write it themselves at 11pm** → inconsistent, and it's the first thing that slips when they're busy.
- **ChatGPT/Jasper** → generically competent, recognisably not them. Every prompt starts from zero
  because the tool never learns who they are.
- **Hire a ghostwriter (€1.5–4k/mo)** → 2–4 weeks of onboarding to learn the voice, and it walks out
  the door when they leave.

Doppel's wedge: **the brand is the input, not the prompt.** Onboarding is 60 seconds and a URL.

## Name

**DOPPEL** — German for *double*. One syllable, lands in a Stuttgart room, and it describes the
product literally: a double of you that posts. Alternates: Voiceprint, Brandtwin, Echo Studio.
**Lock the name at 10:20 and never revisit it.**

## Why this isn't another caption tool

| Everyone else | Doppel |
|---|---|
| Starts from a prompt | Starts from a **brand** |
| Generic AI voice | Their voice — text style **and** cloned audio |
| One asset at a time | One Drop = 5 assets, 4 platforms, one click |
| You still have to post it | n8n ships it and refills the queue nightly |
| Onboarding = a form | Onboarding = paste a URL |

The demo-able consequence, which is the whole strategic point:
**any judge's own brand works as input.** No other team can do that.

## The three screens (build in this order)

### 1 · Genome
One URL (+ optional 30s voice sample) → a **Brand Genome card**: beautiful, one page, screenshot-able.
- Voice: 3 adjectives · 8 pet phrases · forbidden words · sentence style · emoji policy
- Look: 5 hex swatches · typographic vibe · imagery style
- Substance: 6 content pillars · ICP · 3 proof points
- Hooks: 5 hook patterns lifted from their best existing posts

This screen alone is a product creators would pay for, and it's the fastest path to "whoa."

### 2 · Studio
One topic → a **Drop**, one idea rendered five ways:
1. LinkedIn post (their structure, their line breaks)
2. X/Bluesky thread (5 posts)
3. IG carousel — 4 slides, fal-generated backplates in their palette, text overlaid
4. **Vertical short, ~20s** — on-palette visuals, **cloned-voice VO**, burned captions
5. Audio voice-note version (~45s) for Stories

Rendered as a **live agent trace** while it works — see §Waiting is the show.

### 3 · Ship
Approve → n8n webhook → **actually posts** to Bluesky + Telegram (real, instant), queues
LinkedIn/IG/TikTok with an honest *"awaiting creator OAuth"* state. Plus a 14-day calendar and a
**Loop** toggle for the nightly trend sweep.

## 🔑 The lazy call that saves your day: the "video" is a web component

Rendering an actual .mp4 is the single most likely thing to eat 90 of your 240 build minutes.
**Don't.** In P0 the vertical short is a **DOM component**, not a file:

- A 9:16 container, full-bleed
- fal images crossfading with a slow CSS `scale()` (Ken Burns)
- Captions animating in, word-grouped, synced to the audio's `currentTime`
- The ElevenLabs mp3 playing via one `<audio>` element

~40 lines of React + CSS. It is **instant**, it never fails, and on a screen it is indistinguishable
from a Reel. You screen-record it for the submission video anyway — which is the only place a real
file was ever needed.

```
// ponytail: the "video" is a DOM player, not an encoded file. On screen it is
// identical, it renders in 0ms instead of 60s, and it cannot fail live.
// Upgrade path: fal image→video or ffmpeg export — only if a user needs a download.
```

Real mp4 export is **P1**. If someone in Q&A asks "can I download it?" — *"Yes, that's an ffmpeg
export step; today it renders in the browser so you can iterate in real time."* True, and better.

## Gasp moments (priority order)

1. **The judge's own brand as live input.** Impossible to be bored by. Unfakeable.
2. **The cloned voice.** Reliable audible reaction in every room, every time.
3. **It really posted.** Refresh a live profile: posted 11 seconds ago. Converts demo → product.
4. **The n8n canvas.** 4 seconds. *"This runs at 6am whether or not anyone opens the app."*

## Waiting is the show

Generation takes time. Don't hide it behind a spinner — **stream the trace** as large animated lines:

```
◐ reading brand surface .............. 8 sources
✓ voice fingerprint locked ........... warm · blunt · no emojis
✓ palette extracted .................. #0B3D2E  #E8DCC8  #C1440E
◐ writing 5 assets ...................
✓ voice cloned ....................... 1 sample · 31s
◐ rendering vertical ................
```

That's not a loading state, it's a competence demonstration. It buys a full minute of narration and
it looks expensive.

## Scope — tightened for a 4-hour build

### P0 — must be green by 14:45 (the demo dies without these)
- [ ] URL → `BrandGenome` (Firecrawl + Claude) → rendered Genome card
- [ ] Topic → LinkedIn post + X thread + 4-slide carousel copy, in-voice
- [ ] 4 fal images in the brand palette
- [ ] ElevenLabs cloned-voice VO + the DOM vertical player with synced captions
- [ ] One real post to **Bluesky** (visible on a public profile) + Telegram
- [ ] Deployed Vercel URL
- [ ] Streaming trace UI
- [ ] Cached golden path (`/api/demo/:slug`) that works with wifi off

> **2-person team:** publish **directly from `/api/publish`**, not through n8n — building the fan-out
> twice is ~40 min you don't have. n8n then owns only the nightly loop (P1), which is the part it's
> actually better at. → [`10-TEAM-LANES.md`](10-TEAM-LANES.md) §the two-person plan

### P1 — only if P0 is green (in this order)
- [ ] n8n nightly trend sweep → Telegram ✅/✏️ approval buttons *(big innovation-score value)*
- [ ] ElevenLabs **German dub** of the same short — huge wow, one API call, Stuttgart room
- [ ] 14-day calendar view
- [ ] Mastodon posting (~10 min, cheap credibility)
- [ ] Audio voice-note asset
- [ ] Real mp4 export

### CUT — do not build. If behind, cut in this order.
1. Auth / accounts / multi-tenant → demo mode, single tenant, no login
2. Database → JSON on disk + Vercel Blob (Neon only if the calendar must survive a redeploy)
3. Real IG / TikTok / LinkedIn OAuth → honest queued state ([`08`](08-PUBLISHING-REALITY.md))
4. Editing / regenerate-this-slide UI → not in a 2-minute demo
5. Analytics dashboard → mock the numbers and **say** they're mocked
6. Settings, billing, onboarding flow, dark-mode toggle, mobile polish
7. Tests — except the **one** Genome-parse check in [`04`](04-ARCHITECTURE.md)

**Cut rule: at 14:45, anything not working gets cut, cached, or faked. No debate.** Write it on the wall.

## The 60-second acid test (do this at 10:15, before any code)

One person tells the story out loud in 60 seconds while another times it. If it doesn't land in 60
seconds, the **product** is wrong, not the pitch. Fix the product while it's still free to.
