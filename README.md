# 🏆 WAR ROOM — Social Media Hackathon Stuttgart

**Sat 2026-07-25 · Infomotion, 4th floor, Friedrichstr 6 · be there 09:00**
20+ teams · teams of 1–4 (2–3 recommended) · all comms on **Discord**

```
09:00 check-in + breakfast     11:00 🔒 TEAM REG DEADLINE     13:00 lunch
15:00 🎬 stop coding            16:30 🔒 SUBMISSION            17:30 top 8 live     19:00 winners
```

**Judging is two rounds.** Round 1 is **judged online from your submission** — a 2-minute video, a
public repo, a 5-slide deck, a live URL. Only the **top 8** pitch live (3 min pitch + 2 min demo +
2 min Q&A). So the submission artifacts are the primary deliverable, not an afterthought.

**Rubric:** 30% real problem for **content creators** · 30% technical innovation & **sponsor tool
integration** · 25% execution & working demo (*"stable during the demo"*) · 15% presentation
(*"engaging video"*). Full read → [`docs/00-WIN-CONDITIONS.md`](docs/00-WIN-CONDITIONS.md)

---

## The product: **DOPPEL**

> **Paste one link. Get a content studio that sounds exactly like you — and ships without you.**

One URL → we reverse-engineer the **Brand Genome** (voice, verbatim pet phrases, palette, hooks,
pillars) → generate a full multi-platform **Drop** (LinkedIn post, thread, carousel, vertical short
narrated in a *cloned voice*) → **n8n ships it** and refills the queue on a nightly trend loop.

**Firecrawl reads the brand · Claude writes it · fal renders it · ElevenLabs speaks it · n8n ships it.**
All five sponsors on the critical path — which is worth 30% of the score, not just prize eligibility.

**The unfakeable demo:** ask a judge for a brand URL on stage. 90 seconds later their Genome is on
screen and a finished short in their voice is playing. No other team can take a *brand* as input.

Full spec → [`docs/01-THE-PRODUCT.md`](docs/01-THE-PRODUCT.md)

---

## ⚠️ Read this before you write any code

The guidebook is explicit: **pre-built project-specific code can get you penalized or removed from
awards.** Only *ideas, notes, sketches, research* and *generic boilerplate* may be brought in.

- ✅ These `docs/*.md` are notes/research — explicitly allowed.
- ❌ No Genome/Drop/prompt code before 09:00. Repo is created **at kickoff**, commit #1 at ~09:40.
- 🛡️ **Your defense is the git log.** Commit every 15–20 min. Push every time.
- 📜 The project **must be open source** — MIT `LICENSE`, public repo.

---

## ⚡ Before you leave the house (~60 min, zero code)

| # | Task | Time | Doc |
|---|------|------|-----|
| 1 | **Get on Discord and DM 5 people.** Team reg closes 11:00 and there's little time on the day. | 15 min | [`05`](docs/05-PREFLIGHT-SETUP.md) |
| 2 | Free accounts: Anthropic · fal · ElevenLabs · Firecrawl · n8n Cloud · Cursor · Vercel · GitHub · Loom/YouTube. **Credits are claimed on the portal at the event by the team lead.** | 20 min | [`05`](docs/05-PREFLIGHT-SETUP.md) |
| 3 | Burner social accounts: **Bluesky app password** + **Telegram bot & channel**. Send one test post from each. | 20 min | [`08`](docs/08-PUBLISHING-REALITY.md) |
| 4 | Record a **30s voice sample** (quiet room, phone memo, read naturally) → `voice-sample.m4a` | 3 min | [`06`](docs/06-SPONSOR-PLAYBOOK.md) |
| 5 | Read the 2-min video script and the 5-slide structure **out loud** once | 10 min | [`03`](docs/03-DEMO-SCRIPT.md) · [`11`](docs/11-PITCH.md) |
| 6 | Pack: laptop · charger · **HDMI/USB-C adapter** · water bottle · headphones · **snack (no dinner)** | 5 min | — |

---

## ⚠️ Push constantly — two people + multiple agents, one repo

```bash
git pull --rebase origin main   →   commit   →   push        # every 15 min, no exceptions
npx tsc --noEmit                                            # clean before every push
```

Unpushed work is invisible to your teammate and to every agent. Two agents that can't see each
other's work will write the same file twice. Canonical rule: **`AGENTS.md`** (auto-read by every
agent in this repo). Never force-push `main`. On a conflict, the other side's naming wins.

