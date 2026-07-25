#!/usr/bin/env bash
# scaffold.sh — run this AT THE VENUE, ~09:35, as commit #2.
#
# ⚠️  The guidebook penalizes project-specific pre-built code. This script installs generic
#     dependencies and creates empty directories only — no features, no prompts, no logic.
#     Run it at the event so the git log shows the work happening at the event.
#
# Usage:  bash scaffold.sh        (from inside the freshly created Next.js repo)
set -euo pipefail

say() { printf '\n\033[1;32m▸ %s\033[0m\n' "$*"; }

# ── 0. sanity ────────────────────────────────────────────────────────────────
[ -f package.json ] || { echo "No package.json here. Run pnpm create next-app first:"; \
  echo '  gh repo create doppel --public --clone && cd doppel'; \
  echo '  pnpm create next-app@latest . --ts --tailwind --app --eslint --no-src-dir --yes'; exit 1; }

# ── 1. deps ──────────────────────────────────────────────────────────────────
say "installing sponsor SDKs"
pnpm add \
  @anthropic-ai/sdk \
  @mendable/firecrawl-js \
  @fal-ai/client \
  @elevenlabs/elevenlabs-js \
  @atproto/api \
  @vercel/blob

# ── 2. dirs ──────────────────────────────────────────────────────────────────
say "creating directories"
mkdir -p \
  app/api/genome app/api/drop app/api/voice app/api/publish app/api/demo \
  components lib \
  public/demo/assets \
  samples \
  n8n

# ── 3. env template ──────────────────────────────────────────────────────────
say "writing .env.example"
cat > .env.example <<'ENV'
# ── LLM ──────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=

# ── Sponsors ─────────────────────────────────────────────────────────────────
FIRECRAWL_API_KEY=
FAL_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=            # set once after cloning your voice (~10:45)

# ── Publishing: the two that actually work today ─────────────────────────────
BLUESKY_HANDLE=                 # e.g. doppeldemo.bsky.social
BLUESKY_APP_PASSWORD=           # App Password, NOT your account password
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL=               # e.g. @doppeldemo
DISCORD_WEBHOOK=                # optional, 2 min to set up
MASTODON_BASE_URL=              # optional, e.g. https://mastodon.social
MASTODON_TOKEN=

# ── n8n ──────────────────────────────────────────────────────────────────────
N8N_PUBLISH_WEBHOOK=            # use the PRODUCTION url, not the test url
N8N_APPROVE_WEBHOOK=
N8N_SECRET=                     # shared secret checked by the n8n webhook node

# ── Storage ──────────────────────────────────────────────────────────────────
BLOB_READ_WRITE_TOKEN=          # `vercel env pull` after linking Blob

# ── Safety rails ─────────────────────────────────────────────────────────────
DOPPEL_PUBLISH_ENABLED=false    # keep false while building; flip true at 15:00
MAX_DROPS=20                    # cost guard — blowing credits at 14:00 ends the day
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV

[ -f .env.local ] || { cp .env.example .env.local; say "created .env.local — PASTE YOUR KEYS NOW"; }

# ── 4. gitignore + license ───────────────────────────────────────────────────
grep -q '^\.env\.local$' .gitignore 2>/dev/null || printf '\n.env.local\n.vercel\n' >> .gitignore

if [ ! -f LICENSE ]; then
  say "adding MIT LICENSE (open source is required by the rules)"
  cat > LICENSE <<'LIC'
MIT License

Copyright (c) 2026 Doppel contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
LIC
fi

# ── 5. key verification helper ───────────────────────────────────────────────
say "writing verify-keys.sh"
cat > verify-keys.sh <<'VER'
#!/usr/bin/env bash
# Verify every credential with one call each. Run at 10:00. Do not skip.
set -a; source .env.local; set +a
ok() { printf '\033[1;32m  ✓ %s\033[0m\n' "$1"; }
no() { printf '\033[1;31m  ✗ %s\033[0m\n' "$1"; }
chk() { if echo "$2" | grep -qi "$3"; then no "$1 → $2"; else ok "$1"; fi; }

echo "anthropic:";  chk anthropic "$(curl -sS https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" -H 'anthropic-version: 2023-06-01' \
  -H 'content-type: application/json' \
  -d '{"model":"claude-opus-5","max_tokens":16,"messages":[{"role":"user","content":"say OK"}]}' \
  | head -c 300)" 'error'

echo "firecrawl:";  chk firecrawl "$(curl -sS -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" -H 'content-type: application/json' \
  -d '{"url":"https://example.com","formats":["markdown"]}' | head -c 300)" 'error\|unauthor'

echo "elevenlabs:"; chk elevenlabs "$(curl -sS https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY" | head -c 300)" 'detail\|error'

echo "fal:";        chk fal "$(curl -sS https://fal.run/fal-ai/flux/schnell \
  -H "Authorization: Key $FAL_KEY" -H 'content-type: application/json' \
  -d '{"prompt":"a green square"}' | head -c 300)" 'error\|detail'

echo "bluesky:";    chk bluesky "$(curl -sS -X POST \
  https://bsky.social/xrpc/com.atproto.server.createSession -H 'content-type: application/json' \
  -d "{\"identifier\":\"$BLUESKY_HANDLE\",\"password\":\"$BLUESKY_APP_PASSWORD\"}" \
  | head -c 300)" 'error'

echo "telegram:";   chk telegram "$(curl -sS \
  "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | head -c 300)" '"ok":false'
VER
chmod +x verify-keys.sh

say "done. next:"
cat <<'NEXT'
  1. paste keys into .env.local
  2. ./verify-keys.sh          ← every line must be green before feature code
  3. pnpm dev
  4. npx vercel@latest --prod  ← get the live URL now, even if it's the default page
  5. git add -A && git commit -m "chore: deps, dirs, env template" && git push
NEXT
