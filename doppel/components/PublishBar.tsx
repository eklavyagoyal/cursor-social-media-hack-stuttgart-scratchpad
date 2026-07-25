"use client";

import { useEffect, useState } from "react";
import { Label } from "./ui";

const PLATFORMS = ["instagram", "bluesky", "telegram", "linkedin", "tiktok"] as const;
const NAMES: Record<string, string> = {
  instagram: "Instagram",
  bluesky: "Bluesky",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

type Published = { platform: string; url: string; at: string };
type Queued = { platform: string; reason: string };

/** Seconds ticker so "posted · 11s ago" is true rather than decorative. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const ago = (now: number, at: string) => {
  const s = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
};

export function PublishBar({ dropId, demo }: { dropId: string; demo: boolean }) {
  const [selected, setSelected] = useState<string[]>([...PLATFORMS]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Published[]>([]);
  const [queued, setQueued] = useState<Queued[]>([]);
  const now = useNow(published.length > 0);
  const done = published.length > 0 || queued.length > 0;

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 900));
        const at = new Date().toISOString();
        setPublished(
          selected
            .filter((p) => p !== "tiktok")
            .map((p) => ({ platform: p, url: `https://${p}.com/legacyai/p/demo`, at }))
        );
        setQueued(
          selected.includes("tiktok")
            ? [{ platform: "tiktok", reason: "awaiting Content Posting API review" }]
            : []
        );
        return;
      }

      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dropId, platforms: selected }),
      });
      const data = (await res.json()) as {
        published?: Published[];
        queued?: Queued[];
        error?: string;
      };
      // 207 is partial success, not a failure — render both lists.
      if (!data.published && !data.queued) throw new Error(data.error ?? `publish failed (${res.status})`);
      setPublished(data.published ?? []);
      setQueued(data.queued ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rule mt-16 pt-8">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <Label>publish to</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = selected.includes(p);
            return (
              <button
                key={p}
                onClick={() => toggle(p)}
                disabled={busy || done}
                className={`px-4 py-2 font-mono text-[13px] transition-colors duration-200 disabled:cursor-default ${
                  on ? "bg-ash-100 text-background" : "bg-ash-800 text-ash-300 hover:text-ash-100"
                }`}
              >
                {NAMES[p]}
              </button>
            );
          })}
        </div>

        {!done && (
          <button
            onClick={publish}
            disabled={busy || !selected.length}
            className="ml-auto bg-brand px-8 py-3 text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Publishing…" : `Publish to ${selected.length}`}
          </button>
        )}
      </div>

      {error && <p className="mt-5 font-mono text-sm text-brand">× {error}</p>}

      {done && (
        <div className="mt-8 space-y-3 font-mono text-[15px]">
          {published.map((p) => (
            <div key={p.platform} className="flex animate-land items-center gap-5">
              <span className="w-4 text-[#4ade80]">✓</span>
              <span className="w-28 text-ash-100">{NAMES[p.platform] ?? p.platform}</span>
              <span className="text-ash-300">posted · {ago(now, p.at)}</span>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="text-ash-400 underline underline-offset-4 transition-colors hover:text-brand"
              >
                view
              </a>
            </div>
          ))}
          {queued.map((q) => (
            <div key={q.platform} className="flex animate-land items-center gap-5">
              <span className="w-4 text-ash-400">⋯</span>
              <span className="w-28 text-ash-200">{NAMES[q.platform] ?? q.platform}</span>
              <span className="text-ash-400">{q.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
