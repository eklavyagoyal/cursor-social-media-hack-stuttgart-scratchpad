"use client";

import { CutTimeline } from "@/components/CutTimeline";
import type { ClipResult, RenderResult } from "@/lib/types";

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;

/**
 * A joined shoot, take by take.
 *
 * The single-clip view previews the raw file and skips the cut regions during
 * playback, which proves the cut without waiting for an encode. That trick does
 * not survive a join — the reel is several files — so this plays the rendered mp4
 * instead. It is the actual artifact that gets posted, which is the stronger thing
 * to show anyway.
 */
export function ShootBreakdown({
  clips,
  render,
}: {
  clips: ClipResult[];
  render: RenderResult;
}) {
  const sourceSeconds = clips.reduce((sum, c) => sum + c.plan.sourceDuration, 0);
  const removed = clips.reduce((sum, c) => sum + c.plan.removedSeconds, 0);
  const captions = clips.reduce((sum, c) => sum + c.captions.length, 0);

  return (
    <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
      <div>
        <video
          key={render.publicUrl}
          src={render.publicUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-[9/16] w-full rounded-xl border border-ash-700 bg-black object-cover"
        />
        <p className="mt-2 font-mono text-[11px] text-muted">
          {clips.length} takes joined · {render.duration.toFixed(1)}s
        </p>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-2 gap-3 font-mono text-[11px] sm:grid-cols-4">
          <Stat label="Filmed" value={`${sourceSeconds.toFixed(1)}s`} />
          <Stat label="Reel" value={`${render.duration.toFixed(1)}s`} />
          <Stat label="Cut" value={`−${removed.toFixed(1)}s`} />
          <Stat label="File size" value={mb(render.sizeBytes)} />
        </div>

        <div>
          <p className="eyebrow">
            Per take · {captions} caption groups total
          </p>
          <ol className="mt-4 space-y-5">
            {clips.map((clip) => (
              <li key={clip.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[14px] text-foreground">
                    <span className="font-mono text-[11px] text-muted">
                      {String(clip.index + 1).padStart(2, "0")}
                    </span>{" "}
                    {clip.label ?? `Clip ${clip.index + 1}`}
                  </p>
                  <a
                    href={clip.render.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
                  >
                    this take alone ↗
                  </a>
                </div>
                <div className="mt-2">
                  <CutTimeline plan={clip.plan} />
                </div>
                {clip.transcript.text && (
                  <p className="mt-2 max-h-16 overflow-y-auto text-[13px] leading-relaxed text-foreground/70">
                    {clip.transcript.text}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        <a
          href={render.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block font-mono text-[12px] text-foreground underline decoration-dotted underline-offset-4 hover:text-accent"
        >
          open the joined mp4 ↗
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
