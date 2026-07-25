"use client";

import { useState } from "react";
import type { Slide } from "@/lib/types";

export function Carousel({ slides, accent }: { slides: Slide[]; accent: string }) {
  const [i, setI] = useState(0);
  if (!slides.length) return null;
  const go = (d: number) => setI((n) => (n + d + slides.length) % slides.length);
  const s = slides[i];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-ash-800">
        {slides.map((sl, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={sl.imageUrl ?? ""}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
            style={{ opacity: n === i ? 1 : 0 }}
          />
        ))}
        {!s.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-ash-400">
            rendering image…
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

        <div className="absolute inset-x-0 bottom-0 p-7">
          <div className="font-mono text-[11px] tracking-[0.22em] text-white/60">
            {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
          <h3 className="mt-3 font-serif text-[34px] leading-[1.05] text-white">{s.headline}</h3>
          <p className="mt-3 max-w-[85%] text-[15px] leading-snug text-white/85">{s.body}</p>
        </div>

        <button
          onClick={() => go(-1)}
          aria-label="previous slide"
          className="absolute left-0 top-0 h-full w-1/5 cursor-w-resize opacity-0 focus:opacity-100"
        />
        <button
          onClick={() => go(1)}
          aria-label="next slide"
          className="absolute right-0 top-0 h-full w-1/5 cursor-e-resize opacity-0 focus:opacity-100"
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          className="font-mono text-lg text-ash-300 transition-colors hover:text-ash-100"
          aria-label="previous slide"
        >
          ←
        </button>
        <button
          onClick={() => go(1)}
          className="font-mono text-lg text-ash-300 transition-colors hover:text-ash-100"
          aria-label="next slide"
        >
          →
        </button>
        <div className="flex flex-1 gap-1.5">
          {slides.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              aria-label={`slide ${n + 1}`}
              className="h-[3px] flex-1 transition-colors duration-200"
              style={{ background: n === i ? accent : "rgba(255,255,255,0.14)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
