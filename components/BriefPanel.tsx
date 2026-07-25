import type { ReactNode } from "react";
import type { ShootBrief } from "@/lib/types";

/** Typographic quotes vary between the site and the model's output; fold them
 *  together. Every replacement is 1:1 so string offsets stay valid. */
const fold = (s: string) => s.toLowerCase().replace(/[‘’‚‛´`]/g, "'").replace(/[“”„‟]/g, '"');

/** Phrases short enough to collide by accident prove nothing. */
const MIN_PHRASE = 12;

type Match = { start: number; end: number };

function findPhrases(text: string, phrases: string[]): Match[] {
  const hay = fold(text);
  if (hay.length !== text.length) return [];

  const needles = phrases
    .map((p) => fold(p.trim()))
    .filter((p) => p.length >= MIN_PHRASE)
    .sort((a, b) => b.length - a.length);

  const found: Match[] = [];
  let i = 0;
  while (i < hay.length) {
    const hit = needles.find((n) => hay.startsWith(n, i));
    if (hit) {
      found.push({ start: i, end: i + hit.length });
      i += hit.length;
    } else {
      i++;
    }
  }
  return found;
}

/**
 * Marks the parts of the script the brand verifiably already says.
 *
 * Only exact reuse is highlighted — a paraphrase gets no credit. That keeps the
 * claim on screen ("N phrases carried over") true rather than flattering.
 */
function Grounded({ text, phrases }: { text: string; phrases?: string[] }) {
  const matches = phrases?.length ? findPhrases(text, phrases) : [];
  if (!matches.length) return <>{text}</>;

  const out: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) out.push(text.slice(cursor, m.start));
    out.push(
      <mark
        key={i}
        title="The brand's own phrase, carried over verbatim"
        className="rounded-sm bg-accent/18 px-0.5 text-accent decoration-accent/40 underline-offset-4"
      >
        {text.slice(m.start, m.end)}
      </mark>,
    );
    cursor = m.end;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}

export function BriefPanel({ brief, petPhrases }: { brief: ShootBrief; petPhrases?: string[] }) {
  // How much of the brand's own language actually survived into the script.
  const carried = petPhrases?.length
    ? petPhrases.filter((p) =>
        [brief.hook, brief.caption, ...brief.shots.map((s) => s.say)].some(
          (t) => findPhrases(t, [p]).length > 0,
        ),
      ).length
    : 0;

  return (
    <div className="space-y-6">
      {carried > 0 && (
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
          {carried} of {petPhrases?.length} brand phrases carried verbatim into the script
        </p>
      )}

      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Hook · first 2 seconds
        </p>
        <p className="display mt-1.5 text-2xl leading-snug text-foreground">
          <Grounded text={brief.hook} phrases={petPhrases} />
        </p>
      </div>

      <ol className="space-y-3">
        {brief.shots.map((shot) => (
          <li key={shot.n} className="rounded-xl border border-border bg-surface-2/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
                Shot {shot.n} · {shot.label}
              </p>
              <p className="font-mono text-[11px] text-muted">{shot.seconds}s</p>
            </div>

            <p className="mt-2 text-[15px] leading-relaxed text-foreground">
              “<Grounded text={shot.say} phrases={petPhrases} />”
            </p>

            <p className="mt-2 flex gap-2 text-[13px] leading-relaxed text-muted">
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
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Caption">
          <p className="whitespace-pre-line text-[14px] leading-relaxed">
            <Grounded text={brief.caption} phrases={petPhrases} />
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-accent/90">
            {brief.hashtags.join(" ")}
          </p>
        </Field>

        <div className="space-y-4">
          <Field label="Call to action">
            <p className="text-[14px]">{brief.cta}</p>
          </Field>
          <Field label="Sound">
            <p className="text-[14px]">{brief.soundIdea}</p>
          </Field>
          <Field label="Best post time">
            <p className="font-mono text-[13px]">{brief.bestPostTime}</p>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <div className="mt-2 text-foreground/90">{children}</div>
    </div>
  );
}
