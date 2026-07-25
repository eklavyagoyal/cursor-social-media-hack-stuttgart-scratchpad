"use client";

import type { ContentAngle, MarketResearch, Platform } from "@/lib/research";

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
  linkedin: "LI",
  web: "Web",
};

/**
 * What the niche is posting, and the shooting decisions derived from it.
 *
 * The references stay on screen next to the angles on purpose: an angle without
 * its evidence is just the model's opinion, and the creator has to be able to
 * click through and judge for themselves.
 */
export function MarketPanel({
  research,
  chosen,
  onPick,
}: {
  research: MarketResearch;
  chosen?: string;
  onPick: (angle: ContentAngle) => void;
}) {
  const { references, angles, degraded } = research;

  return (
    <div className="animate-rise space-y-8">
      {angles.length > 0 && (
        <div className="grid gap-3">
          {angles.map((a) => {
            const active = chosen === a.angle;
            return (
              <button
                key={a.angle}
                type="button"
                onClick={() => onPick(a)}
                className={`rounded-xl border p-5 text-left transition-colors duration-200 ${
                  active
                    ? "border-accent/70 bg-accent/8"
                    : "border-border bg-surface-2/60 hover:border-accent/40"
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="display text-lg leading-snug">{a.angle}</p>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {a.totalSeconds}s
                  </span>
                </div>

                <p className="mt-3 font-serif text-[19px] leading-snug text-foreground">
                  „{a.hook}“
                </p>

                <p className="mt-3 text-[13px] leading-relaxed text-muted">{a.why}</p>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted">
                  <span className="text-accent">{a.narration}</span>
                  <span>{a.format}</span>
                </div>

                <ol className="mt-3 space-y-1 font-mono text-[11px] text-muted">
                  {a.cuts.map((c, i) => (
                    <li key={i}>
                      <span className="text-foreground/70">
                        {String(i + 1).padStart(2, "0")} · {c.label} · {c.seconds}s
                      </span>{" "}
                      — {c.shoot}
                    </li>
                  ))}
                </ol>

                <p className="mt-4 font-mono text-[11px] text-accent">
                  {active ? "als Thema übernommen" : "diesen Winkel nehmen"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {degraded && (
        <p className="max-w-2xl border-l-2 border-accent/50 pl-4 text-[13px] leading-relaxed text-muted">
          {degraded}
        </p>
      )}

      {references.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {references.length} Fundstellen · letzter Monat
          </p>
          <ul className="mt-3 space-y-1.5">
            {references.map((r) => (
              <li key={r.url} className="flex gap-3 text-[13px] leading-snug">
                <span className="mt-px w-8 shrink-0 font-mono text-[10px] uppercase text-accent">
                  {PLATFORM_LABEL[r.platform]}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground/80 underline decoration-dotted underline-offset-4 hover:text-accent"
                >
                  {r.title || r.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
