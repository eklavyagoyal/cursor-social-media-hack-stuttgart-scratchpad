"use client";

import type { BrandGenome } from "@/lib/brand";
import { Label, Section, Templated } from "./ui";

export function GenomeCard({ genome }: { genome: BrandGenome }) {
  const { voice, look, substance } = genome;

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Label className="mb-4">
            Brand profile · {genome.sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </Label>
          <h3 className="display text-5xl leading-[0.95] sm:text-6xl">{genome.name}</h3>
          {genome.tagline && (
            <p className="mt-3 max-w-xl font-serif text-2xl italic leading-snug text-muted">
              {genome.tagline}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Label className="mb-2">Voice</Label>
          <div className="font-serif text-[28px] leading-tight">
            {voice.adjectives.map((a, i) => (
              <div key={i}>{a}</div>
            ))}
          </div>
        </div>
      </header>

      {/* The verbatim phrases are the proof that we read the site rather than
          guessed at it — so they get the most space on the card. */}
      <Section label={`${voice.petPhrases.length} phrases · verbatim from the site`} className="mt-12">
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {voice.petPhrases.map((p, i) => (
            <blockquote
              key={i}
              className="relative bg-surface px-7 py-6 transition-colors duration-200 hover:bg-surface-2"
            >
              <span
                className="pointer-events-none absolute left-1.5 top-0 select-none font-serif text-5xl leading-none text-accent opacity-40"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="relative font-serif text-[21px] leading-snug text-foreground">{p}</p>
            </blockquote>
          ))}
        </div>
      </Section>

      <Section label="Palette" className="mt-10">
        <div className="grid grid-cols-5 gap-3">
          {look.palette.map((hex, i) => (
            <div key={`${hex}-${i}`}>
              <div className="h-24 w-full rounded-md" style={{ background: hex }} />
              <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                {hex}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 text-[14px] leading-relaxed text-muted sm:grid-cols-2">
          <p>
            <span className="text-foreground/60">Type · </span>
            {look.typographyVibe}
          </p>
          <p>
            <span className="text-foreground/60">Imagery · </span>
            {look.imageryStyle}
          </p>
        </div>
      </Section>

      <div className="grid gap-x-12 sm:grid-cols-2">
        <Section label={`${substance.pillars.length} content pillars`} className="mt-10">
          <ol className="space-y-2.5">
            {substance.pillars.map((p, i) => (
              <li key={i} className="flex gap-4 text-[17px] leading-snug">
                <span className="pt-1.5 font-mono text-[11px] text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </Section>

        <div>
          <Section label="Target person" className="mt-10">
            <p className="text-[17px] leading-relaxed">{substance.icp}</p>
          </Section>
          <Section label="Proof" className="mt-8">
            <ul className="space-y-3">
              {substance.proofPoints.map((p, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                  <span className="text-accent">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <Section label={`${genome.hooks.length} hook patterns`} className="mt-10">
        <div className="space-y-3">
          {genome.hooks.map((h, i) => (
            <div key={i} className="font-mono text-[14px] leading-relaxed text-foreground/85">
              <Templated text={h} />
            </div>
          ))}
        </div>
      </Section>

      <Section label="Guardrails" className="mt-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2.5 text-[13px] text-muted">never says</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {voice.forbidden.map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="font-mono text-[13px] text-muted line-through decoration-accent/70"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[13px] text-muted">Sentence style · emojis: {voice.emojiPolicy}</p>
            <p className="text-[14px] leading-relaxed text-foreground/85">{voice.sentenceStyle}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
