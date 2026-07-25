"use client";

import type { ClipMode, Shot } from "@/lib/types";
import type { VoiceOption } from "@/lib/voice";

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
 *
 * Each slot also decides where its audio comes from. Filmed sound gets transcribed
 * and cut; a voice speaks the shot's written line instead, which is what makes
 * silent footage — b-roll, hands, a screen recording — usable at all.
 */
export function ClipSlots({
  shots,
  files,
  modes,
  voices,
  voiceId,
  onPick,
  onClear,
  onMode,
  onVoice,
  disabled = false,
}: {
  shots: Shot[];
  files: (File | null)[];
  modes: ClipMode[];
  voices: VoiceOption[];
  voiceId: string;
  onPick: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onMode: (index: number, mode: ClipMode) => void;
  onVoice: (id: string) => void;
  disabled?: boolean;
}) {
  const attached = files.filter(Boolean).length;
  const plannedSeconds = shots.reduce((sum, s) => sum + s.seconds, 0);
  const attachedSeconds = shots.reduce(
    (sum, s, i) => (files[i] ? sum + s.seconds : sum),
    0,
  );
  const voice = voices.find((v) => v.id === voiceId);
  const usingVoice = modes.some((m) => m === "voice");

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

      {voices.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5">
          <label className="font-mono text-[11px] text-muted" htmlFor="voice-pick">
            Voice for spoken shots
          </label>
          <select
            id="voice-pick"
            value={voiceId}
            disabled={disabled}
            onChange={(e) => onVoice(e.target.value)}
            className="rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-[12px] text-foreground outline-none focus:border-accent/60 disabled:opacity-40"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.category !== "premade" ? " (yours)" : ""}
                {v.labels.length ? ` · ${v.labels.slice(0, 3).join(", ")}` : ""}
              </option>
            ))}
          </select>

          {/* Hearing it before spending a render on it. */}
          {voice?.previewUrl && (
            <audio key={voice.id} controls preload="none" src={voice.previewUrl} className="h-8 max-w-[240px]" />
          )}

          {!usingVoice && (
            <p className="font-mono text-[11px] text-muted/70">
              no shot is set to a voice yet
            </p>
          )}
        </div>
      )}

      <ol className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border">
        {shots.map((shot, i) => (
          <Slot
            key={shot.n}
            shot={shot}
            file={files[i] ?? null}
            mode={modes[i] ?? "original"}
            voiceName={voice?.name}
            disabled={disabled}
            onPick={(f) => onPick(i, f)}
            onClear={() => onClear(i)}
            onMode={(m) => onMode(i, m)}
            canUseVoice={voices.length > 0}
          />
        ))}
      </ol>
    </div>
  );
}

function Slot({
  shot,
  file,
  mode,
  voiceName,
  onPick,
  onClear,
  onMode,
  disabled,
  canUseVoice,
}: {
  shot: Shot;
  file: File | null;
  mode: ClipMode;
  voiceName?: string;
  onPick: (file: File) => void;
  onClear: () => void;
  onMode: (mode: ClipMode) => void;
  disabled: boolean;
  canUseVoice: boolean;
}) {
  const spoken = mode === "voice";

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
            so it stays fully legible rather than being clipped to one line. In a
            spoken shot it is what the voice reads instead — same text, so the
            script stays the single source of truth either way. */}
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

        {canUseVoice && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              <ModeButton
                active={!spoken}
                disabled={disabled}
                onClick={() => onMode("original")}
                title="Transcribe the filmed sound, cut its silences and fillers"
              >
                filmed sound
              </ModeButton>
              <ModeButton
                active={spoken}
                disabled={disabled}
                onClick={() => onMode("voice")}
                title="Discard the filmed sound and have the voice read this line"
              >
                voice
              </ModeButton>
            </div>

            <p className="font-mono text-[11px] text-muted">
              {spoken
                ? `${voiceName ?? "the voice"} reads this line · silent footage is fine`
                : "your own voice · needs sound on the clip"}
            </p>
          </div>
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
          {file ? "replace" : spoken ? "choose b-roll" : "choose clip"}
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

function ModeButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 font-mono text-[11px] transition-colors disabled:opacity-40 ${
        active
          ? "bg-accent/15 text-accent"
          : "bg-surface text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
