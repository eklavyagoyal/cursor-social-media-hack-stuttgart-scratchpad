"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CaptionGroup, CutPlan } from "@/lib/types";

type Props = {
  rawUrl: string;
  plan: CutPlan;
  captions: CaptionGroup[];
};

/**
 * Plays the *uncut* upload while skipping removed regions with seeks, and draws
 * captions as DOM. Nothing is encoded, so the cut is previewable the instant the
 * transcript lands — the mp4 export is only needed for the actual upload.
 */
export function ReelPreview({ rawUrl, plan, captions }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [outTime, setOutTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Where each keep span starts on the output timeline.
  const offsets = useMemo(() => {
    const acc: number[] = [];
    let sum = 0;
    for (const s of plan.keep) {
      acc.push(sum);
      sum += s.end - s.start;
    }
    return acc;
  }, [plan.keep]);

  // The span is derived from currentTime rather than tracked separately, so seeking
  // backwards lands in the right span instead of snapping to wherever playback was.
  // A raf loop rather than `timeupdate`, which fires far too coarsely for
  // word-level captions.
  useEffect(() => {
    let frame = 0;

    const loop = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime;
        const i = plan.keep.findIndex((s) => t >= s.start - 0.08 && t < s.end);

        if (i >= 0) {
          setOutTime(offsets[i] + Math.max(0, t - plan.keep[i].start));
        } else {
          // Inside a removed region: jump to the next kept span, or stop at the end.
          const next = plan.keep.findIndex((s) => s.start > t);
          if (next >= 0) v.currentTime = plan.keep[next].start;
          else {
            v.pause();
            setOutTime(plan.outDuration);
          }
        }
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [offsets, plan.keep, plan.outDuration]);

  const restart = () => {
    const v = videoRef.current;
    if (!v || plan.keep.length === 0) return;
    v.currentTime = plan.keep[0].start;
    setOutTime(0);
    void v.play();
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (outTime >= plan.outDuration - 0.15) restart();
      else void v.play();
    } else {
      v.pause();
    }
  };

  const active = captions.find((c) => outTime >= c.start && outTime < c.end);
  const progress = plan.outDuration > 0 ? (outTime / plan.outDuration) * 100 : 0;

  return (
    <div className="w-full max-w-[300px]">
      {/* container-type makes the cqw caption size resolve against the frame
          rather than silently falling back to the viewport. */}
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black [container-type:inline-size]">
        <video
          ref={videoRef}
          src={rawUrl}
          className="h-full w-full object-cover"
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v && plan.keep.length > 0) v.currentTime = plan.keep[0].start;
          }}
        />

        {active && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-center px-4">
            <p
              className="text-center font-black uppercase leading-tight text-white"
              style={{
                fontSize: "clamp(16px, 8.6cqw, 30px)",
                textShadow:
                  "0 0 3px #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000",
              }}
            >
              {active.text}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 grid place-items-center transition-colors hover:bg-black/10"
          aria-label={playing ? "Pause" : "Abspielen"}
        >
          {!playing && (
            <span className="animate-fade grid h-16 w-16 place-items-center rounded-full bg-white/95">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="#0a0a0a" aria-hidden>
                <path d="M2 1.5 18.5 12 2 22.5z" />
              </svg>
            </span>
          )}
        </button>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
        <span>
          {outTime.toFixed(1)}s / {plan.outDuration.toFixed(1)}s
        </span>
        <button type="button" onClick={restart} className="hover:text-foreground">
          ↺ from the start
        </button>
      </div>
    </div>
  );
}
