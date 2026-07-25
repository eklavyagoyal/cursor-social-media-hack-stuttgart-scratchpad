"use client";

import type { PublishResult } from "@/lib/types";

const TARGET_LABEL: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
};

const STATUS: Record<PublishResult["status"], { dot: string; text: string; label: string }> = {
  posted: { dot: "bg-live", text: "text-live", label: "posted" },
  queued: { dot: "bg-accent", text: "text-accent", label: "queued" },
  skipped: { dot: "bg-muted", text: "text-muted", label: "skipped" },
  error: { dot: "bg-red-400", text: "text-red-400", label: "error" },
};

export function ShipPanel({
  results,
  publicUrl,
}: {
  results: PublishResult[];
  publicUrl?: string;
}) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {results.map((r) => {
          const s = STATUS[r.status];
          return (
            <li
              key={r.target}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-surface-2/60 px-4 py-3"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              <span className="min-w-24 text-[14px] text-foreground">
                {TARGET_LABEL[r.target] ?? r.target}
              </span>
              <span className={`font-mono text-[12px] ${s.text}`}>{s.label}</span>

              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-foreground underline decoration-dotted underline-offset-4 hover:text-accent"
                >
                  view ↗
                </a>
              )}

              {r.error && (
                <span className="w-full font-mono text-[11px] leading-relaxed text-muted">
                  {r.error}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {publicUrl && (
        <p className="font-mono text-[11px] leading-relaxed text-muted">
          Public file Instagram fetched:{" "}
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            {publicUrl.replace(/^https?:\/\//, "").slice(0, 60)}…
          </a>
        </p>
      )}
    </div>
  );
}