## The 10 commandments

1. **The 2-minute video is 100% of round 1.** Reserve 15:15–15:50 for it. Everyone else panic-records at 16:25.
2. **Stop coding at 15:00.** Not 16:00. The submission takes 90 minutes to do properly.
3. **Lock the team before 11:00.** Perks unlock only after the team is registered.
4. **Build the demo backwards.** Make the final screen first; everything else serves it.
5. **One gasp moment:** the judge's own brand, live, in a cloned voice.
6. **Cache the golden path by 14:45, then test it with wifi OFF.** "Stable during the demo" is 25%.
7. **Don't encode an mp4.** The vertical short is a DOM player — 40 lines, instant, can't fail. → [`01`](docs/01-THE-PRODUCT.md)
8. **Touch all 5 sponsors** and ask each rep *"what wins your prize?"* Nobody else asks.
9. **Be honest about API gates.** Bluesky/Telegram post for real; IG/TikTok/LinkedIn are queued. Say so.
10. **Commit every 15 min, deploy every 20.** Your git log is both your alibi and your undo button.

---

## Docs index

| Doc | What it answers |
|-----|-----------------|
| [`00-WIN-CONDITIONS.md`](docs/00-WIN-CONDITIONS.md) | The real rubric, the two rounds, the pre-built rule, prize stacking |
| [`01-THE-PRODUCT.md`](docs/01-THE-PRODUCT.md) | What we build, the ICP, P0/P1/cut, the DOM-player shortcut |
| [`02-BATTLE-TIMELINE.md`](docs/02-BATTLE-TIMELINE.md) | Hour-by-hour against the real schedule |
| [`03-DEMO-SCRIPT.md`](docs/03-DEMO-SCRIPT.md) | The 2-min video script **and** the live 3+2+2 |
| [`04-ARCHITECTURE.md`](docs/04-ARCHITECTURE.md) | Laziest architecture that wins + what we don't build |
| [`05-PREFLIGHT-SETUP.md`](docs/05-PREFLIGHT-SETUP.md) | **Exactly what we need.** Accounts, keys, portal perk flow, verification |
| [`06-SPONSOR-PLAYBOOK.md`](docs/06-SPONSOR-PLAYBOOK.md) | Copy-paste code for all 5 APIs + prize hooks |
| [`07-N8N-AUTOMATION.md`](docs/07-N8N-AUTOMATION.md) | The full social automation spine, node by node |
| [`08-PUBLISHING-REALITY.md`](docs/08-PUBLISHING-REALITY.md) | Can we *really* post today? Per-platform truth table |
| [`09-PROMPTS.md`](docs/09-PROMPTS.md) | The actual prompts + JSON schemas + the normalizer |
| [`10-TEAM-LANES.md`](docs/10-TEAM-LANES.md) | Who does what at 2/3/4 people. Contracts first. |
| [`11-PITCH.md`](docs/11-PITCH.md) | The prescribed 5 slides + 11 Q&A answers |
| [`12-FALLBACKS.md`](docs/12-FALLBACKS.md) | 16 failure modes + escape hatches |
| [`13-PLAN-B-IDEAS.md`](docs/13-PLAN-B-IDEAS.md) | 5 pivots + **the de-scope ladder** (the important part) |

`scaffold.sh` — run at the venue, ~09:35. Generic deps + dirs + `.env.example` + `verify-keys.sh`. No features.

---

## Status board (update in place, all day)

```
[ ] 09:15  checked in on Luma · signed up on portal
[ ] 09:40  repo created, public, MIT, commit #1 pushed
[ ] 11:00  🔒 TEAM REGISTERED · perks claimed · keys AirDropped   team:
[ ] 10:20  scope locked · types on paper · lanes assigned · alarms set
[ ] 12:30  CHECKPOINT: end-to-end runs once (fake data OK)
[ ] 12:30  sponsor reps asked: Cursor _ 11Labs _ fal _ n8n _ Firecrawl _
[ ] 14:45  soft freeze · demo assets cached · wifi-off test PASSED
[ ] 15:00  🎬 CODING STOPPED
[ ] 15:50  2-min video recorded + uploaded + public
[ ] 16:05  5-slide deck done + link-shared
[ ] 16:15  every submission link opens in incognito
[ ] 16:25  🔒 SUBMITTED
[ ] 17:15  3 rehearsals done (pitch, demo, fallback)
```
