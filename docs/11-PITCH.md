# 11 — Pitch Deck & Q&A

**Max 5 slides.** The guidebook prescribes the structure below — follow it. Judges reading 20 decks
appreciate the expected shape, and deviating buys you nothing.

Build in **Google Slides**, share as *"anyone with the link — viewer"*, drop the URL in the submission.
Draft it at **13:00**, finish by **16:05**. Do not start this at 16:00.

**Design:** dark background, one accent colour from your own Genome output, one serif + one sans,
huge type (readable from the back of a room), **screenshots not bullet lists**. Nothing purple.

---

## Slide 1 — The Problem

> ### You post on four platforms a day.
> ### You sound like yourself on none of them.

**Who:** founder-led brands and solo creators, 10k–200k followers, no content team, brand voice lives
entirely in their own head.

**How they solve it today, and why it sucks:**
| Today | Why it fails |
|---|---|
| Write it themselves at 11pm | First thing to slip when they're busy. Inconsistent. |
| ChatGPT / Jasper | Generically competent, recognisably not them. Starts from zero every time. |
| Ghostwriter, €1.5–4k/mo | 2–4 weeks to learn the voice — and it walks out with them |

*Speaker note (~35s):* name a real creator if you know one. Specificity is explicitly rewarded — the
guidebook says be specific, *not* "businesses."

---

## Slide 2 — Your Solution

> ### Doppel
> ### One link in. A studio that sounds like you out.

**In one sentence:** *Doppel reads everything public about a brand, reverse-engineers its voice, look
and hooks, then writes, produces and publishes its content — daily, without them.*

**Why it's 10× better than the alternatives:**
1. **The brand is the input, not the prompt.** Onboarding is 60 seconds and a URL — not a 4-week
   ghostwriter ramp, not a prompt you rewrite every time.
2. **It clones the actual voice** — the writing style *and* the audio. Every video is narrated by them
   without them ever recording.
3. **It doesn't stop.** A nightly loop finds what's trending in their niche and refills the queue.
   They approve from Telegram in 10 seconds.

*Keep this slide short — just enough to understand what it does.*

---

## Slide 3 — Sample Output ← spend the most time here

> *"This is a social media hackathon. Show, don't tell."* — the guidebook

**No bullets on this slide.** Screenshots only, tightly cropped, big:
- The **Brand Genome card** for a recognisable brand (left)
- The **generated carousel** in that brand's palette (centre)
- A frame from the **vertical short** + a waveform, captioned *"narrated in a cloned voice"* (right)
- Small at the bottom: the **live Bluesky post** with its timestamp

Caption, one line: **"All of this from one URL. 60 seconds. Nothing hand-edited."**

Also commit these into `samples/` in the repo — the submission asks for *"samples of what you generated."*

---

## Slide 4 — Go-to-Market

**"Would you use this for yourself?"** → Yes, and say how you already did:
> *"We generated and posted our own launch content with it today — the post announcing this project
> was written and published by Doppel."*

If you actually do that (it takes 3 minutes), it's the strongest GTM proof available and it's free.

**"Would you sell it to other creators?"**

| Wedge | Then |
|---|---|
| **Solo creators** — €29/mo, self-serve. Acquisition: post Genome cards *of* creators as content. The product markets itself: the output is the ad. | **Agencies** — €99/client/mo. One operator runs 12 clients. Genome-per-client is the multi-tenant unlock. |

Why now, in one line: *voice cloning got good and cheap in the last 18 months. Brand-accurate video
narration at scale wasn't possible two years ago.*

---

## Slide 5 — Why You / Why Now

- **Why us:** [name] ships production systems at [place]; [name] is the ICP — a creator who lives this
  problem daily; [name] does design. We built it in four hours across five APIs.
- **Would we work on it full-time if it got traction?** Answer honestly. If yes, say it plainly — the
  guidebook asks, so they're scoring for conviction.
- **Ends on:** the live URL + a QR code, big.

---

# Q&A ammo (2 minutes, live round)

Practise these out loud at 17:15. Answer in **two sentences**, then stop.

| Question | Answer |
|---|---|
| **"How is this different from ChatGPT?"** | ChatGPT starts from a prompt; we start from a brand. The Genome is a persistent, structured identity that every asset is generated against — and ChatGPT can't clone their voice or publish. |
| **"What stops this being generic AI slop?"** | The petPhrases field. We extract phrases the brand *verbatim* uses and force them into every asset. That's why the output reads as them and not as a model. |
| **"Does it actually post to Instagram/TikTok?"** | Bluesky and Telegram are real live posts to real accounts — you saw the timestamp. LinkedIn, Instagram and TikTok go through the same queue but need the creator's own OAuth and, for TikTok, platform review. We're not going to claim we got a TikTok app approved in four hours. |
| **"What's your moat? Anyone can call these APIs."** | The extraction quality and the feedback loop. Every post's performance rewrites the Genome's hook list, so the model of the brand gets sharper the longer you use it — and that data isn't reproducible by a competitor on day one. |
| **"How much does one Drop cost you?"** | Cents — the LLM call is fractions of a cent, images are cheap, and the voice clone is one-time per creator. At €29/mo the unit economics work from the first customer. *(Have the real number if you measured it.)* |
| **"What if the brand hates the output?"** | Then the Genome is wrong, not the writer — and the Genome is editable. Fix one field, regenerate everything. That's the advantage of a structured identity over prompt-tweaking. |
| **"Legal / brand safety?"** | forbiddenWords is a hard filter, and nothing publishes without approval — the loop is approve-then-post by default. Voice cloning is only ever on a voice the account owner submits. |
| **"Isn't voice cloning a bit creepy?"** | It's their own voice, on their own content, with their approval — the same deal as a ghostwriter, except it sounds like them instead of like a stranger. |
| **"Why five different sponsor APIs?"** | Each one does a thing the others can't: Firecrawl reads the brand, Claude writes it, fal renders it in their palette, ElevenLabs speaks it in their voice, n8n ships it. It's a pipeline, not a checklist. |
| **"What did you build today vs before?"** | All of it — repo created at kickoff, [N] commits, first one at 09:4x. Everything before today was notes and API accounts. *(Have the git log ready to show.)* |
| **"What's next if you win?"** | Real OAuth for the big three platforms, the engagement→Genome learning loop wired end-to-end, and 10 creators using it. |

## The three sentences to have loaded at all times

1. **The one-liner:** *"One link in, a content studio that sounds like you out."*
2. **The all-five:** *"Firecrawl reads the brand, Claude writes it, fal renders it, ElevenLabs speaks it, n8n ships it."*
3. **The honesty line:** *"Bluesky and Telegram are real posts. The rest need the creator's OAuth, and we're not going to pretend otherwise."*

## Delivery rules

- **One narrator.** The narrator never touches the keyboard; a driver runs the screen.
- Land at **2:45 for a 3-minute** slot. Finishing early with a strong close beats being cut off.
- If a question stumps you: *"Honestly, don't know — here's how I'd find out."* Judges respect that
  far more than a bluff, and they can always tell.
- Never say *"it's just a hackathon project."* You're selling.
