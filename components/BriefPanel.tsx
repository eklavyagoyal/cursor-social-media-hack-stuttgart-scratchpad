import type { ShootBrief } from "@/lib/types";

export function BriefPanel({ brief }: { brief: ShootBrief }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Hook · erste 2 Sekunden</p>
        <p className="display mt-1.5 text-2xl leading-snug text-foreground">{brief.hook}</p>
      </div>

      <ol className="space-y-3">
        {brief.shots.map((shot) => (
          <li
            key={shot.n}
            className="rounded-xl border border-border bg-surface-2/60 p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
                Shot {shot.n} · {shot.label}
              </p>
              <p className="font-mono text-[11px] text-muted">{shot.seconds}s</p>
            </div>

            <p className="mt-2 text-[15px] leading-relaxed text-foreground">„{shot.say}“</p>

            <p className="mt-2 flex gap-2 text-[13px] leading-relaxed text-muted">
              <span aria-hidden className="text-muted/60">▤</span>
              <span>{shot.camera}</span>
            </p>

            {shot.onScreen && (
              <p className="mt-2 inline-block rounded-md bg-foreground/8 px-2 py-1 font-mono text-[11px] text-foreground/80">
                Einblendung: {shot.onScreen}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Caption">
          <p className="whitespace-pre-line text-[14px] leading-relaxed">{brief.caption}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-accent/90">
            {brief.hashtags.join(" ")}
          </p>
        </Field>

        <div className="space-y-4">
          <Field label="Call to action">
            <p className="text-[14px]">{brief.cta}</p>
          </Field>
          <Field label="Ton">
            <p className="text-[14px]">{brief.soundIdea}</p>
          </Field>
          <Field label="Beste Postingzeit">
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
