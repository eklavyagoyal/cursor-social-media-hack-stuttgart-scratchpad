# 03 — Scripts: the 2-min video + the live round

Two different performances. **Do not confuse them.**

| | Round 1 (online) | Round 2 (live, top 8) |
|---|---|---|
| Artifact | **2-minute video** | 3 min pitch + 2 min demo + 2 min Q&A |
| Audience | A judge alone with a browser tab | Jury + 60 people in a room |
| Style | Tight, edited, narrated, zero dead air | Human, confident, room-aware |
| Stakes | **Gets you into the top 8 at all** | Wins it |

---

# §A — The 2-minute submission video (record 15:15–15:50)

**This is the most important 35 minutes of your day.** Round 1 is judged from this. The rubric
literally says *"Engaging video?"* Treat it as a product.

## Rules

- **Screen recording + live voice narration.** Not silent. Not text-on-screen. A human voice.
- **Under 2:00.** Aim for 1:50. Judges watching 20 of these will click away at 2:01.
- **No intro card, no logo animation, no "hi we're team X."** First frame is the product.
- Record at **1280×720 or 1920×1080**, browser zoom 125%, ONE window, no notifications.
- **Do 3 takes.** Take 3 is always better than take 1. Keep the best; don't edit-splice under pressure.
- **Loom** = fastest (instant public link). **YouTube unlisted→public** = safest (no expiry, no
  view-gate). Do YouTube if you have 5 spare minutes; Loom if you don't.

## Script (≈290 words — read at a natural pace, don't rush)

> **[0:00–0:15 — the problem, as a person]**
> "If you're a creator or a founder-led brand, you post on four platforms every day. And on at least
> three of them, you don't sound like yourself — because you wrote it at 11pm, or because a tool wrote
> it for you and it sounds like every other tool.
>
> **[0:15–0:25 — the one sentence]**
> This is Doppel. You give it one link. It builds a content studio that sounds exactly like you."
>
> *(paste a URL, hit enter — the trace starts streaming)*
>
> **[0:25–0:50 — the Genome]**
> "It reads everything public about the brand — the site, the socials, the posts that actually
> performed — and reverse-engineers the brand's DNA. Voice. The phrases they actually use. The words
> they never use. Their palette, off their own site. Their content pillars. And the hook patterns from
> their best posts.
>
> Sixty seconds, from one link."
>
> *(Genome card fills the screen. Hold for 2 full seconds. Let the judge read it.)*
>
> **[0:50–1:30 — the Drop]**
> "Now one idea in."
>
> *(type the topic → assets appear)*
>
> "And out comes the whole week. A LinkedIn post in their sentence structure. A thread. A carousel —
> and those images are their palette, not stock. And this."
>
> *(play the vertical video. FULL VOLUME. Say nothing for the whole 20 seconds.)*
>
> "That voice is cloned from thirty seconds of me talking this morning. Swap in the client's founder
> and every video sounds like the founder — without the founder recording anything, ever again.
>
> **[1:30–1:50 — it actually ships]**
> "And it isn't a preview tool."
>
> *(click Approve → cut to the live Bluesky profile → refresh → the post is there)*
>
> "That's live. Posted eleven seconds ago, real account, real API. And this" *(4 seconds on the n8n
> canvas)* "runs at 6am daily — finds what's trending in their niche, writes five drafts in their
> voice, sends them for a thumbs-up on Telegram.
>
> **[1:50–2:00 — close]**
> "Doppel. One link, and you sound like yourself everywhere, forever. Link's in the submission — try
> it on your own brand."

## Editing checklist

```
[ ] First frame is the product, not a title card
[ ] Zero dead air — cut every pause longer than 1s
[ ] The video segment plays at full volume, uninterrupted
[ ] Nothing on screen requires squinting (zoom 125%+)
[ ] No visible notifications, no other tabs, no dock clutter
[ ] Ends before 2:00
[ ] Link opens in a logged-out incognito window
```

---

# §B — The live round (top 8): 3 + 2 + 2

## [3 min] The pitch — slides, no laptop demo

Follow the 5 slides in [`11-PITCH.md`](11-PITCH.md) exactly (the guidebook prescribes the structure).
Roughly 35 seconds per slide, with the sample-output slide getting the most.

**One narrator only.** The narrator never touches the keyboard. A second person drives.
This looks professional and prevents two people talking over a static screen.

## [2 min] The demo — and here is the move

You have already shown the polished version in the video. So spend the live 2 minutes doing the one
thing a recording cannot do:

> *"I'm not going to replay the video. Somebody give me a URL — any brand, your brand, a client."*

*(Driver pastes it. Trace streams. Genome card lands.)*

> "That's their voice, their phrases, their palette. From one link, just now, live."

*(Type the topic → the Drop generates → play the vertical video at full volume, say nothing.)*

> "That's their brand, in a voice we cloned this morning, sixty seconds after I got the URL. Approve —"
> *(click)* "— and it's live on a real account. Thanks."

**Why this wins the live round:** it is unfakeable. A judge who just watched 8 polished videos cannot
dismiss a thing that works on an input they chose. Nobody else in the room can do this, because
nobody else's product takes a *brand* as input.

**If nobody volunteers within 4 seconds — do not wait, do not beg:**
> "Fine, I'll use one of yours." *(paste the judge's own brand URL, researched at 09:00, already in
> your clipboard history)*

That lands harder than a volunteer. Have 3 judge URLs ready.

## [2 min] Q&A → ammo in [`11-PITCH.md`](11-PITCH.md) §Q&A

---

## Driver rules (live round)

- Every tab **pre-loaded and warm**. Zero cold loads on stage.
- The topic string is **in the clipboard**, never typed from scratch.
- If something errors: **do not debug on stage.** Say the line, move on:
  > "That's the live API being live — here's the one from twenty minutes ago." *(cached result)*
- Never show an IDE except a deliberate 3-second Cursor nod. Never show a terminal except the trace.
- Slow, deliberate mouse movement. Fast cursor movement reads as panic.

## Fallback ladder — rehearse levels 1 and 4, not just the happy path

| Level | Trigger | Action |
|---|---|---|
| 0 | All good | Full live script |
| 1 | Crawl fails on the volunteered URL | *"Their site's fighting us — here's one I ran on [known brand]."* → cached Genome. **Lose nothing.** |
| 2 | Video/VO fails or is slow | Play the pre-rendered asset from `public/demo/`. Nobody can tell. |
| 3 | Wifi dies | Phone hotspot, already on. Say nothing about it. |
| 4 | Everything down | Play the **submission video** and narrate live over it. Say once, calmly, early: *"Wifi's out so I'm narrating our recording — the live version's in the submission."* Then deliver the same content. This still scores. |

## Words to never say

- "Sorry, this normally works" → *"Here's the one from twenty minutes ago."*
- "We didn't have time to…" → nobody had time. Never apologise for scope.
- "It's just a hackathon project" → you are selling. It's a product.
- "As you can see…" → filler. Say the thing.
- Any acronym a creator wouldn't use. Say "voice clone," not "IVC/TTS pipeline."
