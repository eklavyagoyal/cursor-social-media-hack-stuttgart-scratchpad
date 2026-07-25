# 13 — Plan B: five pivots off the same chassis

**When to open this doc:** only between 10:00 and 10:20, and only if one of these is true:
- A teammate has a genuinely better idea *and* the team is excited about it (energy beats optimality)
- The kickoff talk reveals a constraint that breaks Doppel (e.g. "no third-party publishing")
- Someone at another table announces the identical product and you'd rather differentiate

**After 10:20, this doc is closed.** Pivoting at noon is how teams end up with nothing to submit.
A worse idea shipped beats a better idea half-built — the rubric gives 25% to a *working* demo.

## What every option below shares

The same chassis, so a pivot costs ~15 minutes, not 2 hours:
`Next.js on Vercel` · `Firecrawl in` · `Claude middle` · `fal + ElevenLabs out` · `n8n ships` ·
`streaming trace UI` · `cached demo path` · all five sponsors on the critical path.

---

## B1 · Trendjacker — "your brand's take on today's news, before lunch"

**Pitch:** Every morning, Firecrawl sweeps the creator's niche. Claude ranks what's trending against
their Brand Genome and rejects anything they'd have no standing to comment on. By 8am they have three
finished posts on today's news, in their voice, waiting for a thumbs-up in Telegram.

- **Why it scores:** speed-to-relevance is the #1 real pain for creators. Very high "real problem."
- **Wedge:** most tools help you write. This tells you *what* to write, today, and rejects bad fits.
- **Risk:** trend-source quality. Mitigate by hardcoding 3 solid RSS/search sources per niche.
- **Cost to pivot from Doppel:** ~zero. This *is* Doppel's P1 nightly loop promoted to the headline.
  **This is the best pivot if the Genome extraction turns out weak by 12:30.**

## B2 · One Take — "one voice memo → a week of content"

**Pitch:** The creator rambles into their phone for 90 seconds while walking. Upload. Out comes a
LinkedIn post, a thread, a carousel, a Reel with their own voice, and a newsletter — all preserving
their actual phrasing because the source *is* their actual phrasing.

- **Why it scores:** the input is the lowest-friction thing a creator can produce. Hugely relatable.
- **Wedge:** repurposing tools start from long-form *video*. This starts from a 90-second thought.
- **Risk:** more crowded space (Opus Clip et al). Differentiate on the input, not the output.
- **Cost to pivot:** low. Swap Firecrawl-in for Whisper/ElevenLabs-STT-in; keep everything downstream.
  **Drops Firecrawl from the critical path** — a real cost given "sponsor integration" scoring. Add
  Firecrawl back as "we also read your site to learn your voice."

## B3 · Comment Farm — "the reply guy that isn't you"

**Pitch:** Growth on LinkedIn and X comes from replies, not posts, and nobody has time. Point it at
20 accounts in your niche; it reads new posts, drafts a genuinely useful reply in your voice, and
queues them for one-tap approval.

- **Why it scores:** a real, specific, unglamorous growth pain almost nobody builds for. High novelty.
- **Wedge:** everyone automates posting. Nobody automates *distribution behaviour*.
- **Risk:** ⚠️ this is adjacent to spam. **Frame it as approve-then-post, never autonomous**, and say
  so explicitly. An agency-owner judge will raise it, and having the answer ready turns it into a
  strength. Also thin on real posting (reply APIs are gated) — lean on Bluesky, which allows replies.
- **Cost to pivot:** medium — new read path, but the Genome and voice layers carry over intact.

## B4 · Brand Kit in 60 Seconds — "the Genome, standalone"

**Pitch:** Ship *only* screen 1. Paste any URL, get a shareable brand-kit page: voice guide, palette,
pillars, hook library, do/don't list. Free for anyone, and the output is inherently viral because
people share their own brand card.

- **Why it scores:** narrowest scope on this page, so it will be the most *complete* — and completeness
  is 25% of the rubric. Best possible Firecrawl demo. Built-in growth loop.
- **Wedge:** it's a €3k agency deliverable, produced in 60 seconds and shareable.
- **Risk:** less "AI wow" (no video, no voice) → weaker on the 30% Technical Innovation criterion.
  Mitigate by adding **one** ElevenLabs touch: *"hear your brand's voice"* — a 15-second audio read of
  the brand's own tagline in a matched voice. Cheap, restores the wow.
- **Cost to pivot:** negative — it's a *cut*, not a pivot. **This is your 14:00 emergency de-scope.**
  If the Studio pipeline is failing at 14:00, drop to B4 and ship something flawless. Do not hesitate.

## B5 · Doppel Live — "the AI creator that posts on its own account"

**Pitch:** Give the machine its own public identity. It picks a niche, generates its own Genome, and
runs a real Bluesky account autonomously — posting, replying, evolving its voice from engagement — with
a public dashboard showing every decision it made and why.

- **Why it scores:** highest novelty on this page by a distance. It's a *spectacle*, and the demo is a
  live URL a judge can open on their phone right now and watch grow.
- **Wedge:** nobody demos an autonomous agent with a real audience and an auditable reasoning log.
- **Risk:** hardest to make legible in 2 minutes, and weakest "does it help a content creator" story —
  which is 30% of the score. Frame it as **the proof**: *"we ran the whole loop unattended for six
  hours on a real account; here's the receipt."*
- **Cost to pivot:** low, and it composes — you can ship Doppel **and** run a Doppel Live account in
  the background all day, then show the account in slide 3 as evidence. **Do this regardless if you
  have a spare 20 minutes.** It is free credibility.

---

## Decision matrix

| | Real problem (30%) | Innovation (30%) | Execution risk (25%) | Presentation (15%) |
|---|:---:|:---:|:---:|:---:|
| **Doppel** (default) | ★★★★ | ★★★★★ | medium | ★★★★★ |
| B1 Trendjacker | ★★★★★ | ★★★★ | low | ★★★★ |
| B2 One Take | ★★★★★ | ★★★ | low | ★★★★ |
| B3 Comment Farm | ★★★★ | ★★★★★ | medium | ★★★ |
| B4 Brand Kit | ★★★ | ★★★ | **very low** | ★★★★ |
| B5 Doppel Live | ★★ | ★★★★★ | high | ★★★ |

**Read of the matrix:** Doppel is the right default — it's the only option that's strong on both 30%
buckets at once, and it *contains* B1, B4 and B5 as subsets. That's the real reason to pick it: every
plan B is a de-scope of the plan A, so a bad afternoon costs you scope, never a restart.

## The de-scope ladder (this is the doc's actual job)

If things go badly, walk **down** this ladder — never sideways to a different idea:

```
Doppel full          Genome + Drop(5 assets) + video + real publish + nightly loop
   ↓ 13:00 behind
Doppel core          Genome + Drop + cloned-voice vertical + one real post
   ↓ 14:00 behind
Doppel lite          Genome + carousel + LinkedIn post + one real post      ← still a strong submission
   ↓ 14:30 behind
B4 Brand Kit         Genome card + audio tagline + share page               ← flawless and complete
```

Each rung is a **complete, demoable product** with a real story. That's the point. A team that ships
rung 4 beautifully outscores a team that half-ships rung 1 — because 25% of the score is *"does it
actually work"* and 15% is *"well-structured pitch."*

**Say the ladder out loud at 10:20 so nobody panics later when you step down it.** Stepping down is
the plan, not a failure.
