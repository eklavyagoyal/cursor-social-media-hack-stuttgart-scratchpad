"use client";

import { useEffect, useRef } from "react";

export type TraceLine = { kind: "step" | "ok" | "warn" | "error"; msg: string };

const TONE: Record<TraceLine["kind"], string> = {
  step: "text-ash-300",
  ok: "text-ash-100",
  warn: "text-[#E8DCC8]",
  error: "text-brand",
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
    <div className="font-mono text-[17px] leading-[2.1] tracking-tight">
      {lines.map((l, i) => {
        const pending = running && i === lines.length - 1;
        const mark = pending ? "◐" : l.kind === "warn" ? "!" : l.kind === "error" ? "×" : "✓";
        return (
          <div key={i} className={`flex gap-4 animate-land ${TONE[l.kind]}`}>
            <span
              className={`w-4 shrink-0 ${pending ? "animate-pulse-soft text-brand" : l.kind === "error" ? "text-brand" : "text-ash-400"}`}
            >
              {mark}
            </span>
            <span>{l.msg}</span>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
