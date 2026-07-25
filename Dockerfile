# legacy-creator — Coolify / Hetzner, creator.legacy-ai.de
#
# Two things dictate this image and neither is optional:
#   1. lib/render.ts spawns `ffmpeg` and `ffprobe`. No ffmpeg, no product.
#   2. @napi-rs/canvas is a native binding, so glibc — bookworm-slim, never alpine.
#      It is also in serverExternalPackages, so it must exist in node_modules at
#      runtime; the bundler cannot inline it.
#
# Same base and non-root convention as legacy-web, so the fleet stays consistent.

# ── build ───────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# No build-time secrets: every key is read at request time, nothing is baked
# into the bundle. Coolify injects them as runtime env.
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# ffmpeg + ffprobe are the render pipeline. fonts-dejavu because @napi-rs/canvas
# draws the burned captions and a container has no fonts otherwise — captions
# would silently render as empty boxes.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/* \
 && ffmpeg -version | head -1 \
 && ffprobe -version | head -1

# Production deps only, installed in this image so the native canvas binary
# matches this libc rather than the build stage's.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

# Written at request time: uploads + renders live under public/ so Next serves
# them, audio scratch under tmp/. Must be writable by the non-root user.
RUN mkdir -p public/uploads public/renders tmp/audio \
 && chown -R node:node public tmp

USER node
EXPOSE 3000

# Fails if ffmpeg is missing or the app can't answer — Coolify then refuses to
# route traffic to a container that would break the demo silently.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
