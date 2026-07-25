import { AtpAgent } from "@atproto/api";
import type { Drop } from "./types";

export type PostResult = { platform: string; url: string; at: string };
export type QueuedResult = { platform: string; reason: string };

/* ── idempotency ─────────────────────────────────────────────────────────────
   You WILL double-click Approve on stage. In-memory is enough for one day.
   ponytail: a Set, not Redis. Survives exactly as long as it needs to.
   ─────────────────────────────────────────────────────────────────────────── */
const shipped = new Map<string, PostResult>();
const key = (dropId: string, platform: string) => `${dropId}:${platform}`;

/* ── Bluesky ─────────────────────────────────────────────────────────────── */

const BSKY_MAX = 300;

export async function postBluesky(drop: Drop): Promise<PostResult> {
  const handle = process.env.BLUESKY_HANDLE!;
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({ identifier: handle, password: process.env.BLUESKY_APP_PASSWORD! });

  const text = (drop.thread[0] ?? drop.linkedin).slice(0, BSKY_MAX);

  // Attach the first carousel image if we have one.
  // ponytail: `any` — the atproto embed union is 6 deep and this is one call site.
  let embed: any;
  const img = drop.carousel.slides.find((s) => s.imageUrl)?.imageUrl;
  if (img) {
    const bytes = new Uint8Array(await (await fetch(img)).arrayBuffer());
    const { data } = await agent.uploadBlob(bytes, { encoding: "image/jpeg" });
    embed = {
      $type: "app.bsky.embed.images",
      images: [{ image: data.blob, alt: drop.carousel.slides[0]?.headline ?? "" }],
    };
  }

  const root = await agent.post({ text, embed, createdAt: new Date().toISOString() });

  // Thread the rest as replies.
  let parent = root;
  for (const t of drop.thread.slice(1)) {
    parent = await agent.post({
      text: t.slice(0, BSKY_MAX),
      reply: { root: { uri: root.uri, cid: root.cid }, parent: { uri: parent.uri, cid: parent.cid } },
      createdAt: new Date().toISOString(),
    });
  }

  const rkey = root.uri.split("/").pop();
  return {
    platform: "bluesky",
    url: `https://bsky.app/profile/${handle}/post/${rkey}`,
    at: new Date().toISOString(),
  };
}

/* ── Telegram ────────────────────────────────────────────────────────────────
   Media by URL, no upload step — the cheapest way to prove generated media ships.
   ─────────────────────────────────────────────────────────────────────────── */

