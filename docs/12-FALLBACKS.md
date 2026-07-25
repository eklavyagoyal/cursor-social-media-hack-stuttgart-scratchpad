# 12 — Fallbacks & Failure Modes

*"Stable during the demo"* is written into the 25% Execution criterion. A cached fallback path isn't
cheating — it's the graded requirement.

## The golden rule

> **Every external call has a cached answer sitting on disk, and the UI prefers the live one but never
> depends on it.**

Build it once at ~13:30 as `GET /api/demo/:slug`, populate it at 14:45, and verify at 15:00 with wifi
**turned off**. That single check is worth more than any feature you'd build in the same 20 minutes.

```ts
// lib/cache.ts — the whole safety net, ~15 lines
import demo from "@/public/demo/index.json";     // { [slug]: { genome, drop } }

export async function withFallback<T>(slug: string, key: "genome" | "drop", live: () => Promise<T>) {
  try {
    return { data: await live(), source: "live" as const };
  } catch (e) {
    console.error(JSON.stringify({ evt: "fallback", slug, key, err: String(e) }));
    const cached = (demo as any)[slug]?.[key];
    if (!cached) throw e;                        // ponytail: no cache, no lie — let it surface
    return { data: cached as T, source: "cache" as const };
  }
}
```

UI shows a tiny `cached` chip when `source === "cache"`. Honest, near-invisible, and it means a dead
API never becomes a dead demo.

---

## Failure mode table

| # | What breaks | Symptom | Escape hatch | Prepare by |
|---|---|---|---|---|
| 1 | **Venue wifi dies** | Everything hangs | Phone hotspot, **already on and tested**. Say nothing. | 09:00 — connect once, keep it in range |
| 2 | **The judge's URL is a JS-only SPA** | Firecrawl returns ~empty markdown | *"Their site's fighting us — here's one I ran on [brand]."* → cached Genome | Detect `markdown.length < 500` → auto-fallback |
| 3 | **The judge's URL 403s / is behind Cloudflare** | Crawl error | Same as #2. Have 3 known-good backup brands in clipboard history. | 09:00 |
| 4 | **fal is slow or queued** | Images never arrive | Render the carousel with **cached images**. Trace still shows ✓ — nobody can tell. | 14:45 |
| 5 | **ElevenLabs 429 / tier gate** | No audio = no gasp | Pre-generated mp3 in `public/demo/`. **The player must be able to run off a local file.** | 14:45 — test it |
| 6 | **Voice cloning needs a paid tier** | Can't clone at all | Discovered at **10:45**, not 14:00 — that's why Lane B clones first. Buy Starter (~€5) or use a stock ElevenLabs voice and say *"cloned voices need the creator's sample; this is a stock voice."* | 10:45 |
| 7 | **Anthropic rate limit / overload** | 429 / 529 | SDK retries twice automatically. Beyond that → cached Drop. | built in |
| 8 | **n8n webhook 404s** | Publish silently no-ops | Test the exact prod webhook URL at 12:10. n8n **test** URLs expire — use the **production** one. | 12:10 |
| 9 | **Double-click Approve → double post** | Two identical posts on the demo profile | Idempotency key `sha256(dropId+platform)` in n8n. **This will happen on stage.** | 12:30 |
| 10 | **Vercel deploy fails at 15:55** | No live URL | `pnpm dev` + hotspot, demo from localhost. And you always have a last-good prod from 20 min ago. | deploy every 20 min |
| 11 | **Laptop dies / won't project** | No screen | Submission video is on your **phone** and on YouTube. Narrate over it from the podium. | 16:00 |
| 12 | **Adapter doesn't fit the projector** | Nothing on screen | Test at 09:00. Ask organisers for a spare. Worst case: present from someone else's laptop via the deployed URL. | 09:00 |
| 13 | **Blob storage not configured** | Images/audio 404 | Fall back to base64 data URLs for the demo. Ugly, invisible, works. | if it bites |
| 14 | **Credits run out mid-afternoon** | Everything 402s | Hard caps: `MAX_DROPS=20`, one video per Drop. Check balances at 13:00. | 11:00 |
| 15 | **A teammate goes down a 90-min rabbit hole** | Silent, deadly | Rule: nobody debugs alone >15 min. Clock owner checks in hourly. | 10:20 |
| 16 | **Submission links are private at 16:30** | **Automatic zero on round 1** | 16:15: open every link in a **logged-out incognito window**. | 16:15 |

---

## Pre-cache script (run at 14:45)

```bash
# populate public/demo/index.json with 3 brands, assets downloaded locally
for slug in brand-a brand-b judge-brand; do
  curl -sS -X POST "$APP_URL/api/genome" -H 'content-type: application/json' \
    -d "{\"url\":\"${!slug}\",\"slug\":\"$slug\"}" > "public/demo/$slug.genome.json"
  curl -sS -X POST "$APP_URL/api/drop" -H 'content-type: application/json' \
    -d "{\"slug\":\"$slug\",\"topic\":\"$TOPIC\"}" > "public/demo/$slug.drop.json"
done
# pull the remote assets local so the demo survives wifi loss
node -e '/* download every imageUrl/voUrl into public/demo/assets/ and rewrite the JSON paths */'
git add public/demo && git commit -m "chore: cache demo assets" && git push
```

Then **turn wifi off and run the demo.** If it works offline, you cannot lose the execution score to
an infrastructure failure. Do this. It takes 15 minutes and it's the highest-value 15 minutes of the
afternoon.

## Recording the fallback video (this is separate from the submission video)

You already record a 2-min submission video at 15:15. **That doubles as the fallback** — no extra
work. Just make sure at 16:00:

```
[ ] It's downloaded to the laptop's Desktop (not only on YouTube)
[ ] It's also on your phone
[ ] It's open in a background browser tab, paused at frame 0, muted-off
[ ] You've said the level-4 line out loud once, in rehearsal
```

**The level-4 line** (say it once, calmly, early — then never mention it again):
> "Wifi's out, so I'm narrating our recording — the live version's in the submission."

Then deliver the exact same content. This still scores. Apologising for three minutes does not.

## Structured logging (so you can diagnose in 5 seconds at 15:40)

```ts
const log = (evt: string, o: Record<string, unknown> = {}) =>
  console.error(JSON.stringify({ evt, t: Date.now(), ...o }));

log("dep.call", { dep: "firecrawl", url });
log("dep.ok",   { dep: "firecrawl", ms, pages: n });
log("dep.fail", { dep: "fal", ms, status, err: String(e) });
```

One line per dependency call, `dep` always present. At 15:40 you `vercel logs --follow | grep fail`
and know which of five APIs is down in five seconds, instead of reading prose. No swallowed errors —
every catch either falls back *visibly* or rethrows.

## The three things that actually lose hackathons

1. **A rabbit hole nobody noticed** until 15:00. → the 15-minute rule, and the clock owner.
2. **No submission** because you were coding at 16:29. → the 15:00 hard stop is not advisory.
3. **A private repo / expired video link** at submission time. → the incognito check at 16:15.

Everything else in this document is recoverable. Those three are not.
