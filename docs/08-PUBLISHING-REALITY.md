# 08 — Publishing Reality: can we *actually* post today?

The honest answer per platform. **This doc exists to stop you burning three hours on an OAuth flow
that cannot be approved today** — which is the #1 way social-media hackathon teams lose their day.

> ⚠️ Platform API policies change constantly and vary by region and account type. Treat the table as
> a decision guide, verify anything you depend on, and **never claim on stage that you post somewhere
> you only draft.** Creators and agency owners in that room know exactly where the gates are, and
> getting caught overclaiming zeroes your credibility.

## The truth table

| Platform | Real post today? | Auth | Gate | Time to first post | Verdict |
|---|---|---|---|---|---|
| **Bluesky** | ✅ **Yes** | Handle + app password | none | **10 min** | **P0. Do this.** |
| **Telegram** | ✅ **Yes** | Bot token | none | **10 min** | **P0. Easiest media posting anywhere.** |
| **Discord** | ✅ Yes | Webhook URL | none | 2 min | Optional freebie |
| **Mastodon** | ✅ Yes | Bearer token | none | 10 min | Optional, cheap credibility |
| **YouTube (Shorts)** | 🟡 Likely | Google OAuth | Cloud project; unverified apps show a warning screen and are limited to test users | 45–60 min | Only if you have spare time |
| **X / Twitter** | 🟡 Maybe | OAuth 2.0 / dev portal | Free tier write limits are tight and change often | 30–45 min | Bonus only. Bluesky covers the "short text post" story. |
| **LinkedIn** | 🟡 Unlikely today | OAuth 2.0 | Posting scopes need app review | hours–days | **Queue it.** Generate perfect LinkedIn copy, don't post. |
| **Instagram** | 🟡 Conditional | FB Graph + IG Business/Creator linked to a Page | Needs a Business/Creator IG + linked FB Page; dev-mode works for app-owner accounts | 45–90 min **if** someone already has both | Only if a teammate already has the setup |
| **TikTok** | 🔴 No (public) | OAuth | Content Posting API needs review + domain verification; unaudited apps can only post **private/self-only** | hours–days | **Queue it.** A private draft is a legitimate demo *if you say so.* |

## The strategy

### 1. Get one genuinely real post, fast
**Bluesky + Telegram, both before 12:30.** They give you the entire credibility payload —
*"posted 11 seconds ago, real account, real API"* — for 20 minutes of work and zero review process.

Bluesky is the right hero because it's a real public social profile a judge can open on their phone
mid-demo. Telegram is the right *second* because `sendPhoto`/`sendVideo` accept a URL directly, so
it's the cheapest way to show **generated media** actually shipping.

### 2. Be loudly honest about the rest

Render queued platforms with an explicit, unashamed state:

```
✅ Bluesky      posted · 11s ago        [view]
✅ Telegram     posted · 11s ago        [view]
⏳ LinkedIn     queued · needs creator OAuth
⏳ Instagram    queued · needs Business account link
⏳ TikTok       queued · needs Content Posting review
```

And say this out loud, once, in the demo:

> "Bluesky and Telegram are live posts to real accounts. LinkedIn, Instagram and TikTok go through
> exactly the same queue — they just need the creator's own OAuth, which is a one-time connect in
> production. We're not going to pretend we approved a TikTok app in four hours."

**This scores points.** Every agency owner and creator in the room has been burned by these APIs.
Naming the constraint accurately marks you as someone who has actually shipped, and it makes
everything else you claim more believable. It is *strictly better* than a vague implication.

### 3. Consider a unified provider (only if you have spare time)

Third-party APIs that wrap many platforms behind one endpoint:

| Option | Note |
|---|---|
| **Postiz** | Open source, and **listed in the guidebook's own inspiration list** — safe to reference |
| **Ayrshare** | Commercial unified posting API, free trial; fastest path to breadth |
| **Blotato / Late** | Similar commercial wrappers |

**Recommendation: don't.** Adding a fourth-party dependency at 14:00 to reach platforms you already
handle honestly is negative expected value. Mention Postiz in Q&A as the production path if asked
*"how do you scale to all platforms?"* — that's the right answer, and it costs zero build time.

## Snippets for the three that work

### Bluesky (~15 lines with the SDK)
```ts
import { AtpAgent } from "@atproto/api";

const agent = new AtpAgent({ service: "https://bsky.social" });
await agent.login({
  identifier: process.env.BLUESKY_HANDLE!,
  password: process.env.BLUESKY_APP_PASSWORD!,   // app password, NOT your real one
});

// text (⚠️ 300 char cap)
const { uri } = await agent.post({ text: text.slice(0, 300), createdAt: new Date().toISOString() });

// with an image
const bytes = new Uint8Array(await (await fetch(imageUrl)).arrayBuffer());
const { data } = await agent.uploadBlob(bytes, { encoding: "image/jpeg" });
await agent.post({
  text: caption.slice(0, 300),
  embed: { $type: "app.bsky.embed.images", images: [{ image: data.blob, alt: altText }] },
  createdAt: new Date().toISOString(),
});

// public URL for the demo:
// https://bsky.app/profile/<handle>/post/<last path segment of uri>
```
Threads: post the first, then each reply with `reply: { root, parent }` referencing `{uri, cid}`.

### Telegram (one fetch, no SDK)
```ts
const T = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const chat_id = process.env.TELEGRAM_CHANNEL;        // "@doppeldemo"

await fetch(`${T}/sendMessage`, { method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id, text, parse_mode: "HTML" }) });

// media by URL — no upload step. This is why Telegram is the cheapest media proof.
await fetch(`${T}/sendVideo`, { method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id, video: videoUrl, caption }) });
```
The bot must be an **admin** of the channel or posting silently fails.

### Discord (one fetch, zero auth setup)
```ts
await fetch(process.env.DISCORD_WEBHOOK!, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ content: text, embeds: [{ image: { url: imageUrl } }] }),
});
```

## Demo-account hygiene

- **Never** put a personal account's real password in `.env` — Bluesky app passwords exist for this.
- Give the burner a real avatar, banner and bio. An empty profile on the big screen looks fake and
  quietly undermines the "it really posted" moment.
- Keep `DOPPEL_PUBLISH_ENABLED=false` while building. Flip it at 15:00. Otherwise your demo profile
  is 40 test posts deep by the time a judge opens it.
- **Post 2–3 good posts to the burner during the day** so the profile looks alive at 17:30.
