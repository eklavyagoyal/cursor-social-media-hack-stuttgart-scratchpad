# 05 — Preflight: exactly what we need

> ⚠️ **Rules check first.** Per the guidebook, project-specific code written before the event can get
> you **penalized or removed from awards**. So the pre-flight below is deliberately **zero code**:
> accounts, credentials, social handles, and one audio file. The app gets scaffolded at 09:30 as
> commit #1, at the venue. → [`00-WIN-CONDITIONS.md`](00-WIN-CONDITIONS.md) §pre-built rule

---

## Part 1 — Do tonight / before 08:15 (≈60 min)

### A. Discord recruiting (15 min) — highest ROI task on this page

Team registration closes at **11:00** and the guidebook says *"there won't be a lot of time at the
event itself."* Post in the hackathon Discord now and DM 5 people:

> Building **Doppel** — you paste one link, it reverse-engineers a brand's voice + look + hooks, then
> writes and produces their posts and auto-publishes them. Using Firecrawl + Claude + fal + ElevenLabs + n8n.
> Looking for **1 frontend/design person** and **1 creator/marketer** who knows the content pain. DM me.

Recruit in this priority order:
1. **Designer / frontend with taste** — Presentation is 15% and craft is the whole first impression.
2. **Creator / marketer** — they *are* the ICP, they narrate better than any engineer, and they know
   what "helps a content creator in a real way" actually means. Most undervalued teammate here.
3. **Second backend hand** for the audio/image pipeline.

Guidebook recommends **2–3 people**. Don't force a 4th.

### B. Accounts (20 min) — free tiers only, credits come from the portal

| Service | Sign up | Note |
|---|---|---|
| **Anthropic** | console.anthropic.com | Your own key. Not a sponsor — you pay. ~€3 covers the whole day. |
| **fal.ai** | fal.ai | ⭐ Credits from the portal at the event |
| **ElevenLabs** | elevenlabs.io | ⭐ Credits from the portal. **Voice cloning needs a paid tier** — the portal credits should cover it; if not, Starter is ~€5/mo. Verify early. |
| **n8n Cloud** | n8n.io | ⭐ Credits from the portal. Cloud, not self-host — you need a **public webhook URL**. |
| **Cursor** | cursor.com | ⭐ Credits from the portal. Build in it — it's a sponsor prize. |
| **Firecrawl** | firecrawl.dev | Free tier ~500 credits. **Not** on the portal's recommended-claim list, so have your own. |
| **Vercel** | vercel.com | Deploy target. CLI: `npm i -g vercel@latest` (yours is outdated). |
| **GitHub** | — | Repo must be **public** + open source |
| **Loom or YouTube** | — | Required for the 2-min submission video |

**⚠️ The portal perk flow:** Luma check-in at the front desk → sign up on the hackathon portal →
find team → **register team (one person, nominates a leader)** → **team lead claims perks.**
You can't claim credits until the team is locked. So lock the team early.

### C. Burner social accounts (20 min) — the "it actually posted" moment

Only these two matter. Everything else is API-gated (→ [`08`](08-PUBLISHING-REALITY.md)).

**Bluesky** (5 min, real public post, zero review):
1. Create an account at bsky.app — handle e.g. `doppeldemo.bsky.social`
2. Settings → Privacy & Security → **App Passwords** → add one → save it
3. Add an avatar + banner + bio so the profile doesn't look empty on the demo screen

