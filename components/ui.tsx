import type { ReactNode } from "react";

/** Small mono caps label. The only "chrome" in the app. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[11px] uppercase tracking-[0.22em] text-muted ${className}`}>
      {children}
    </div>
  );
}

/** A hairline rule and a label — hierarchy without boxing everything in. */
export function Section({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="rule mb-5 pt-4">
        <Label>{label}</Label>
      </div>
      {children}
    </section>
  );
}

/** Hook patterns: the {placeholders} are the whole point, so they get the accent. */
export function Templated({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{[^}]+\})/g).map((part, i) =>
        part.startsWith("{") && part.endsWith("}") ? (
          <span
            key={i}
            className="rounded-sm px-1 text-accent"
            style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
