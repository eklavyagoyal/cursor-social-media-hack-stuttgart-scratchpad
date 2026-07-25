# 02 — Battle Timeline (real schedule)

```
09:00  Check-in + breakfast          ← Luma check-in at the front desk, get badge
09:30  Introduction                  ← create the repo during this. commit #1.
11:00  🔒 TEAM REGISTRATION DEADLINE  ← hard. team locked on the portal or you're out.
13:00  Lunch
15:00  🎬 STOP CODING → make the submission
16:00  Recommended dev stop
16:30  🔒 SUBMISSION DEADLINE         ← round 1 judged online from your artifacts
17:30  Top 8 present live             ← 3 min pitch + 2 min demo + 2 min Q&A
19:00  Winners announced
```

**Actual coding window: 10:00 → 15:00. Five hours, minus lunch. ~4 hours of real build.**
Scope accordingly — see the tightened P0 in [`01-THE-PRODUCT.md`](01-THE-PRODUCT.md).

---

## NOW → 08:15 · Pre-flight (no code, per the rules)

| # | Task | Time |
|---|------|------|
| 1 | **Get on Discord. Start DMing people.** The guidebook says team formation should happen before the event, and registration closes at 11:00. Post: *"Building a tool that clones a brand's voice from one URL and auto-posts. Looking for 1 frontend/design + 1 creator/marketer. DM me."* | 15 min |
| 2 | Create free accounts (no keys needed yet — credits come from the portal): Anthropic, fal, ElevenLabs, Firecrawl, n8n Cloud, GitHub, Loom or YouTube | 20 min |
| 3 | Create the burner social accounts: **Bluesky** (+ app password) and a **Telegram bot** via @BotFather + a channel. Send one test post from each. → [`08`](08-PUBLISHING-REALITY.md) | 20 min |
| 4 | Record a **30-second voice sample** (quiet room, phone voice memo, read any paragraph naturally). Save as `voice-sample.m4a`. It's an asset, not code — allowed. | 3 min |
| 5 | Read [`03-DEMO-SCRIPT.md`](03-DEMO-SCRIPT.md) and [`11-PITCH.md`](11-PITCH.md) once, out loud | 10 min |
| 6 | Pack: laptop, charger, **HDMI/USB-C adapter**, water bottle, headphones, snack (no dinner provided) | 5 min |

**Do NOT pre-build the app.** Project-specific code written before 09:00 can get you penalized or
removed from awards. Everything gets written at the venue, committed live.

---

## 09:00–09:30 · Check in & recon

- Luma check-in at the front desk → badge. **Then** sign up on the hackathon portal (portal signup
  is gated on venue check-in).
- Photograph the rules slide. Confirm: exact submission link, whether round 1 judges the live URL.
- Note **who the judges are**. Look up one of their brands — that's your live-demo target if nobody
  volunteers a URL (see [`03`](03-DEMO-SCRIPT.md)).
- Locate the 5 sponsor reps. Note where they sit.
- Wifi SSID + password. **Test whether you can hotspot.**
- 4th floor — find the room, the power sockets, and the presentation screen. **Test your adapter now.**

---

## 09:30–10:00 · Team + repo (parallel)

One person listens to the intro and does portal admin. Everyone else starts.

**Admin track:**
1. Find/confirm teammates (Discord DMs from last night pay off here).
2. One person registers the team on the portal, nominates a team leader.
3. **Lock the team → team lead claims perks: Cursor, ElevenLabs, fal, n8n credits.** Firecrawl may
   need your own free tier. AirDrop keys to everyone immediately.
4. ⚠️ Watch the clock: **11:00 is a hard deadline.** Do this before anything else.

**Build track — commit #1 during the intro talk:**
```bash
gh repo create doppel --public --clone && cd doppel
pnpm create next-app@latest . --ts --tailwind --app --yes
printf 'MIT License\n\nCopyright (c) 2026 Doppel\n' > LICENSE   # open source is required
git add -A && git commit -m "chore: scaffold next app" && git push
```
Then `./scaffold.sh` from these docs for deps + dirs → commit #2. → [`05`](05-PREFLIGHT-SETUP.md)

---

## 10:00–10:20 · Lock scope (hard stop 10:20)

1. Read the P0 list in [`01`](01-THE-PRODUCT.md) aloud. Object now or never.
2. Assign lanes → [`10-TEAM-LANES.md`](10-TEAM-LANES.md).
3. **Write the two interfaces on paper**: `BrandGenome`, `Drop`. Photograph it. Everyone codes
   against the shape; nobody blocks on anybody. This is the most important 5 minutes of the day.
