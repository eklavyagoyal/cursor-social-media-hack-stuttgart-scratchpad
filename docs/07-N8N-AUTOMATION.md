# 07 — The Social Media Automation Spine (n8n)

**This is the "complete social media automation setup."** n8n is not a demo prop — it's the runtime.
The app generates, n8n *operates*. That separation is the whole autonomy story:

> *"The app is where you look at the content. n8n is what happens when nobody's looking."*

Use **n8n Cloud**, not self-hosted — you need a public webhook URL, and you have 4 hours.

## The four workflows

| # | Workflow | Trigger | Priority |
|---|---|---|---|
| 1 | `wf-publish` | Webhook from the app | **P0** — this is "it actually posted" |
| 2 | `wf-trend-sweep` | Cron 06:00 | **P1** — biggest innovation-score item |
| 3 | `wf-approve` | Telegram callback | P1 — pairs with #2 |
| 4 | `wf-recap` | Cron 20:00 | P2 — the "it learns" story; can be narrated, not built |

Build #1 before lunch. Build #2 and #3 between 13:25 and 14:45 only if P0 is green.

---

## 1 · `wf-publish` — fan-out (P0)

```
[Webhook POST /doppel-publish]
        │
   [Verify secret]  ──✗──▶ [Respond 401]
        │
   [Kill switch: {{$env.PUBLISH_ENABLED}}] ──✗──▶ [Respond {skipped:true}]
        │
   [Idempotency: dropId+platform seen?] ──already──▶ [Respond cached URLs]
        │
   [Split Out: platforms[]]
        │
   ┌────┴──────────────┬──────────────┬──────────────┬─────────────────┐
   ▼                   ▼              ▼              ▼                 ▼
[Bluesky HTTP]   [Telegram HTTP]  [Mastodon HTTP]  [Discord WH]   [Queue-only:
 real, instant    real, instant     real, instant    real, instant   LI/IG/TT]
   └────┬──────────────┴──────────────┴──────────────┴─────────────────┘
        ▼
   [Aggregate] ──▶ [Respond to Webhook: [{platform, url}]]
        │
   [Error branch] ──▶ [Telegram alert to team channel] ──▶ [Respond 207 partial]
```

### Webhook contract (agree this at 10:20, both sides code against it)

```jsonc
// → POST {N8N_PUBLISH_WEBHOOK}   header: x-doppel-secret
{
  "dropId": "drop_01H...",
  "idempotencyKey": "sha256(dropId+platforms)",
  "platforms": ["bluesky", "telegram"],
  "drop": {
    "linkedin": "…",
    "thread": ["…", "…"],
    "carousel": { "slides": [{ "headline": "…", "imageUrl": "https://…" }] },
    "video": { "url": "https://…", "voUrl": "https://…" },
    "brandName": "Acme"
  }
}

// ← 200
{ "published": [{ "platform": "bluesky", "url": "https://bsky.app/profile/…/post/…" }],
  "queued":    [{ "platform": "instagram", "reason": "awaiting_creator_oauth" }] }
```

### Node settings that make it survive a live demo

Set these on **every** HTTP Request node. This is the difference between a 25%-execution score and a
crash on stage.

| Setting | Value | Why |
|---|---|---|
| Timeout | **20 000 ms** | A hung request on stage is worse than an error — an error can fall back |
| Retry On Fail | **on**, 2 tries, 2 000 ms wait | Bounded. Not a retry storm. |
| On Error | **Continue (using error output)** | One dead platform must not kill the other four |
| Always Output Data | on | Downstream aggregation doesn't break on an empty branch |

Plus:
- **Kill switch** — an `If` node on `{{$env.PUBLISH_ENABLED}}`. Set `false` while building so you
  don't spam the demo account; flip `true` at 15:00.
- **Idempotency** — a `Set` node writing `dropId+platform` into n8n static data / a Data Table, and an
  `If` that short-circuits a repeat. **You will double-click Approve on stage.** Guard it.
- **Error branch → Telegram alert to your own team channel.** No silent failures: if Bluesky 400s at
  15:40 you want to know in 3 seconds, not from a judge.

### The HTTP calls

**Bluesky** — two calls, no review, works today:
```jsonc
// 1) session
POST https://bsky.social/xrpc/com.atproto.server.createSession
{ "identifier": "doppeldemo.bsky.social", "password": "<APP_PASSWORD>" }
// → { accessJwt, did }

// 2) post   header: Authorization: Bearer {{accessJwt}}
POST https://bsky.social/xrpc/com.atproto.repo.createRecord
{ "repo": "{{did}}", "collection": "app.bsky.feed.post",
  "record": { "$type": "app.bsky.feed.post", "text": "…", "createdAt": "{{$now.toISO()}}" } }
```
For images: `com.atproto.repo.uploadBlob` first (raw bytes + correct `Content-Type`), then reference
the returned blob in `record.embed`. Text-only is fine for P0 — get *a* real post up first.
⚠️ Bluesky posts cap at **300 characters**. Truncate or thread.

