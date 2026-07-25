"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Short = { imageUrls: string[]; voUrl: string; captionGroups: string[]; durationSec: number };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * The short is composited live in the browser — there is no mp4.
 *
 * Everything is driven off `audio.currentTime`, sampled in a rAF loop rather
 * than `timeupdate` (which fires ~4×/s and makes the Ken Burns drift stutter).
 * If the voiceover is missing we fall back to a wall clock so the visual still
 * plays; the demo never shows a dead rectangle.
 */
export function VerticalShort({ short }: { short: Short }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  // Only used when there is no voiceover to sync to.
  const silentElapsed = useRef(0);
  const silentStart = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [capIndex, setCapIndex] = useState(0);

  const hasAudio = Boolean(short.voUrl);
  const images = short.imageUrls.length ? short.imageUrls : [""];

  const durationOf = useCallback(() => {
    const d = audioRef.current?.duration;
    return d && Number.isFinite(d) && d > 0 ? d : short.durationSec || 18;
  }, [short.durationSec]);

  const timeOf = useCallback(() => {
    if (hasAudio && audioRef.current) return audioRef.current.currentTime;
    return (performance.now() - silentStart.current) / 1000;
  }, [hasAudio]);

  const stop = useCallback(() => {
    setPlaying(false);
    audioRef.current?.pause();
    cancelAnimationFrame(rafRef.current);
  }, []);

  const tick = useCallback(() => {
    const d = durationOf();
    const t = timeOf();

    const nImg = images.length;
    const quarter = d / nImg;
    const ii = Math.min(nImg - 1, Math.floor(t / quarter));
    setImgIndex(ii);

    const nCap = short.captionGroups.length || 1;
    setCapIndex(Math.min(nCap - 1, Math.floor((t / d) * nCap)));

    // Slow drift on every frame — one image is visible, the rest are pre-armed.
    for (let i = 0; i < nImg; i++) {
      const el = imgRefs.current[i];
      if (el) el.style.transform = `scale(${1 + 0.08 * clamp01((t - i * quarter) / quarter)})`;
    }
    if (barRef.current) barRef.current.style.width = `${clamp01(t / d) * 100}%`;

    if (t >= d) {
      setEnded(true);
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [durationOf, timeOf, images.length, short.captionGroups.length, stop]);

  const start = useCallback(() => {
    const a = audioRef.current;
    if (ended) {
      if (a) a.currentTime = 0;
      silentStart.current = performance.now();
      setEnded(false);
    } else if (!hasAudio) {
      silentStart.current = performance.now() - (imgIndex === 0 && capIndex === 0 ? 0 : 0);
    }
    if (hasAudio && a) void a.play().catch(() => undefined);
    setPlaying(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [ended, hasAudio, tick, imgIndex, capIndex]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const toggle = () => (playing ? stop() : start());

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div
        onClick={toggle}
        className="relative aspect-[9/16] w-full cursor-pointer select-none overflow-hidden bg-black"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out will-change-transform"
            style={{ opacity: i === imgIndex ? 1 : 0, transform: "scale(1)" }}
          />
        ))}

        {/* Scrim keeps burned-in captions legible over any generated image. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6">
          <p
            key={capIndex}
            className="animate-land text-center text-[30px] font-bold leading-[1.15] tracking-tight text-white"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.65)" }}
          >
            {short.captionGroups[capIndex] ?? ""}
          </p>
        </div>

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 animate-fade">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95">
              {ended ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.2">
                  <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                </svg>
              ) : (
                <svg width="26" height="30" viewBox="0 0 24 28" fill="#0A0A0A">
                  <path d="M3 2l19 12L3 26z" />
                </svg>
              )}
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
          <div ref={barRef} className="h-full bg-brand" style={{ width: "0%" }} />
        </div>
      </div>

      {hasAudio && (
        <audio
          ref={audioRef}
          src={short.voUrl}
          preload="auto"
          onEnded={() => {
            setEnded(true);
            stop();
          }}
        />
      )}
    </div>
  );
}
