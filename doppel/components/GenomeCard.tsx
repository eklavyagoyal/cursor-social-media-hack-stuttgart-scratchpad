"use client";

import type { BrandGenome } from "@/lib/types";
import { Label, Section, Templated } from "./ui";

export function GenomeCard({ genome }: { genome: BrandGenome }) {
  const { voice, look, substance } = genome;

  return (
    <div className="animate-rise">
      {/* Identity */}
      <header className="flex items-end justify-between gap-10">
        <div>
          <Label className="mb-5">brand genome · {genome.sourceUrl.replace(/^https?:\/\//, "")}</Label>
          <h1 className="font-serif text-7xl leading-[0.95] tracking-tight text-ash-100">
            {genome.name}
          </h1>
          {genome.tagline && (
            <p className="mt-4 max-w-xl font-serif text-2xl italic leading-snug text-ash-300">
              {genome.tagline}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <Label className="mb-3">voice</Label>
          <div className="font-serif text-3xl leading-tight text-ash-100">
            {voice.adjectives.map((a, i) => (
              <div key={i}>{a}</div>
            ))}
          </div>
        </div>
      </header>

      {/* Pet phrases — the hero. Verbatim from their own site. */}
      <Section label={`${voice.petPhrases.length} pet phrases · verbatim`} className="mt-14">
        <div className="grid gap-px bg-white/[0.07] md:grid-cols-2">
          {voice.petPhrases.map((p, i) => (
            <blockquote
              key={i}
              className="group relative bg-background px-8 py-7 transition-colors duration-200 hover:bg-ash-800"
            >
              <span
                className="pointer-events-none absolute left-2 top-1 select-none font-serif text-6xl leading-none text-brand opacity-30"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="relative font-serif text-[22px] leading-snug text-[#E8DCC8]">{p}</p>
            </blockquote>
          ))}
        </div>
      </Section>

      {/* Palette */}
      <Section label="palette" className="mt-12">
        <div className="grid grid-cols-5 gap-4">
          {look.palette.map((hex) => (
            <div key={hex}>
              <div className="h-28 w-full" style={{ background: hex }} />
              <div className="mt-3 font-mono text-xs uppercase tracking-widest text-ash-300">
                {hex}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 text-[15px] leading-relaxed text-ash-300 md:grid-cols-2">
          <p>
            <span className="text-ash-400">Type · </span>
            {look.typographyVibe}
          </p>
          <p>
            <span className="text-ash-400">Imagery · </span>
            {look.imageryStyle}
          </p>
        </div>
      </Section>

      {/* Substance */}
      <div className="grid gap-12 md:grid-cols-2">
        <Section label={`${substance.pillars.length} pillars`} className="mt-12">
          <ol className="space-y-3">
            {substance.pillars.map((p, i) => (
              <li key={i} className="flex gap-5 text-[19px] leading-snug text-ash-100">
                <span className="font-mono text-xs text-ash-400 pt-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </Section>

        <div className="mt-12">
          <Section label="who they talk to">
            <p className="text-[19px] leading-relaxed text-ash-100">{substance.icp}</p>
          </Section>
          <Section label="proof" className="mt-10">
            <ul className="space-y-4">
              {substance.proofPoints.map((p, i) => (
                <li key={i} className="flex gap-4 text-[16px] leading-relaxed text-ash-200">
                  <span className="text-brand">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {/* Hooks */}
      <Section label={`${genome.hooks.length} hook patterns`} className="mt-12">
        <div className="space-y-4">
          {genome.hooks.map((h, i) => (
            <div key={i} className="font-mono text-[15px] leading-relaxed text-ash-200">
              <Templated text={h} />
            </div>
          ))}
        </div>
      </Section>

      {/* Guardrails */}
      <Section label="guardrails" className="mt-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-ash-400">never says</p>
            <div className="flex flex-wrap gap-2">
              {voice.forbiddenWords.map((w) => (
                <span
                  key={w}
                  className="font-mono text-[13px] text-ash-300 line-through decoration-brand/70"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-ash-400">
              sentence style · emoji: {voice.emojiPolicy}
            </p>
            <p className="text-[15px] leading-relaxed text-ash-200">{voice.sentenceStyle}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
