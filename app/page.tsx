"use client";

import { useRef, useState } from "react";
import { BriefPanel } from "@/components/BriefPanel";
import { CutTimeline } from "@/components/CutTimeline";
import { ReelPreview } from "@/components/ReelPreview";
import { ShipPanel } from "@/components/ShipPanel";
import type { ProcessResult, PublishResult, ShootBrief } from "@/lib/types";

type Phase = "idle" | "running" | "done" | "error";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState<ShootBrief | null>(null);
  const [briefPhase, setBriefPhase] = useState<Phase>("idle");

  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processPhase, setProcessPhase] = useState<Phase>("idle");
  const [aggressive, setAggressive] = useState(false);

  const [caption, setCaption] = useState("");
  const [publishPhase, setPublishPhase] = useState<Phase>("idle");
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [publicUrl, setPublicUrl] = useState<string | undefined>();

  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** The cached path — works with no keys and no network. */
  async function loadDemo() {
    setError(null);
    try {
      const [b, r] = await Promise.all([
        fetch("/demo/brief.json").then((res) => res.json()),
        fetch("/demo/result.json").then((res) => res.json()),
      ]);
      setBrief(b);
      setTopic(b.topic);
      setCaption(`${b.caption}\n\n${b.hashtags.join(" ")}`);
      setBriefPhase("done");
      setResult(r);
      setProcessPhase("done");
    } catch {
      setError("Kein Demo-Pfad vorhanden. Einmal `npm run seed:demo` laufen lassen.");
    }
  }

  async function makeBrief() {
    if (!topic.trim()) return;
    setBriefPhase("running");
    setError(null);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Briefing fehlgeschlagen.");
      setBrief(json.brief);
      setCaption(`${json.brief.caption}\n\n${json.brief.hashtags.join(" ")}`);
      setBriefPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBriefPhase("error");
    }
  }

  async function processVideo(file: File) {
    setProcessPhase("running");
    setError(null);
    setResult(null);
    setPublishResults([]);
    try {
      const form = new FormData();
      form.append("video", file);
      form.append("aggressive", String(aggressive));

      const res = await fetch("/api/process", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Verarbeitung fehlgeschlagen.");
      setResult(json);
      setProcessPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProcessPhase("error");
    }
  }

  async function publish() {
    if (!result) return;
    setPublishPhase("running");
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: result.slug, caption }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Posten fehlgeschlagen.");
      setPublishResults(json.results ?? []);
      setPublicUrl(json.publicUrl);
      setPublishPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPublishPhase("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Vorgabe → Dreh → Post
        </p>
        <h1 className="display mt-3 text-4xl leading-[1.1] sm:text-5xl">
          Du filmst 30 Sekunden.
          <br />
          <span className="text-muted">Den Rest macht die Maschine.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Sag ein Thema, du bekommst ein Drehbuch mit Kameraanweisungen. Film es mit dem Handy,
          lad es hoch — Stillen und Füllwörter fliegen raus, Untertitel werden eingebrannt,
          und der Reel geht auf den Business-Account.
        </p>
        <button
          type="button"
          onClick={loadDemo}
          className="mt-5 font-mono text-[11px] text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
        >
          gespeicherten Demo-Durchlauf laden
        </button>
      </header>

      {error && (
        <div className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-red-300">
          {error}
        </div>
      )}

      <Step n={1} title="Vorgabe" hint="Was soll rein? Claude macht daraus ein Drehbuch.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && makeBrief()}
            placeholder="z.B. Warum unsere Espressomischung dreimal geröstet wird"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent/60"
          />
          <button
            type="button"
            onClick={makeBrief}
            disabled={briefPhase === "running" || !topic.trim()}
            className="rounded-xl bg-accent px-6 py-3 text-[15px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {briefPhase === "running" ? "denkt nach…" : "Drehbuch bauen"}
          </button>
        </div>

        {brief && (
          <div className="mt-8">
            <BriefPanel brief={brief} />
          </div>
        )}
      </Step>

      <Step
        n={2}
        title="Dreh & Upload"
        hint="Handy, vertikal, einmal durchsprechen. Fehler sind egal — die schneidet er raus."
      >
        <label className="flex cursor-pointer items-center gap-3 font-mono text-[12px] text-muted">
          <input
            type="checkbox"
            checked={aggressive}
            onChange={(e) => setAggressive(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Auch Diskursfüller schneiden („also“, „quasi“, „irgendwie“) — schärfer, aber riskanter
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            ref={fileInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processVideo(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={processPhase === "running"}
            className="rounded-xl border border-border bg-surface px-6 py-3 text-[15px] transition-colors hover:border-accent/60 disabled:opacity-40"
          >
            {processPhase === "running" ? "verarbeitet…" : "Rohvideo auswählen"}
          </button>

          {processPhase === "running" && (
            <p className="font-mono text-[12px] text-muted">
              Ton extrahieren → transkribieren → Schnitt planen → rendern. Dauert etwa so lang wie
              der Clip.
            </p>
          )}
        </div>
      </Step>

      <Step n={3} title="Schnitt & Untertitel" hint="Vorschau läuft ohne Rendern — das mp4 liegt daneben.">
        {!result ? (
          <p className="font-mono text-[12px] text-muted">Noch kein Clip verarbeitet.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <ReelPreview
              rawUrl={result.rawUrl}
              plan={result.plan}
              captions={result.captions}
            />

            <div className="space-y-6">
              <CutTimeline plan={result.plan} />

              <div className="grid grid-cols-2 gap-3 font-mono text-[11px] sm:grid-cols-4">
                <Stat label="Quelle" value={`${result.source.width}×${result.source.height}`} />
                <Stat label="Export" value={`${result.render.width}×${result.render.height}`} />
                <Stat label="Untertitel" value={`${result.captions.length} Gruppen`} />
                <Stat
                  label="Dateigröße"
                  value={`${(result.render.sizeBytes / 1_048_576).toFixed(1)} MB`}
                />
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Transkript · {result.transcript.languageCode}
                </p>
                <p className="mt-2 max-h-28 overflow-y-auto text-[14px] leading-relaxed text-foreground/80">
                  {result.transcript.text || "—"}
                </p>
              </div>

              <a
                href={result.render.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-mono text-[12px] text-foreground underline decoration-dotted underline-offset-4 hover:text-accent"
              >
                gerendertes mp4 öffnen ↗
              </a>
            </div>
          </div>
        )}
      </Step>

      <Step n={4} title="Posten" hint="Instagram holt die Datei selbst ab, deshalb geht sie vorher öffentlich online.">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Caption — erste Zeile muss vor dem „mehr“ funktionieren."
          className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-[14px] leading-relaxed outline-none placeholder:text-muted/70 focus:border-accent/60"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={publish}
            disabled={!result || publishPhase === "running"}
            className="rounded-xl bg-live px-6 py-3 text-[15px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {publishPhase === "running" ? "lädt hoch…" : "Auf Instagram posten"}
          </button>
          <p className="font-mono text-[11px] text-muted">
            Sicherheitsschalter: PUBLISH_ENABLED in .env.local
          </p>
        </div>

        {publishResults.length > 0 && (
          <div className="mt-6">
            <ShipPanel results={publishResults} publicUrl={publicUrl} />
          </div>
        )}
      </Step>
    </main>
  );
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[12px] text-accent">{String(n).padStart(2, "0")}</span>
        <h2 className="display text-xl">{title}</h2>
      </div>
      <p className="mb-5 max-w-xl text-[13px] leading-relaxed text-muted">{hint}</p>
      {children}
    </section>
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
