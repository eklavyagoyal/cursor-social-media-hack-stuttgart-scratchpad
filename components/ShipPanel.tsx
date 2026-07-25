"use client";

import { QRCodeSVG } from "qrcode.react";
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

/**
 * Where the audience should point their phone.
 *
 * The permalink is the only link that proves the reel is actually live on the
 * account, so it wins. It can be absent though — publish.ts swallows a failing
 * permalink lookup rather than losing an otherwise successful post — and a QR
 * pointing at the public mp4 still proves a file shipped, so that is the
 * fallback rather than showing nothing.
 */
function scanTarget(
  results: PublishResult[],
  publicUrl?: string,
): { url: string; label: string } | null {
  const posted = results.filter((r) => r.status === "posted");
  if (!posted.length) return null;

  const withLink = posted.find((r) => r.url);
  if (withLink?.url) {
    return { url: withLink.url, label: `Scan to open the reel on ${TARGET_LABEL[withLink.target] ?? withLink.target}` };
  }
  if (publicUrl) return { url: publicUrl, label: "Scan to play the file that went out" };
  return null;
}

export function ShipPanel({
  results,
  publicUrl,
}: {
  results: PublishResult[];
  publicUrl?: string;
}) {
  const posted = results.filter((r) => r.status === "posted").length;
  const scan = scanTarget(results, publicUrl);

  return (
    <div className="space-y-4">
      {posted > 0 && <Shipped count={posted} scan={scan} />}

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

/**
 * The end of the run, made checkable from across the room.
 *
 * A screenshot of a success state proves nothing at a demo — anyone can render a
 * green tick. The QR moves verification into the audience's own hands, which is
 * the entire reason it is here rather than a larger checkmark.
 */
function Shipped({
  count,
  scan,
}: {
  count: number;
  scan: { url: string; label: string } | null;
}) {
  return (
    <div className="animate-rise flex flex-col gap-6 rounded-lg border border-live/35 bg-live/8 p-6 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-live">Upload successful</p>
        <p className="display mt-2 text-[28px] leading-tight">
          {count === 1 ? "It's live." : `Live on ${count} channels.`}
        </p>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
          {scan
            ? "Scan the code and check it on your own phone — nothing here is a mockup."
            : "The post went through. No public link came back, so there is nothing to scan."}
        </p>

        {scan && (
          <a
            href={scan.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block max-w-full truncate font-mono text-[12px] text-foreground underline decoration-dotted underline-offset-4 hover:text-live"
          >
            {scan.url.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </div>

      {scan && (
        <figure className="shrink-0 sm:text-center">
          {/* White quiet zone and near-black modules: a camera needs the contrast,
              and the dark UI would otherwise invert the pattern. */}
          <div className="inline-block rounded-md bg-white p-3">
            <QRCodeSVG
              value={scan.url}
              // Sized for a phone reading it off a projected slide, not for the
              // operator's own screen.
              size={168}
              // Medium recovers ~15% of a partially obscured or badly focused scan,
              // which is the realistic failure mode when it is read off a projector.
              level="M"
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              marginSize={0}
            />
          </div>
          <figcaption className="mt-2 max-w-[192px] font-mono text-[10.5px] leading-snug text-muted">
            {scan.label}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
