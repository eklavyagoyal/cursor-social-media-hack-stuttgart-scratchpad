# Deck — 5 slides

One `##` per slide. Speaker notes are the blockquotes underneath; they are not on the slide.

**Build note.** Dark background, one accent, one serif + one sans, huge type, screenshots over
bullets. Slide 3 is the one that wins or loses this — give it the most space and the least text.

Every factual claim below is traceable to a file in this repo or to the live copy on
legacy-ai.de. Nothing is estimated, and there is no traction to report yet. Where something is a
hypothesis it is labelled as one — a judge who catches one invented number stops believing the
rest of the deck.

---

## 1 · You already know you should be posting video

> ### Filming is 30 seconds.
> ### Editing is the reason it never happens.

**Who:** founder-led brands and solo creators with no content team, where the brand voice lives
in one person's head. Our first user is the team at **legacy-ai.de** — they have deep expertise
to talk about and no pipeline for turning it into posts.

| How they do it today | Why it fails |
|---|---|
| Film it, then edit it themselves | The edit is the bottleneck, not the filming. Cutting dead air and timing captions is the part that gets postponed |
| Send it to an editor | Days of turnaround, a cost per clip, and the voice gets re-explained every time |
| Generic AI caption tools | They caption whatever you handed them. They don't cut the "ähm", and they don't help you decide what to say |

> ~35 seconds. Land the asymmetry: the filming is trivial, the editing is not, so the content
> doesn't happen. Say "legacy-ai.de" out loud — the guidebook rewards naming a specific creator
> instead of "businesses".

---

## 2 · legacy-creator

> ### You film 30 seconds on your phone.
> ### It comes back as a posted Reel.

It reads your website to learn how you actually write, hands you a shot list with what to say
and how to hold the camera, and then — once you've filmed it in one take — cuts the silence and
the hesitations, burns the captions, renders a vertical mp4 and posts it.

**Three things that are different:**

1. **It tells you what to say before you film.** Most tools start after the footage exists. The
   shoot brief is the part that makes an unfilmed video get filmed.
2. **The cut comes from word-level timings, not a waveform.** Every removed span has a reason
   attached — head, filler, silence, tail — and captions are re-timed onto the *output* timeline
   after the cuts land, which is the part that is easy to get wrong.
3. **The script is grounded in the brand's own sentences.** Not a prompt describing a tone: eight
   phrases lifted verbatim off their site, passed into the writer as hard constraints.

> Keep this to 30 seconds. Do not explain the architecture here — slide 3 does the convincing.

---

## 3 · Sample output

> *"This is a social media hackathon. Show, don't tell."*

**No bullets on this slide.** Four things, tightly cropped, large:

- **Brand genome** read off legacy-ai.de — the eight verbatim phrases and the palette taken from
  their own markup → [`samples/brand-genome.md`](../samples/brand-genome.md)
- **Shoot brief** — the shot list, per shot: what to say, how to hold the camera, how long
  → [`samples/shoot-brief.md`](../samples/shoot-brief.md)
- **The cut, as a table with reasons** → [`samples/cut-report.md`](../samples/cut-report.md)
- **The rendered Reel**, captions burned in → [`samples/reel.mp4`](../samples/reel.mp4)

The cut report on screen, real numbers from the committed run:

```
12.00s  →  5.72s        6.28s removed across 4 cuts
   0.00–0.73  head
   2.37–5.83  filler   "ähm"
   8.77–9.83  silence
  10.97–12.00 tail
6 caption groups, re-timed onto the output timeline
export 1080×1920 · 322 KB
```

One line at the bottom: **"The cut list is machine output. Nothing here was hand-edited."**

> Spend the most time here — this slide is the argument. Then give them the thing almost no
> other team can offer: *"You can check this yourself in two seconds without an API key —
> `npm run verify:render` prints that table on your machine and fails if the render drifts more
> than 0.6s from the plan."* If the room is live, run it.
>
> Be straight about the clip: the cached demo renders a synthetic test pattern, because it has
> to work with the wifi off. The cutting, the caption timing and the encode are real work on a
> real file; the thing in frame is colour bars.

---

## 4 · Go to market

**Wedge — founder-led brands who are already sitting on expertise they never film.** They have
the material and the motivation; what they lack is the twenty minutes of editing per clip. That
is exactly the twenty minutes this removes.

**Then — the people who run several of those accounts.** One operator, several creators: the
brand genome is per-account, so the same operator can carry more accounts without the voice
collapsing into one house style.

**Pricing is a hypothesis, not a finding.** We have no users and no revenue to report. The
number we would test first is a low monthly per-account price, because the marginal cost of a
clip is one LLM call, one transcription and a few seconds of local ffmpeg.

**Why now, in one line:** word-level transcription got accurate and cheap in the last two years.
A frame-accurate automatic cut is only possible because every word has a start and end time — a
waveform alone can't tell an "ähm" from a word.

> If asked "would you use it yourself": answer honestly about what you have and haven't posted
> with it. Do not claim a launch post you didn't ship.

---

## 5 · Why us, why this, and what isn't done

**Built today.** The repo's first code commit is at **10:29** this morning; everything in this
deck is in the log, in small commits, by two people. Before today there were notes and API
accounts, nothing else.

**What works right now:** the cut, the caption timing and the 1080×1920 render are real and
independently verifiable with no API keys. Transcription is live with a key. Publishing to
Instagram is implemented against the Graph API and gated behind two switches, because the app is
deployed publicly and the caption comes from the client.

**What isn't done, and we'll say so before you ask:** Instagram needs a Business account token,
so the posting path is real code that we gate rather than a button we can promise on stage. The
brand read and the brief need API keys; without them the app falls back to a cached profile and
says so on screen instead of pretending.

**Ends on:** the live URL and a QR code, big.

> The honesty here is a scoring move, not modesty — the rubric rewards a working demo and
> judges can tell when a limitation is being talked around. Close on the URL and stop talking.
