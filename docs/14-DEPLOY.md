# 14 — Deploy: Coolify / Hetzner + Render fallback

One `Dockerfile`, two targets. Primary: **Coolify on Hetzner → `creator.legacy-ai.de`**.
Fallback: **Render** (hackathon credits), which gives an HTTPS URL in minutes with no DNS work.

## What the image must contain, and why

| Requirement | Why it's non-negotiable |
|---|---|
| **ffmpeg + ffprobe** | `lib/render.ts` spawns both. No ffmpeg → no cut, no render, no product. |
| **glibc base** (`node:22-bookworm-slim`) | `@napi-rs/canvas` is a native binding. Alpine/musl breaks it. |
| **`fonts-dejavu-core`** | Canvas draws the burned captions. A bare container has no fonts, so captions render as **empty boxes** — and it fails silently, which is worse. |
| **`node_modules` at runtime** | `@napi-rs/canvas` is in `serverExternalPackages`; the bundler can't inline it. |
| **Writable `public/uploads`, `public/renders`, `tmp/audio`** | `/api/process` writes there at request time. `chown node:node` because we run non-root. |

## Readiness probe

`GET /api/health` → `200` when ffmpeg **and** ffprobe are present, `503` otherwise.

This is deliberately a **readiness** probe, not liveness: a container without ffmpeg boots fine, serves
the landing page fine, and only fails when someone uploads a video — i.e. in front of the room. The
probe makes Coolify refuse to route traffic instead.

Missing API keys are reported in the body but do **not** fail the probe — that's a degraded mode we can
still demo from the cached path, not a broken container.

```bash
curl -s https://creator.legacy-ai.de/api/health | jq
```

## Coolify setup

1. **New Resource → Application → your Git repo**, branch `main`
2. **Build Pack: Dockerfile** (not Nixpacks — Nixpacks will not install ffmpeg)
3. **Port: `3000`**
4. **Domain:** `creator.legacy-ai.de` → let Coolify issue the Let's Encrypt cert
5. **Health check path:** `/api/health`
6. **DNS:** an `A` record for `creator` → the Hetzner box's IP, *before* you trigger the deploy, or
   the cert issuance fails and you wait out a retry.

### Env vars in Coolify

```bash
OPENAI_API_KEY=               # /api/brief + /api/brand die without it
OPENAI_MODEL=                 # optional, default gpt-5.6
FIRECRAWL_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

IG_USER_ID=
IG_ACCESS_TOKEN=

PUBLISH_ENABLED=false         # ← flip to true only at 15:00
PUBLISH_SECRET=               # long random string; same value goes in the UI field

BLOB_READ_WRITE_TOKEN=        # preferred: Instagram fetches the mp4 from Blob
PUBLIC_BASE_URL=https://creator.legacy-ai.de   # fallback if Blob is unset
```

⚠️ **`PUBLISH_ENABLED` — not `DOPPEL_PUBLISH_ENABLED`.** The old name is a leftover from the
pre-merge app and nothing reads it. Setting the wrong one at 15:00 means publishing silently stays
off while you debug under time pressure.

⚠️ **Instagram needs a public HTTPS URL for the video.** Meta *fetches* the file, you can't POST
bytes. `toPublicUrl()` prefers Vercel Blob and falls back to `PUBLIC_BASE_URL` — so set at least one.
`localhost` can never work.

## Render fallback (if DNS or the cert stalls)

Render reads the same Dockerfile and hands you `https://<name>.onrender.com` with a valid cert and no
DNS work:

1. **New → Web Service → your repo**
2. **Runtime: Docker** · **Health Check Path: `/api/health`**
3. Paste the same env vars, with `PUBLIC_BASE_URL=https://<name>.onrender.com`

Worth doing **in parallel** rather than as a rescue: it costs 5 minutes, and having a working URL in
hand removes deploy risk from the 15:00–16:30 submission window entirely. The custom domain is nicer
for the pitch; a working URL is what the submission actually needs.

**Note on cold starts:** Render's free tier sleeps after inactivity, and the first request after a
sleep takes ~30s. If you demo from Render, hit the URL a minute beforehand.

## Verify a build locally before pushing to either

```bash
docker build -t legacy-creator .
docker run --rm -p 3000:3000 --env-file .env.local legacy-creator

# ffmpeg present and app ready?
curl -s localhost:3000/api/health | jq '.status, .render'
```

If `.render.ffmpeg` is `false`, the `apt-get` layer failed — everything else is irrelevant until
that's green.

## Image size

~450 MB, most of it ffmpeg. Not optimised on purpose: `output: "standalone"` plus a native binding
plus ffmpeg is three interacting things to get wrong, and this deploys a handful of times today.

```
ponytail: full node_modules in the runtime stage instead of standalone tracing.
Bigger image, one less way to break the native canvas binding. Switch to
standalone only if pull time actually hurts.
```
