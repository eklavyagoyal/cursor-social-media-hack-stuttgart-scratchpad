"use client";

import { useRef, useState } from "react";
import { BriefPanel } from "@/components/BriefPanel";
import { CutTimeline } from "@/components/CutTimeline";
import { GenomeCard } from "@/components/GenomeCard";
import { ReelPreview } from "@/components/ReelPreview";
import { ShipPanel } from "@/components/ShipPanel";
import { TraceStream } from "@/components/TraceStream";
import { useTrace } from "@/components/useTrace";
import type { BrandGenome } from "@/lib/brand";
import type { ProcessResult, PublishResult, ShootBrief } from "@/lib/types";

type Phase = "idle" | "running" | "done" | "error";

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;

/** SDK errors are written for whoever wrote the SDK. Nobody on stage should read one. */
function humanError(msg: string): string {
  if (/authentication|api[- _]?key|unauthor/i.test(msg)) {
    return "Kein gültiger API-Schlüssel konfiguriert — siehe .env.local.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(msg)) {
    return "Keine Verbindung zum Dienst — Netz weg?";
  }
  if (/rate.?limit|429/i.test(msg)) return "Rate-Limit erreicht. Kurz warten.";
  return msg;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [genome, setGenome] = useState<BrandGenome | null>(null);
  const [brandPhase, setBrandPhase] = useState<Phase>("idle");
  const [brandSkipped, setBrandSkipped] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const brandTrace = useTrace();
  const briefTrace = useTrace();
  const processTrace = useTrace();

  /** Brand step resolved one way or another — the topic input is live. */
  const briefUnlocked = Boolean(genome) || brandSkipped;

  function applyGenome(g: BrandGenome) {
    setGenome(g);
    setBrandPhase("done");
    brandTrace.finish(
      `Stimme: ${g.voice.adjectives.join(" · ")}`,
      `${g.voice.petPhrases.length} Formulierungen wörtlich übernommen`,
      `Palette: ${g.look.palette.slice(0, 3).join("  ")}`,
    );
  }

  async function cachedGenome(): Promise<BrandGenome> {
    const res = await fetch("/demo/genome.json");
    if (!res.ok) throw new Error("Kein gespeichertes Marken-Profil vorhanden.");
    return (await res.json()) as BrandGenome;
  }

  /** The cached path — works with no keys and no network. */
  async function loadDemo() {
    setError(null);
    setNotice(null);
    try {
      const [g, b, r] = await Promise.all([
        fetch("/demo/genome.json").then((res) => (res.ok ? res.json() : null)),
        fetch("/demo/brief.json").then((res) => res.json()),
        fetch("/demo/result.json").then((res) => res.json()),
      ]);
      if (g) {
        setGenome(g);
        setUrl(g.sourceUrl ?? "");
        setBrandPhase("done");
        brandTrace.reset();
      } else {
        setBrandSkipped(true);
      }
      setBrief(b);
      setTopic(b.topic);
      setCaption(`${b.caption}\n\n${b.hashtags.join(" ")}`);
      setBriefPhase("done");
      briefTrace.reset();
      setResult(r);
      setProcessPhase("done");
      processTrace.reset();
    } catch {
      setError("Kein Demo-Pfad vorhanden. Einmal `npm run seed:demo` laufen lassen.");
    }
  }

  async function readBrand() {
    if (!url.trim()) return;
    setBrandPhase("running");
    setError(null);
    setNotice(null);
    brandTrace.start([
      { after: 0, kind: "step", msg: "Marken-Oberfläche lesen" },
      { after: 1400, kind: "ok", msg: "Startseite gelesen" },
      { after: 3200, kind: "ok", msg: "Unterseiten mit Tonalität gefunden" },
      { after: 4600, kind: "step", msg: "Tonalität extrahieren" },
      { after: 9000, kind: "step", msg: "Formulierungen wörtlich sammeln" },
      { after: 16000, kind: "step", msg: "Hook-Muster ableiten" },
    ]);

    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();

      if (!res.ok) {
        // 422 + thin: a JS-only or blocking site. Expected, not a crash.
        if (json.thin) {
          brandTrace.warn("Seite liefert kaum lesbaren Text — gespeichertes Profil geladen");
          const g = await cachedGenome();
          setNotice(
            "Die Seite rendert erst im Browser, da kommt beim Lesen fast nichts an. Wir arbeiten mit dem gespeicherten Marken-Profil weiter.",
          );
          applyGenome(g);
          return;
        }
        throw new Error(json.error ?? "Marke lesen fehlgeschlagen.");
      }

      applyGenome(json.genome as BrandGenome);
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      brandTrace.fail(msg);
      setError(msg);
      setBrandPhase("error");
    }
  }

  /** Stage recovery: any brand failure is one click away from the cached profile. */
  async function useCachedGenome() {
    try {
      const g = await cachedGenome();
      setError(null);
      setNotice("Gespeichertes Marken-Profil geladen — nicht von dieser URL gelesen.");
      applyGenome(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function makeBrief() {
    if (!topic.trim()) return;
    setBriefPhase("running");
    setError(null);
    briefTrace.start([
      { after: 0, kind: "step", msg: "Thema schärfen" },
      ...(genome
        ? ([{ after: 900, kind: "ok", msg: `Grundierung: ${genome.name}` }] as const)
        : []),
      { after: 2000, kind: "step", msg: "Hook schreiben" },
      { after: 5000, kind: "step", msg: "Shots und Kameraführung" },
      { after: 9000, kind: "step", msg: "Caption und Hashtags" },
    ]);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Verbatim — the grounding block is pre-rendered by lib/brand.ts.
        body: JSON.stringify({ topic, context: genome?.context }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Briefing fehlgeschlagen.");
      const b = json.brief as ShootBrief;
      setBrief(b);
      setCaption(`${b.caption}\n\n${b.hashtags.join(" ")}`);
      setBriefPhase("done");
      briefTrace.finish(
        `${b.shots.length} Shots · ${b.totalSeconds}s`,
        `Caption + ${b.hashtags.length} Hashtags`,
      );
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      briefTrace.fail(msg);
      setError(msg);
      setBriefPhase("error");
    }
  }

  async function processVideo(file: File) {
    setProcessPhase("running");
    setError(null);
    setResult(null);
    setPublishResults([]);
    processTrace.start([
      { after: 0, kind: "ok", msg: `${file.name} · ${mb(file.size)}` },
      { after: 600, kind: "step", msg: "Ton extrahieren" },
      { after: 3000, kind: "step", msg: "transkribieren, mit Wort-Timings" },
      { after: 12000, kind: "step", msg: "Stille und Füllwörter suchen" },
      { after: 18000, kind: "step", msg: "Untertitel gruppieren" },
      { after: 24000, kind: "step", msg: "mp4 rendern, Untertitel einbrennen" },
    ]);
    try {
      const form = new FormData();
      form.append("video", file);
      form.append("aggressive", String(aggressive));

      const res = await fetch("/api/process", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Verarbeitung fehlgeschlagen.");
      const r = json as ProcessResult;
      setResult(r);
      setProcessPhase("done");
      processTrace.finish(
        `${r.plan.removedSeconds.toFixed(1)}s raus · ${r.plan.outDuration.toFixed(1)}s Endlänge`,
        `${r.captions.length} Untertitel-Gruppen`,
        `mp4 ${r.render.width}×${r.render.height} · ${mb(r.render.sizeBytes)}`,
      );
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      processTrace.fail(msg);
      setError(msg);
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
      setError(humanError(e instanceof Error ? e.message : String(e)));
      setPublishPhase("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Marke → Vorgabe → Dreh → Post
        </p>
        <h1 className="display mt-3 text-4xl leading-[1.1] sm:text-5xl">
          Du filmst 30 Sekunden.
          <br />
          <span className="text-muted">Den Rest macht die Maschine.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Ein Link genügt: wir lesen, wie deine Marke wirklich klingt. Daraus wird ein Drehbuch mit
          Kameraanweisungen. Film es mit dem Handy, lad es hoch — Stillen und Füllwörter fliegen
          raus, Untertitel werden eingebrannt, und der Reel geht auf den Business-Account.
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

      <Step
        n={1}
        title="Marke"
        hint="Eine URL. Wir lesen die Seite und ziehen raus, wie ihr klingt — Tonalität, eigene Formulierungen, Farben."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && readBrand()}
            placeholder="legacy-ai.de"
            spellCheck={false}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent/60"
          />
          <button
            type="button"
            onClick={readBrand}
            disabled={brandPhase === "running" || !url.trim()}
            className="rounded-xl bg-accent px-6 py-3 text-[15px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {brandPhase === "running" ? "liest…" : "Marke lesen"}
          </button>
        </div>

        {brandPhase !== "running" && !genome && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {!briefUnlocked && (
              <button
                type="button"
                onClick={() => setBrandSkipped(true)}
                className="font-mono text-[11px] text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                überspringen, nur mit einem Thema arbeiten
              </button>
            )}
            {brandPhase === "error" && (
              <button
                type="button"
                onClick={useCachedGenome}
                className="font-mono text-[11px] text-accent underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                gespeichertes Marken-Profil verwenden
              </button>
            )}
          </div>
        )}

        {brandTrace.lines.length > 0 && (
          <div className="mt-6">
            <TraceStream lines={brandTrace.lines} running={brandPhase === "running"} />
          </div>
        )}

        {notice && (
          <p className="mt-5 max-w-2xl border-l-2 border-accent/50 pl-4 text-[13px] leading-relaxed text-muted">
            {notice}
          </p>
        )}

        {genome && (
          <div className="mt-10">
            <GenomeCard genome={genome} />
          </div>
        )}
      </Step>

      {briefUnlocked && (
        <div className="animate-rise">
          <Step
            n={2}
            title="Vorgabe"
            hint={
              genome
                ? `Was soll rein? Claude schreibt das Drehbuch in der Tonalität von ${genome.name}.`
                : "Was soll rein? Claude macht daraus ein Drehbuch."
            }
          >
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

            {briefTrace.lines.length > 0 && (
              <div className="mt-6">
                <TraceStream lines={briefTrace.lines} running={briefPhase === "running"} />
              </div>
            )}

            {brief && (
              <div className="mt-8">
                <BriefPanel brief={brief} petPhrases={genome?.voice.petPhrases} />
              </div>
            )}
          </Step>

          <Step
            n={3}
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
                  Dauert etwa so lang wie der Clip.
                </p>
              )}
            </div>

            {processTrace.lines.length > 0 && (
              <div className="mt-6">
                <TraceStream lines={processTrace.lines} running={processPhase === "running"} />
              </div>
            )}
          </Step>

          <Step
            n={4}
            title="Schnitt & Untertitel"
            hint="Vorschau läuft ohne Rendern — das mp4 liegt daneben."
          >
            {!result ? (
              <p className="font-mono text-[12px] text-muted">Noch kein Clip verarbeitet.</p>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                <ReelPreview rawUrl={result.rawUrl} plan={result.plan} captions={result.captions} />

                <div className="space-y-6">
                  <CutTimeline plan={result.plan} />

                  <div className="grid grid-cols-2 gap-3 font-mono text-[11px] sm:grid-cols-4">
                    <Stat label="Quelle" value={`${result.source.width}×${result.source.height}`} />
                    <Stat label="Export" value={`${result.render.width}×${result.render.height}`} />
                    <Stat label="Untertitel" value={`${result.captions.length} Gruppen`} />
                    <Stat label="Dateigröße" value={mb(result.render.sizeBytes)} />
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

          <Step
            n={5}
            title="Posten"
            hint="Instagram holt die Datei selbst ab, deshalb geht sie vorher öffentlich online."
          >
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
        </div>
      )}
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
