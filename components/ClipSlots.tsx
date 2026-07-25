"use client";

import type { Shot } from "@/lib/types";

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;

/**
 * The script, as a shoot list you drop takes into.
 *
 * One slot per shot, because the script already decided how many clips there are
 * — a fixed number of upload boxes would make the template a form, and the whole
 * point is that regenerating the script re-shapes the shoot.
 *
 * Slots may stay empty. A partial shoot still renders: what is attached gets cut
 * and joined in script order, so an operator can film the hook, see the result,
 * and film the rest afterwards.
 */
export function ClipSlots({
  shots,
  files,
  onPick,
  onClear,
  disabled = false,
}: {
  shots: Shot[];
  files: (File | null)[];
  onPick: (index: number, file: File) => void;
  onClear: (index: number) => void;
  disabled?: boolean;
}) {
  const attached = files.filter(Boolean).length;
  const plannedSeconds = shots.reduce((sum, s) => sum + s.seconds, 0);
  const attachedSeconds = shots.reduce(
    (sum, s, i) => (files[i] ? sum + s.seconds : sum),
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="eyebrow">Shoot list</p>
        <p className="font-mono text-[11px] text-muted">
          <span className={attached === shots.length ? "text-live" : "text-foreground"}>
            {attached}
          </span>{" "}
          of {shots.length} clips · {attachedSeconds}s of {plannedSeconds}s planned
        </p>
      </div>

      <ol className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border">
        {shots.map((shot, i) => (
          <Slot
            key={shot.n}
            shot={shot}
            file={files[i] ?? null}
            disabled={disabled}
            onPick={(f) => onPick(i, f)}
            onClear={() => onClear(i)}
          />
        ))}
      </ol>
    </div>
  );
}

function Slot({
  shot,
  file,
  onPick,
  onClear,
  disabled,
}: {
  shot: Shot;
  file: File | null;
  onPick: (file: File) => void;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <li
      className={`flex flex-col gap-4 bg-surface p-4 transition-colors sm:flex-row sm:items-start ${
        file ? "bg-live/6" : ""
      }`}
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-[10px] ${
          file ? "border-live/40 bg-live/15 text-live" : "border-border bg-surface-2 text-ash-400"
        }`}
      >
        {file ? "✓" : String(shot.n).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-3 text-[15px] text-foreground">
          {shot.label}
          <span className="font-mono text-[11px] text-muted">{shot.seconds}s</span>
        </p>

        {/* The line to say is what the operator reads off the screen while filming,
            so it stays fully legible rather than being clipped to one line. */}
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-ash-200">“{shot.say}”</p>

        <p className="mt-1.5 flex max-w-2xl gap-2 text-[12.5px] leading-relaxed text-muted">
          <span aria-hidden className="text-muted/60">
            ▤
          </span>
          <span>{shot.camera}</span>
        </p>

        {shot.onScreen && (
          <p className="mt-2 inline-block rounded-md bg-foreground/8 px-2 py-1 font-mono text-[11px] text-foreground/80">
            On screen: {shot.onScreen}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:w-52 sm:items-end">
        <label
          className={`inline-block rounded-lg border px-4 py-2 font-mono text-[12px] transition-colors ${
            disabled
              ? "cursor-default border-border text-muted opacity-40"
              : "cursor-pointer border-border text-foreground hover:border-accent/60"
          }`}
        >
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              // Clearing lets the same file be re-picked after a remove.
              e.target.value = "";
            }}
          />
          {file ? "replace" : "choose clip"}
        </label>

        {file && (
          <>
            <span className="max-w-full truncate font-mono text-[11px] text-ash-200">
              {file.name}
            </span>
            <span className="font-mono text-[10.5px] text-muted">{mb(file.size)}</span>
            {!disabled && (
              <button
                type="button"
                onClick={onClear}
                className="font-mono text-[10.5px] text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                remove
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
