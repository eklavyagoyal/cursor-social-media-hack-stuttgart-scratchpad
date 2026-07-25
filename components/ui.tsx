import type { ReactNode } from "react";

/** Small mono caps label. The only "chrome" in the app. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`font-mono text-[11px] uppercase tracking-[0.22em] text-ash-400 ${className}`}
    >
      {children}
    </div>
  );
}

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
      <div className="rule mb-6 pt-6">
        <Label className="pt-5">{label}</Label>
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
          <span key={i} className="text-brand" style={{ background: "rgba(193,68,14,0.12)" }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