export async function postTelegram(drop: Drop): Promise<PostResult> {
  const base = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  const chat_id = process.env.TELEGRAM_CHANNEL!;
  const caption = drop.linkedin.slice(0, 1000);
  const imgs = drop.carousel.slides.map((s) => s.imageUrl).filter(Boolean) as string[];

  const call = async (method: string, body: unknown) => {
    const r = await fetch(`${base}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`telegram ${method}: ${j.description ?? r.status}`);
    return j.result;
  };

  const res =
    imgs.length > 1
      ? await call("sendMediaGroup", {
          chat_id,
          media: imgs.slice(0, 10).map((url, i) => ({
            type: "photo",
            media: url,
            ...(i === 0 ? { caption, parse_mode: "HTML" } : {}),
          })),
        })
      : imgs.length === 1
        ? await call("sendPhoto", { chat_id, photo: imgs[0], caption, parse_mode: "HTML" })
        : await call("sendMessage", { chat_id, text: caption, parse_mode: "HTML" });

  const msg = Array.isArray(res) ? res[0] : res;
  const channel = chat_id.replace(/^@/, "");
  return {
    platform: "telegram",
    url: `https://t.me/${channel}/${msg?.message_id ?? ""}`,
    at: new Date().toISOString(),
  };
}

/* ── Instagram ───────────────────────────────────────────────────────────────
   Carousel only. A Reel would need a real mp4, which is the encode trap.
   Requires an IG Business/Creator account linked to a Facebook Page.
   ─────────────────────────────────────────────────────────────────────────── */

// Bump via env if Meta rejects the version.
const GRAPH = `https://graph.facebook.com/${process.env.IG_GRAPH_VERSION ?? "v23.0"}`;

export function instagramConfigured() {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

export async function postInstagram(drop: Drop): Promise<PostResult> {
  const igUser = process.env.IG_USER_ID!;
  const token = process.env.IG_ACCESS_TOKEN!;
  const imgs = drop.carousel.slides.map((s) => s.imageUrl).filter(Boolean) as string[];
  if (imgs.length < 2) throw new Error("instagram: carousel needs at least 2 images");

  const graph = async (path: string, params: Record<string, string>) => {
    const r = await fetch(`${GRAPH}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...params, access_token: token }),
      signal: AbortSignal.timeout(25_000),
    });
    const j = await r.json();
    if (j.error) throw new Error(`instagram: ${j.error.message}`);
    return j;
  };

  // 1. one container per slide
  const children: string[] = [];
  for (const url of imgs.slice(0, 10)) {
    const { id } = await graph(`${igUser}/media`, { image_url: url, is_carousel_item: "true" });
    children.push(id);
  }

  // 2. the carousel container
  const caption = [drop.linkedin, "", ...drop.thread.slice(0, 1)].join("\n").slice(0, 2200);
  const { id: creationId } = await graph(`${igUser}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  });

  // 3. publish
  const { id: mediaId } = await graph(`${igUser}/media_publish`, { creation_id: creationId });

  return {
    platform: "instagram",
    url: `https://www.instagram.com/p/${mediaId}/`,
    at: new Date().toISOString(),
  };
}

/* ── orchestrator ────────────────────────────────────────────────────────── */

const HANDLERS: Record<string, { ready: () => boolean; run: (d: Drop) => Promise<PostResult>; gate: string }> = {
  instagram: {
    ready: instagramConfigured,
    run: postInstagram,
    gate: "awaiting Instagram Business account + Page link",
  },
  bluesky: {
    ready: () => Boolean(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD),
    run: postBluesky,
    gate: "no Bluesky credentials",
  },
  telegram: {
    ready: () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL),
    run: postTelegram,
    gate: "no Telegram bot configured",
  },
  linkedin: { ready: () => false, run: async () => { throw 0; }, gate: "awaiting creator OAuth" },
  tiktok: { ready: () => false, run: async () => { throw 0; }, gate: "awaiting Content Posting API review" },
};

export const ALL_PLATFORMS = Object.keys(HANDLERS);

export async function publishDrop(drop: Drop, platforms: string[] = ALL_PLATFORMS) {
  const published: PostResult[] = [];
  const queued: QueuedResult[] = [];

  if (process.env.DOPPEL_PUBLISH_ENABLED !== "true") {
    return { published, queued: platforms.map((p) => ({ platform: p, reason: "publishing disabled" })) };
  }

  await Promise.all(
    platforms.map(async (p) => {
      const h = HANDLERS[p];
      if (!h) return;

      const cached = shipped.get(key(drop.id, p));
      if (cached) return void published.push(cached); // idempotent
      if (!h.ready()) return void queued.push({ platform: p, reason: h.gate });

      const t0 = Date.now();
      try {
        const res = await h.run(drop);
        shipped.set(key(drop.id, p), res);
        published.push(res);
        console.error(JSON.stringify({ evt: "publish.ok", dep: p, ms: Date.now() - t0 }));
      } catch (err) {
        // Never swallow: one dead platform must not take the others down.
        console.error(JSON.stringify({ evt: "publish.fail", dep: p, ms: Date.now() - t0, err: String(err) }));
        queued.push({ platform: p, reason: err instanceof Error ? err.message : String(err) });
      }
    })
  );

  return { published, queued };
}