4. `.env.local` AirDropped. Everyone confirms `pnpm dev` runs.
5. Name locked. `vercel --prod` → live URL exists (even if it's the default page).

Set phone alarms **now**: `11:00 TEAM REG` · `12:30 E2E` · `15:00 STOP CODING` · `16:15 SUBMIT`.

---

## 10:20–12:30 · Build to ugly-end-to-end

Goal is not quality. Goal is: something goes in one end, something comes out the other.
Hardcode, stub, fake. Ugly is correct at this hour. **Commit every 15–20 min.**

| Lane | By 12:30 |
|---|---|
| A · Genome | `POST /api/genome` returns a real `BrandGenome` from a real URL |
| B · Studio | `POST /api/drop` returns text assets + **one** fal image + **one** ElevenLabs mp3 |
| C · Ship | Bluesky post works from a script; n8n webhook receives and logs |
| D · Show | Three screens render **hardcoded fixture JSON** — beautifully |

Lane D matters most before lunch. A gorgeous UI over fake data outscores a real pipeline behind an
ugly one, because the UI is what the round-1 judge sees in the video.

**🔔 12:30 CHECKPOINT (hard).** Everyone stops, runs the full flow on the deployed URL, fake data OK.
If it doesn't run end-to-end: **cut P0 items until it does.** Highest-stakes decision of the day.

---

## 13:00–13:25 · Lunch (with the pipeline warming)

Eat fast. While eating:
- Kick off Drops for 3 real brands so assets are **cached** by the time you're back.
- One person walks the room and asks every sponsor rep the prize question ([`00`](00-WIN-CONDITIONS.md)).
- One person drafts the 5 slides ([`11`](11-PITCH.md)) — do NOT leave this to 16:00.

---

## 13:25–15:00 · Make it real (95 minutes, that's all)

Replace fakes with real calls, one at a time, deploying after each.

- Genome: crawl 6–8 sources, not 1. Handle JS-only sites → [`12`](12-FALLBACKS.md).
- Studio: full 4-slide carousel + the vertical player + cloned VO + captions.
- Ship: real post to Bluesky **with media**. Real Telegram message.
- Show: streaming trace, Genome card typography, the vertical player.
- **Deploy every 20 minutes.** A broken prod at 15:00 with no last-good deploy loses the day.

**14:45 — soft freeze.** Whatever isn't working at 14:45 gets cut, cached, or faked. No new code.

---

## 15:00 · 🎬 STOP CODING. Build the submission.

This is not optional and it is not negotiable. **Round 1 is judged only on these artifacts.**
Split the team — two on the video, one on the deck, one on repo/README/hygiene.

| 15:00–15:15 | **Cache the golden path.** Pre-run the demo brand + 2 backups. Save every asset into `public/demo/`. Verify the cached path works with wifi off. |
| 15:15–15:50 | **Record the 2-minute video.** Script in [`03`](03-DEMO-SCRIPT.md) §A. Screen record + real narration. Do 3 takes, keep the best. Loom is fastest; YouTube (unlisted→public) is safest. |
| 15:50–16:05 | **Finish the 5-slide deck** ([`11`](11-PITCH.md)). Google Slides, share → *anyone with the link*. |
| 16:05–16:15 | **Repo hygiene:** README with screenshot + one-liner + setup, `LICENSE`, `.env.example`, repo **public**, sample outputs committed to `samples/`. |
| 16:15–16:25 | **SUBMIT.** Then open every link in a logged-out incognito window. *"All of them have to be publicly accessible."* A private repo = a zero. |

**16:25 — hands off keyboards.** Submitted is submitted.

---

## 16:25–17:30 · Prepare for the live round (assume you're in the top 8)

| 16:25–16:45 | Rehearse the **3-min pitch** with a timer. Someone else holds the clock and cuts you off. |
| 16:45–17:00 | Rehearse the **2-min demo** on the demo laptop, on venue wifi. Twice. |
| 17:00–17:15 | Rehearse the **fallback** (wifi dead → cached → recording). → [`12`](12-FALLBACKS.md) |
| 17:15–17:30 | Q&A drill: someone fires the hard questions from [`11`](11-PITCH.md) §Q&A. |

If you're not in the top 8: eat, talk to judges and sponsors anyway, get contacts. The repo is a
real product and you keep it.

## Pre-stage checklist (15 min before you're called)

```
[ ] Laptop plugged in · adapter already tested on THAT projector
[ ] Do Not Disturb ON · Slack/Discord/Mail quit · notifications OFF
[ ] ONE browser window, bookmarks bar hidden, zoom 125%, tabs in demo order, all warm
[ ] Terminal font ≥18pt
[ ] 🔊 Volume tested through the venue speakers — the voice clone is the gasp, it MUST be audible
[ ] Hotspot on standby, tested
[ ] Fallback recording open in a background tab, paused at frame 0
[ ] Slides open in presenter mode on the second display
[ ] Water. Your mouth will go dry.
```
