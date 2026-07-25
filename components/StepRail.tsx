"use client";

import { useEffect, useRef } from "react";
import type { TraceLine } from "@/components/TraceStream";

export type StepStatus = "locked" | "idle" | "running" | "done" | "error";

export type RailStep = {
  id: string;
  n: number;
  title: string;
  status: StepStatus;
  /** Live progress for this step. Shown under the row while it is the active one. */
  lines?: TraceLine[];
  /** One line of outcome, kept after the trace collapses. */
  summary?: string;
};

/**
 * The run, as a rail.
 *
 * Every status the page used to print between the inputs lives here instead, so
 * the middle column is only the things you actually touch. That split is also why
 * this reads on camera: the left side moves while the right side stays still.
 */
export function StepRail({
  steps,
  activeId,
  onJump,
}: {
  steps: RailStep[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  const done = steps.filter((s) => s.status === "done").length;

  return (
    <nav aria-label="Durchlauf" className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Durchlauf</p>
        <p className="display mt-2 text-[19px]">
          {done} <span className="text-muted">von {steps.length}</span>
        </p>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            active={step.id === activeId}
            onJump={() => onJump(step.id)}
          />
        ))}
      </ol>
    </nav>
  );
}

function StepRow({
  step,
  active,
  onJump,
}: {
  step: RailStep;
  active: boolean;
  onJump: () => void;
}) {
  const locked = step.status === "locked";
  // The trace is only worth its vertical space while this step is the live one;
  // afterwards the one-line summary says the same thing in a tenth of the height.
  const showTrace = active && (step.lines?.length ?? 0) > 0;

  return (
    <li>
      <button
        type="button"
        onClick={onJump}
        disabled={locked}
        aria-current={active ? "step" : undefined}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
          ${active ? "bg-surface-2" : "hover:bg-surface"}
          ${locked ? "cursor-default opacity-35" : ""}`}
      >
        <StatusMark status={step.status} n={step.n} />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[14px] leading-tight ${
              active ? "text-foreground" : "text-ash-200"
            }`}
          >
            {step.title}
          </span>
          {step.summary && !showTrace && (
            <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">
              {step.summary}
            </span>
          )}
        </span>
      </button>

      {showTrace && <RailTrace lines={step.lines ?? []} running={step.status === "running"} />}
    </li>
  );
}

/** Number until it starts, then state. Keeps the rail readable at a glance. */
function StatusMark({ status, n }: { status: StepStatus; n: number }) {
  const base =
    "grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px] transition-colors";

  if (status === "done") {
    return <span className={`${base} border-live/40 bg-live/15 text-live`}>✓</span>;
  }
  if (status === "error") {
    return <span className={`${base} border-red-400/40 bg-red-400/10 text-red-300`}>×</span>;
  }
  if (status === "running") {
    return (
      <span className={`${base} border-accent/50 bg-accent/15 text-accent`}>
        <span className="animate-pulse-soft">◐</span>
      </span>
    );
  }
  return (
    <span className={`${base} border-border bg-surface text-ash-400`}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

/** The main column's TraceStream, shrunk to rail width. */
function RailTrace({ lines, running }: { lines: TraceLine[]; running: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines.length]);

  return (
    <div className="mb-1 ml-[27px] max-h-52 overflow-y-auto border-l border-border pl-4 no-scrollbar">
      {lines.map((l, i) => {
        const pending = running && i === lines.length - 1;
        const mark = pending ? "◐" : l.kind === "warn" ? "!" : l.kind === "error" ? "×" : "✓";
        const tone =
          l.kind === "error"
            ? "text-red-300"
            : l.kind === "warn"
              ? "text-accent"
              : l.kind === "ok"
                ? "text-ash-200"
                : "text-muted";
        return (
          <div
            key={i}
            className={`animate-land flex gap-2 font-mono text-[12px] leading-[1.65] ${tone}`}
          >
            <span
              className={`w-2.5 shrink-0 ${
                pending
                  ? "animate-pulse-soft text-accent"
                  : l.kind === "error"
                    ? "text-red-300"
                    : l.kind === "warn"
                      ? "text-accent"
                      : "text-live"
              }`}
            >
              {mark}
            </span>
            <span className="min-w-0">{l.msg}</span>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
