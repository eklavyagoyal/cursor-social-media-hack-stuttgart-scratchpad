import { timingSafeEqual } from "node:crypto";
import type { PublishResult } from "./types";

const GRAPH_VERSION = "v23.0";

function graphBase(): string {
  // Accounts connected through a Facebook Page use graph.facebook.com; accounts
  // using Instagram Login use graph.instagram.com. Overridable because which one
  // applies depends on how the app was set up.
  return process.env.IG_GRAPH_HOST ?? "https://graph.facebook.com";
}

type GraphError = { error?: { message?: string; code?: number } };

async function graph<T>(
  urlPath: string,
  init: RequestInit & { params?: Record<string, string> } = {},
): Promise<T> {
  const { params, ...rest } = init;
  const url = new URL(`${graphBase()}/${GRAPH_VERSION}/${urlPath}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);

  const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(60_000) });
  const json = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || json.error) {
    throw new Error(
      `Instagram Graph ${res.status}: ${json.error?.message ?? "unbekannter Fehler"}`,
    );
  }
  return json;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type InstagramOptions = {
  videoUrl: string;
  caption: string;
  shareToFeed?: boolean;
  /** How long to wait for Instagram to finish transcoding. */
  timeoutMs?: number;
};

export async function publishToInstagram(
  options: InstagramOptions,
): Promise<PublishResult> {
  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;

  if (!token || !igUserId) {
    return {
      target: "instagram",
      status: "queued",
      error: "IG_ACCESS_TOKEN / IG_USER_ID missing — the post is queued.",
    };
  }

  try {
    const container = await graph<{ id: string }>(`${igUserId}/media`, {
      method: "POST",
      params: {
        media_type: "REELS",
        video_url: options.videoUrl,
        caption: options.caption,
        share_to_feed: String(options.shareToFeed ?? true),
        access_token: token,
      },
    });

    // Instagram transcodes asynchronously; publishing before FINISHED fails.
    const deadline = Date.now() + (options.timeoutMs ?? 180_000);
    let status = "IN_PROGRESS";
    while (Date.now() < deadline) {
      await sleep(3000);
      const s = await graph<{ status_code?: string; status?: string }>(container.id, {
        params: { fields: "status_code,status", access_token: token },
      });
      status = s.status_code ?? "IN_PROGRESS";
      if (status === "FINISHED") break;
      if (status === "ERROR") throw new Error(`Instagram Transcoding fehlgeschlagen: ${s.status ?? ""}`);
    }
    if (status !== "FINISHED") {
      throw new Error(`Instagram war nach dem Timeout noch bei "${status}".`);
    }

    const published = await graph<{ id: string }>(`${igUserId}/media_publish`, {
      method: "POST",
      params: { creation_id: container.id, access_token: token },
    });

    const meta = await graph<{ permalink?: string }>(published.id, {
      params: { fields: "permalink", access_token: token },
    }).catch(() => ({ permalink: undefined }));

    return {
      target: "instagram",
      status: "posted",
      id: published.id,
      ...(meta.permalink ? { url: meta.permalink } : {}),
    };
  } catch (e) {
    return {
      target: "instagram",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Telegram accepts a video URL directly with no review process, which makes it the
 * cheapest way to prove the pipeline really ships something.
 */
export async function publishToTelegram(
  videoUrl: string,
  caption: string,
): Promise<PublishResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL;

  if (!token || !chatId) {
    return { target: "telegram", status: "skipped", error: "Telegram not configured." };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, video: videoUrl, caption: caption.slice(0, 1024) }),
      signal: AbortSignal.timeout(60_000),
    });
    const json = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: { message_id: number };
    };
    if (!json.ok) throw new Error(json.description ?? "unbekannter Fehler");

    return {
      target: "telegram",
      status: "posted",
      id: String(json.result?.message_id ?? ""),
    };
  } catch (e) {
    return {
      target: "telegram",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function publishingEnabled(): boolean {
  return process.env.PUBLISH_ENABLED === "true";
}

/**
 * The caption is written by whoever calls the route, and it lands verbatim on a
 * real business account. This app is meant to be deployed publicly during the
 * demo, so without an operator secret anyone who reaches the URL can post
 * arbitrary text under our name.
 *
 * Fails closed: an unset PUBLISH_SECRET denies every request rather than
 * silently leaving the account open.
 */
export function publishAuthorized(provided: string | null | undefined): boolean {
  const secret = process.env.PUBLISH_SECRET;
  if (!secret || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  // timingSafeEqual throws on length mismatch, and the length itself is not a
  // secret worth protecting here.
  return a.length === b.length && timingSafeEqual(a, b);
}

export function publishSecretConfigured(): boolean {
  return Boolean(process.env.PUBLISH_SECRET);
}
