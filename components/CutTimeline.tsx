import type { CutPlan } from "@/lib/types";

const REASON_LABEL: Record<string, string> = {
  silence: "silence",
  filler: "filler",
  head: "lead-in",
  tail: "lead-out",
};

export function CutTimeline({ plan }: { plan: CutPlan }) {
  const total = plan.sourceDuration || 1;
  const pct = (v: number) => `${(v / total) * 100}%`;

  return (
    <div className="space-y-3">
      <div className="relative h-9 w-full overflow-hidden rounded-lg bg-surface-2">
        {plan.keep.map((s, i) => (
          <div
            key={`keep-${i}`}
            className="absolute inset-y-0 bg-live/85"
            style={{ left: pct(s.start), width: pct(s.end - s.start) }}
            title={`Kept ${s.start.toFixed(2)}–${s.end.toFixed(2)}s`}
          />
        ))}
        {plan.cuts.map((c, i) => (
          <div
            key={`cut-${i}`}
            className="absolute inset-y-0 border-x border-accent/40 bg-accent/15"
            style={{ left: pct(c.start), width: pct(c.end - c.start) }}
            title={`${REASON_LABEL[c.reason]} ${c.start.toFixed(2)}–${c.end.toFixed(2)}s`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted">
        <span>
          <span className="text-foreground">{plan.sourceDuration.toFixed(1)}s</span> raw
        </span>
        <span>
          → <span className="text-live">{plan.outDuration.toFixed(1)}s</span> cut
        </span>
        <span>
          <span className="text-accent">−{plan.removedSeconds.toFixed(1)}s</span> across{" "}
          {plan.cuts.length} cuts
        </span>
      </div>

      {plan.cuts.length > 0 && (
        <ul className="max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted">
          {plan.cuts.map((c, i) => (
            <li key={i}>
              <span className="text-accent">✂</span> {c.start.toFixed(2)}–{c.end.toFixed(2)}s{" "}
              <span className="text-foreground/70">{REASON_LABEL[c.reason]}</span>
              {c.text && <span className="text-muted"> “{c.text}”</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
