# 00 — Win Conditions (from the official guidebook)

## The two-round structure — this changes everything

```
16:30  Submission deadline  ──▶  ROUND 1: judged ONLINE from your artifacts
                                  (no live demo, no you in the room)
                                          │
                                       Top 8
                                          ▼
17:30  ROUND 2: live jury + audience.  3 min pitch + 2 min demo + 2 min Q&A
19:00  Winners announced
```

**Round 1 is asynchronous.** A judge with a browser tab decides your fate from:
a 2-minute video, a GitHub repo, a 5-slide deck, and (optionally) a live URL.

> ### The single biggest lever of the day
> Most teams will code until 16:25 and then panic-record a shaky 2-minute video with no audio plan.
> **That video is 100% of round 1.** We reserve **15:00–16:00** for it and treat it as a deliverable,
> not an afterthought. This is how we get into the top 8 while better-coded projects don't.

## The official rubric

| Weight | Category | What they look for | How we win it |
|---:|---|---|---|
| **30%** | Real Problem Solving | *"Does this help content creators in a real way?"* | Name a specific creator and their specific daily pain. Not "businesses." |
| **30%** | Technical Innovation & AI Implementation | *"Creative use of AI? **Strong sponsor tool integration?** Novel approach?"* | All 5 sponsor tools on the critical path — this is worth points, not just prizes |
| **25%** | Execution & Working Demo | *"Does it actually work? How complete? Stable during the demo?"* | Live URL + cached golden path. **Stability is explicitly scored.** |
| **15%** | Presentation | *"Clear problem story? **Engaging video?** Well-structured pitch?"* | The 2-min video is named in the criteria. Treat it as a product. |

Note what's written into the rubric that most teams will miss:
- **"Strong sponsor tool integration"** is inside the 30% innovation bucket → using Firecrawl + fal +
  ElevenLabs + n8n + Cursor is directly worth marks. Our architecture is not prize-farming; it's scoring.
- **"Stable during the demo"** is inside the 25% → a cached fallback path is worth points.
- **"Engaging video"** is inside the 15% → editing quality matters.

## Who the judge is thinking about

The guidebook is explicit: *"how useful it is to a **content creator**."* The deck instructions say be
specific — *"busy founders, content creators with more than 50k followers"*, **not** "businesses."

**So we lead with the creator, not the agency:**

> "A founder-led brand or solo creator who has to post daily on four platforms and sounds like
> themselves on none of them."

Agencies come in on the **Go-to-Market slide** as the scale story ("one operator, twelve clients"),
because agency owners are also in the room giving feedback. Creator = the score. Agency = the business.

## ⚠️ The pre-built rule — read this twice

From the guidebook, verbatim:

> **Not OK:** *A mostly finished product* — no bringing pre-built projects and "just polishing" on-site.
> **Not OK:** *Project-specific pre-built code* — features built before the hackathon that make up your
> submission's core.
> *"We judge what you build at the hackathon. Projects that are largely pre-built may be penalized in
> scoring or removed from awards."*

> **OK to Bring:** *Ideas, notes, sketches, research.* · *Generic starter templates — boilerplate you
> reuse for any project (not project-specific).* · *Third-party tools, open source, sponsor tech.*

### What that means for us

| ✅ Bring | ❌ Do not bring |
|---|---|
| These `docs/*.md` — they're notes/research/sketches, explicitly allowed | Any Brand-Genome / Drop / prompt code |
| API accounts + keys | A working `/api/genome` route |
| Burner social accounts, a Bluesky app password | A pre-wired publishing pipeline |
| A 30-second voice sample (an asset, not code) | A pre-cloned voice + pre-generated demo assets |
| Knowledge of which fal model slug to use | Anything with "doppel" in the filename |

**Our defense is the git log.** Create the repo **at kickoff (09:30)**, commit every 15–20 minutes,
push constantly. The guidebook itself says *"Commit early, commit often — create your repo at kickoff."*
A commit history that starts at 09:40 and ends at 16:25 with 40 commits is unimpeachable evidence.

**On the generic starter:** `pnpm create next-app` + Tailwind + installing the 5 SDKs is defensible
generic boilerplate — but the safest and barely-slower move is to run it live at 10:00 as commit #1.
It costs 4 minutes. Do it at the venue. Don't hand a judge a reason to discount you.

**Also required:** the project must be **open source**. Add an MIT `LICENSE` and make the repo public.

## Stack the prize pools

Six shots, not one. Perks (Cursor, ElevenLabs, fal, n8n credits) are claimed **on the portal by the
team lead after the team is locked** — so lock the team fast.

- **Main prize** — the rubric above.
- **Cursor** — built in Cursor. Show the agent panel for 3 seconds in the video.
- **ElevenLabs** — voice cloning + multilingual dub. Our whole audio layer.
- **Firecrawl** — one URL → structured brand DNA. The best possible Firecrawl demo.
- **fal.ai** — on-palette image + video generation.
- **n8n** — the autonomous nightly loop. Show the canvas; judges love a workflow diagram.

### Ask every sponsor rep, verbatim, before lunch

> "We're building X and we use your API for Y. What would make you want to give us your prize?"

Then do that thing. Log answers here:

```
Cursor      →
ElevenLabs  →
fal.ai      →
n8n         →
Firecrawl   →
```

## What loses

| Anti-pattern | Why it dies |
|---|---|
| "It's an AI caption generator" | Judges will see six. Instant tune-out. Innovation = 30%. |
| Coding until 16:25, then recording the video | You fail round 1 and never get to pitch. |
| A 2-min video with bad audio / no narration | "Engaging video" is explicitly in the rubric. |
| Private repo / no license at 16:30 | *"All of them have to be publicly accessible when submitting."* |
| Claiming it posts to TikTok when it drafts privately | Creators and agency judges know the API gates. Credibility zero. |
| A demo that crashes | "Stable during the demo" is 25% of the score, in writing. |
| Live-generating something never tested | Half the teams doing this will fail on stage. |
| Positioning at "businesses" | The deck instructions explicitly call that out as wrong. |

## Self-grade at each checkpoint

Score 1–5 out loud as a team. Anything ≤3 is the next thing you work on.

```
12:30   problem __  innovation __  execution __  presentation __
15:00   problem __  innovation __  execution __  presentation __
16:15   problem __  innovation __  execution __  presentation __
```

## Logistics from the guidebook

- **Where:** Infomotion office, **4th floor**, Friedrichstr 6, 70174 Stuttgart
- **Comms:** Discord (all questions, all team formation)
- **Bring:** laptop, charger, water bottle
- **Food:** breakfast + lunch provided. **No dinner** — winners are announced 19:00, so bring a snack.
- **Teams:** 1–4; guidebook recommends **2–3**
