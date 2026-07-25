"use client";

import { useEffect, useRef } from "react";

export type TraceLine = { kind: "step" | "ok" | "warn" | "error"; msg: string };

const TONE: Record<TraceLine["kind"], string> = {
  step: "text-muted",
  ok: "text-foreground",
  warn: "text-accent",
  error: "text-red-300",
};

/**
 * The personality of the product. Lines land one at a time; the newest one is
 * pending (◐) until the next event proves it finished (✓).
 */
export function TraceStream({ lines, running }: { lines: TraceLine[]; running: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines.length]);

  return (
    <div className="font-mono text-[15px] leading-[1.95] tracking-tight sm:text-[16px]">
      {lines.map((l, i) => {
        const pending = running && i === lines.length - 1;
        const mark = pending ? "◐" : l.kind === "warn" ? "!" : l.kind === "error" ? "×" : "✓";
        const markTone = pending
          ? "animate-pulse-soft text-accent"
          : l.kind === "error"
            ? "text-red-300"
            : l.kind === "warn"
              ? "text-accent"
              : "text-live";
        return (
          <div key={i} className={`flex gap-4 animate-land ${TONE[l.kind]}`}>
            <span className={`w-4 shrink-0 ${markTone}`}>{mark}</span>
            <span>{l.msg}</span>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