**Telegram** — one call, trivially reliable:
```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
{ "chat_id": "@doppeldemo", "text": "…", "parse_mode": "HTML" }
```
`sendPhoto` / `sendVideo` take a URL directly in `photo` / `video` — no upload step. This makes
Telegram the **easiest place to show generated media actually shipping**.

**Mastodon** (optional, ~10 min): `POST https://mastodon.social/api/v1/statuses` with
`Authorization: Bearer <token>`, body `{"status": "…"}`. Token from Preferences → Development → New app.

**Discord** (optional, 2 min): `POST <webhook-url>` with `{"content": "…"}`. Zero auth setup.

**Queued platforms** — do **not** fake these. Return them honestly:
```json
{ "platform": "instagram", "status": "queued", "reason": "awaiting_creator_oauth" }
```
and render an honest badge in the UI. → [`08-PUBLISHING-REALITY.md`](08-PUBLISHING-REALITY.md)

---

## 2 · `wf-trend-sweep` — the nightly loop (P1, highest innovation value)

This is what makes Doppel *autonomous* rather than *a generator*. It's also the thing a judge will
remember, because a scheduled workflow diagram reads as a real system.

```
[Schedule Trigger  cron 0 6 * * *]
        │
[HTTP: Firecrawl search]  ← query built from the Genome's pillars
        │   POST https://api.firecrawl.dev/v1/search
        │   { "query": "{{pillar}} trends this week", "limit": 5 }
        │
[Code: dedupe vs already-seen URLs]
        │
[HTTP: Claude]  "rank these 5 against this Brand Genome, pick the 3 that fit,
        │        write a hook for each in their voice"   → JSON
        │
[HTTP: POST {APP_URL}/api/drop]  × 3   ← reuses the exact same generation path
        │
[Telegram sendMessage + inline_keyboard]
        │   reply_markup: { inline_keyboard: [[
        │     {text:"✅ Post",     callback_data:"post:{{dropId}}"},
        │     {text:"✏️ Rewrite",  callback_data:"redo:{{dropId}}"},
        │     {text:"❌ Skip",     callback_data:"skip:{{dropId}}"}]] }
        ▼
   creator taps a button on their phone → wf-approve
```

**Demo it without waiting until 06:00:** keep a **Manual Trigger** wired in parallel to the Schedule
Trigger. On stage you click "Execute Workflow" and it runs the same path. Say:
*"This is what fires at six every morning — here it is now."*

## 3 · `wf-approve` — Telegram callback (P1)

```
[Webhook  POST /doppel-approve]   ← set as the bot's webhook via setWebhook
        │
[Switch on callback_data prefix]
  post:  → call wf-publish (Execute Workflow node)  → answerCallbackQuery "Posted ✅"
  redo:  → POST /api/drop with regenerate=true      → send new draft
  skip:  → mark skipped                              → answerCallbackQuery "Skipped"
```

Register once:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<N8N_APPROVE_WEBHOOK>"
```
⚠️ Telegram requires `answerCallbackQuery` within a few seconds or the button spins forever.
Answer first, do the work after.

## 4 · `wf-recap` — the learning loop (P2 — narrate, don't necessarily build)

```
[Cron 0 20 * * *] → [Fetch engagement where the API allows]
                  → [Claude: "which hooks worked? update the Genome's hook list"]
                  → [PATCH /api/genome]  → [Telegram digest]
```

If you don't have time, **still put it on the architecture slide** and say:
*"Tomorrow's drafts are written by today's results — the Genome is a living document."*
That's an honest roadmap statement, and "it gets smarter" is a strong closing beat.

---

## Build order (realistic)

| When | Do |
|---|---|
| 11:30 | `wf-publish` with **only** the Telegram node. Verify end-to-end from the app. |
| 12:00 | Add Bluesky (session → createRecord). This is the P0 "it really posted". |
| 12:20 | Add secret check, kill switch, timeouts, retry, error→Telegram alert |
| 13:40 | `wf-trend-sweep` with a Manual Trigger. Skip Firecrawl search at first — hardcode 3 topics. |
| 14:10 | Swap the hardcoded topics for the real Firecrawl search call |
| 14:30 | `wf-approve` buttons |
| 14:45 | **Freeze.** Screenshot every canvas for the deck. Export JSON into `n8n/` in the repo. |

**Commit the workflow JSON to the repo** (`n8n/wf-publish.json` etc.). It's evidence of work built at
the event, it's part of "open source," and it's genuinely reusable. Costs 60 seconds.

## What we deliberately don't do in n8n

| Not doing | Why |
|---|---|
| Generation inside n8n | Generation belongs in the app where it streams to the UI. n8n orchestrates. |
| Storing Genomes in n8n | The app owns state. n8n is stateless except idempotency keys. |
| OAuth flows for IG/TikTok | Not achievable today → [`08`](08-PUBLISHING-REALITY.md) |
| Per-platform retry policies | One policy: 2 tries, 2s, continue-on-error. Uniform and enough. |
| Rate-limit backpressure | At demo volume it's theatre. Mention it as roadmap if asked. |