**Telegram bot** (10 min):
1. Message `@BotFather` → `/newbot` → name it → **save the bot token**
2. Create a public channel, e.g. `@doppeldemo`
3. Add the bot to the channel as an **admin** (required to post)
4. Test:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=@doppeldemo&text=hello%20from%20doppel"
   ```

Optional 5 min: a **Discord webhook** (server → channel → Integrations → New Webhook). Simplest
"it posted" proof that exists — a single unauthenticated POST.

### D. Voice sample (3 min) — the gasp, prepared

Phone voice memo, quiet room. Read any paragraph **naturally** for 30–45 seconds. Not dramatic, not
monotone. Save as `voice-sample.m4a` and AirDrop it to your laptop.

Quality rules: no background music, no echo (avoid bathrooms/kitchens), phone ~20cm from your mouth,
one continuous take. A clean 30s sample clones better than a noisy 3 minutes.

### E. Judge / target research (10 min)

At the event you'll ask for a volunteer URL. Have **3 backups in your clipboard history**:
- 1 judge's own brand or agency (look them up once the judges are announced)
- 1 well-known German founder-led brand with a rich site + active socials
- 1 you have already tested end-to-end

### F. Pack

```
[ ] Laptop + charger
[ ] 🔌 HDMI / USB-C adapter  ← test it at the venue at 09:00, not at 17:20
[ ] Water bottle (fillable in the kitchen)
[ ] Headphones
[ ] Snack — breakfast + lunch are provided, dinner is NOT, winners at 19:00
[ ] Phone (hotspot + QR + voice memo)
```

---

## Part 2 — At the venue, 09:30–10:00 (commit #1 during the intro)

```bash
# 1. repo — public, open source (both required)
gh repo create doppel --public --clone && cd doppel
pnpm create next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --yes
printf 'MIT License\n\nCopyright (c) 2026 Doppel contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...\n' > LICENSE
git add -A && git commit -m "chore: scaffold next app + MIT license" && git push

# 2. deps
pnpm add @anthropic-ai/sdk @mendable/firecrawl-js @fal-ai/client @elevenlabs/elevenlabs-js @atproto/api @vercel/blob
pnpm add -D @types/node

# 3. dirs + env
mkdir -p app/api/{genome,drop,voice,publish} lib components public/demo samples
cp .env.example .env.local   # then paste keys
git add -A && git commit -m "chore: deps + skeleton dirs" && git push

# 4. live URL immediately — even if it's the default page
npx vercel@latest --prod
```

Then AirDrop `.env.local` to every teammate and confirm each of them can run `pnpm dev`.

`scaffold.sh` in the repo root does steps 2–3 in one shot. Read it before running it.

---

## Part 3 — Verify every key with one command (5 min, do it at 10:00)

Do not discover a bad key at 14:00. One curl each.

```bash
set -a; source .env.local; set +a

# Anthropic
curl -sS https://api.anthropic.com/v1/messages -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
  -d '{"model":"claude-opus-5","max_tokens":16,"messages":[{"role":"user","content":"say OK"}]}' \
  | head -c 200; echo

# Firecrawl
curl -sS -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" -H "content-type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"]}' | head -c 200; echo

# ElevenLabs (lists voices + confirms tier)
curl -sS https://api.elevenlabs.io/v1/voices -H "xi-api-key: $ELEVENLABS_API_KEY" | head -c 200; echo

# fal
curl -sS https://fal.run/fal-ai/flux/schnell -H "Authorization: Key $FAL_KEY" \
  -H "content-type: application/json" -d '{"prompt":"a green square"}' | head -c 300; echo

# Bluesky
curl -sS -X POST https://bsky.social/xrpc/com.atproto.server.createSession \
  -H "content-type: application/json" \
  -d "{\"identifier\":\"$BLUESKY_HANDLE\",\"password\":\"$BLUESKY_APP_PASSWORD\"}" | head -c 200; echo

# Telegram
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"; echo
```

**Any of these failing = fix it before writing a line of feature code.** Model slugs and SDK method
names drift; check the sponsor dashboard for the current ones → [`06`](06-SPONSOR-PLAYBOOK.md).

---

## Part 4 — `.env.local` shape

See `.env.example` in the repo root. Set `DOPPEL_PUBLISH_ENABLED=false` while building so you don't
spam the demo account, and flip it to `true` at 15:00.

## Part 5 — Submission accounts checklist (verify at 16:15, logged out)

```
[ ] GitHub repo PUBLIC + LICENSE present
[ ] 2-min video link opens in incognito
[ ] Pitch deck shared "anyone with the link"
[ ] Vercel URL loads for a stranger
[ ] samples/ committed — actual generated posts/images/audio
```

*"All of them have to be publicly accessible when submitting."* A private link is a zero.
