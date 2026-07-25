"use client";

import { useRef, useState } from "react";
import { BriefPanel } from "@/components/BriefPanel";
import { ClipSlots } from "@/components/ClipSlots";
import { CutTimeline } from "@/components/CutTimeline";
import { GenomeCard } from "@/components/GenomeCard";
import { MarketPanel } from "@/components/MarketPanel";
import { ReelPreview } from "@/components/ReelPreview";
import { ShipPanel } from "@/components/ShipPanel";
import { ShootBreakdown } from "@/components/ShootBreakdown";
import { type RailStep, StepRail, type StepStatus } from "@/components/StepRail";
import { useTrace } from "@/components/useTrace";
import type { BrandGenome } from "@/lib/brand";
import type { ContentAngle, MarketResearch } from "@/lib/research";
import type { ProcessResult, PublishResult, ShootBrief } from "@/lib/types";

type Phase = "idle" | "running" | "done" | "error";

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;

/** A step nobody can reach yet reads as locked, whatever its own phase says. */
const rail = (phase: Phase, reachable: boolean): StepStatus =>
  reachable ? phase : "locked";

/** SDK errors are written for whoever wrote the SDK. Nobody on stage should read one. */
function humanError(msg: string): string {
  if (/authentication|api[- _]?key|unauthor/i.test(msg)) {
    return "No valid API key configured — check .env.local.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(msg)) {
    return "Can't reach the service — network down?";
  }
  if (/rate.?limit|429/i.test(msg)) return "Rate limit hit. Give it a moment.";
  return msg;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [genome, setGenome] = useState<BrandGenome | null>(null);
  const [brandPhase, setBrandPhase] = useState<Phase>("idle");
  const [brandSkipped, setBrandSkipped] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [researchPhase, setResearchPhase] = useState<Phase>("idle");
  const [angle, setAngle] = useState<string | undefined>();

  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState<ShootBrief | null>(null);
  const [briefPhase, setBriefPhase] = useState<Phase>("idle");
  const [adjust, setAdjust] = useState("");

  /**
   * One entry per shot, positionally. Sparse on purpose: an operator films the
   * hook first and the rest later, and index is what maps a take to its shot.
   */
  const [clipFiles, setClipFiles] = useState<(File | null)[]>([]);

  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processPhase, setProcessPhase] = useState<Phase>("idle");
  const [aggressive, setAggressive] = useState(false);

  const [caption, setCaption] = useState("");
  const [publishPhase, setPublishPhase] = useState<Phase>("idle");
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [publicUrl, setPublicUrl] = useState<string | undefined>();

  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const secretInput = useRef<HTMLInputElement | null>(null);

  const brandTrace = useTrace();
  const researchTrace = useTrace();
  const briefTrace = useTrace();
  const processTrace = useTrace();

  /**
   * Uncontrolled, and refilled when the node attaches rather than on page mount —
   * the publish step is rendered conditionally, so a mount effect would run while
   * this input does not exist yet and the value would be lost on reload.
   * sessionStorage, not localStorage: the secret shouldn't outlive the browser
   * session on a laptop that gets passed around at a hackathon.
   */
  function attachSecretInput(el: HTMLInputElement | null) {
    secretInput.current = el;
    if (el && !el.value) el.value = sessionStorage.getItem("publishSecret") ?? "";
  }

  /** Brand step resolved one way or another — the topic input is live. */
  const briefUnlocked = Boolean(genome) || brandSkipped;

  function applyGenome(g: BrandGenome, { thenResearch = true } = {}) {
    setGenome(g);
    setBrandPhase("done");
    brandTrace.finish(
      `Voice: ${g.voice.adjectives.join(" · ")}`,
      `${g.voice.petPhrases.length} phrases lifted verbatim`,
      `Palette: ${g.look.palette.slice(0, 3).join("  ")}`,
    );
    // The second crawl follows straight on: knowing how they sound is only half
    // the input, the other half is what the niche is posting this month.
    if (thenResearch) void runResearch(g);
  }

  async function runResearch(g: BrandGenome) {
    setResearchPhase("running");
    setResearch(null);
    setAngle(undefined);
    researchTrace.start([
      { after: 0, kind: "step", msg: "Deriving search queries from the brand profile" },
      { after: 1800, kind: "step", msg: "Searching short video in the niche · last month" },
      { after: 5000, kind: "ok", msg: "Instagram · TikTok · YouTube searched" },
      { after: 6500, kind: "step", msg: "Deriving angles, hooks and cut order" },
    ]);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ genome: g }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Market scan failed.");
      const r = json.research as MarketResearch;
      setResearch(r);
      setResearchPhase("done");
      researchTrace.finish(
        `${r.queries.length} queries · ${r.references.length} findings`,
        ...(r.angles.length ? [`${r.angles.length} angles with a cut order`] : []),
      );
      if (r.degraded) researchTrace.warn(r.degraded);
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      researchTrace.fail(msg);
      setResearchPhase("error");
    }
  }

  function pickAngle(a: ContentAngle) {
    setAngle(a.angle);
    setTopic(a.angle);
  }

  async function cachedGenome(): Promise<BrandGenome> {
    const res = await fetch("/demo/genome.json");
    if (!res.ok) throw new Error("No cached brand profile available.");
    return (await res.json()) as BrandGenome;
  }

  /** The cached path — works with no keys and no network. */
  async function loadDemo() {
    setError(null);
    setNotice(null);
    try {
      const [g, m, b, r] = await Promise.all([
        fetch("/demo/genome.json").then((res) => (res.ok ? res.json() : null)),
        fetch("/demo/research.json").then((res) => (res.ok ? res.json() : null)),
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
      if (m) {
        setResearch(m);
        setResearchPhase("done");
        researchTrace.reset();
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
      setError("No cached run available. Run `npm run seed:demo` once.");
    }
  }

  async function readBrand() {
    if (!url.trim()) return;
    setBrandPhase("running");
    setError(null);
    setNotice(null);
    brandTrace.start([
      { after: 0, kind: "step", msg: "Reading the brand's surface" },
      { after: 1400, kind: "ok", msg: "Home page read" },
      { after: 3200, kind: "ok", msg: "Found subpages carrying the voice" },
      { after: 4600, kind: "step", msg: "Extracting tone of voice" },
      { after: 9000, kind: "step", msg: "Collecting phrases verbatim" },
      { after: 16000, kind: "step", msg: "Deriving hook patterns" },
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
          brandTrace.warn("Page returns almost no readable text — loaded the cached profile");
          const g = await cachedGenome();
          setNotice(
            "That site only renders in the browser, so there's almost nothing to read server-side. Carrying on with the cached brand profile.",
          );
          // No auto-research on the fallback: if the crawl just failed, firing a
          // second one at the same network is the wrong reflex. There's a button.
          applyGenome(g, { thenResearch: false });
          return;
        }
        throw new Error(json.error ?? "Reading the brand failed.");
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
      setNotice("Loaded the cached brand profile — not read from this URL.");
      applyGenome(g, { thenResearch: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * Builds the script, or revises the one on screen.
   *
   * A revision keeps the takes already attached to shots that survived it — the
   * operator asked to change one shot, not to lose the footage for the other five.
   */
  async function makeBrief({ adjustment }: { adjustment?: string } = {}) {
    if (!topic.trim()) return;
    const revising = Boolean(adjustment?.trim() && brief);

    setBriefPhase("running");
    setError(null);
    briefTrace.start(
      revising
        ? [
            { after: 0, kind: "step", msg: "Reading the current script" },
            { after: 700, kind: "ok", msg: `Change: ${adjustment!.trim().slice(0, 60)}` },
            { after: 1600, kind: "step", msg: "Revising only what the change touches" },
            { after: 6000, kind: "step", msg: "Re-checking shot lengths" },
          ]
        : [
      { after: 0, kind: "step", msg: "Sharpening the topic" },
      ...(genome
        ? ([{ after: 900, kind: "ok", msg: `Grounded in: ${genome.name}` }] as const)
        : []),
      ...(research?.references.length
        ? ([
            {
              after: 1300,
              kind: "ok",
              msg: `${research.references.length} findings from the niche in context`,
            },
          ] as const)
        : []),
            { after: 2000, kind: "step", msg: "Writing the hook" },
            { after: 5000, kind: "step", msg: "Shots and camera direction" },
            { after: 9000, kind: "step", msg: "Caption and hashtags" },
          ],
    );
    try {
      // Both blocks verbatim: lib/brand.ts renders how they sound, lib/research.ts
      // renders what the niche is doing. Neither is reformatted here.
      const context =
        [genome?.context, research?.context].filter(Boolean).join("\n\n") || undefined;

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          context,
          ...(revising ? { adjust: adjustment!.trim(), previous: brief } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Building the brief failed.");
      const b = json.brief as ShootBrief;
      setBrief(b);
      setCaption(`${b.caption}\n\n${b.hashtags.join(" ")}`);
      // Positional: a revision that kept shots 1-4 keeps their footage attached.
      setClipFiles((prev) =>
        Array.from({ length: b.shots.length }, (_, i) => (revising ? prev[i] ?? null : null)),
      );
      if (revising) setAdjust("");
      setBriefPhase("done");
      briefTrace.finish(
        `${b.shots.length} shots · ${b.totalSeconds}s`,
        revising ? "revised, footage kept" : `Caption + ${b.hashtags.length} hashtags`,
      );
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      briefTrace.fail(msg);
      setError(msg);
      setBriefPhase("error");
    }
  }

  /**
   * Sends the shoot. One take or twelve takes the same route — the server cuts each
   * on its own and joins them in the order they are passed.
   */
  async function processClips(takes: { file: File; label?: string }[]) {
    if (takes.length === 0) return;
    const many = takes.length > 1;
    const totalBytes = takes.reduce((sum, t) => sum + t.file.size, 0);

    setProcessPhase("running");
    setError(null);
    setResult(null);
    setPublishResults([]);
    processTrace.start([
      {
        after: 0,
        kind: "ok",
        msg: many
          ? `${takes.length} clips · ${mb(totalBytes)}`
          : `${takes[0].file.name} · ${mb(totalBytes)}`,
      },
      { after: 600, kind: "step", msg: "Extracting audio" },
      { after: 3000, kind: "step", msg: "Transcribing, with word timings" },
      { after: 12000, kind: "step", msg: "Finding silence and filler words" },
      { after: 18000, kind: "step", msg: "Grouping captions" },
      {
        after: 24000,
        kind: "step",
        msg: many ? "Rendering each take, captions burned in" : "Rendering mp4, burning in captions",
      },
      ...(many
        ? ([{ after: 34000, kind: "step", msg: "Joining the takes into one reel" }] as const)
        : []),
    ]);
    try {
      const form = new FormData();
      // Repeated field, in shoot order — the server reads it with getAll.
      for (const t of takes) form.append("video", t.file);
      form.append("aggressive", String(aggressive));
      if (many) form.append("labels", JSON.stringify(takes.map((t) => t.label ?? "")));

      const res = await fetch("/api/process", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Processing failed.");
      const r = json as ProcessResult;
      setResult(r);
      setProcessPhase("done");

      const cut = r.clips.reduce((sum, c) => sum + c.plan.removedSeconds, 0);
      const groups = r.clips.reduce((sum, c) => sum + c.captions.length, 0);
      processTrace.finish(
        `${cut.toFixed(1)}s cut · ${r.render.duration.toFixed(1)}s final length`,
        `${groups} caption groups`,
        many
          ? `${r.clips.length} takes joined · ${mb(r.render.sizeBytes)}`
          : `mp4 ${r.render.width}×${r.render.height} · ${mb(r.render.sizeBytes)}`,
      );
    } catch (e) {
      const msg = humanError(e instanceof Error ? e.message : String(e));
      processTrace.fail(msg);
      setError(msg);
      setProcessPhase("error");
    }
  }

  /** The shoot list, compacted to the takes that actually exist. */
  function attachedTakes(): { file: File; label?: string }[] {
    if (!brief) return [];
    return clipFiles.flatMap((file, i) =>
      file ? [{ file, label: brief.shots[i]?.label }] : [],
    );
  }

  async function publish() {
    if (!result) return;
    setPublishPhase("running");
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-publish-secret": secretInput.current?.value ?? "",
        },
        body: JSON.stringify({ slug: result.slug, caption }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Publishing failed.");
      setPublishResults(json.results ?? []);
      setPublicUrl(json.publicUrl);
      setPublishPhase("done");
    } catch (e) {
      setError(humanError(e instanceof Error ? e.message : String(e)));
      setPublishPhase("error");
    }
  }

  const posted = publishResults.filter((r) => r.status === "posted").length;
  const attachedCount = clipFiles.filter(Boolean).length;

  const steps: RailStep[] = [
    {
      id: "brand",
      n: 1,
      title: "Brand",
      status: brandSkipped && !genome ? "done" : brandPhase,
      lines: brandTrace.lines,
      summary: genome
        ? `${genome.name} · ${genome.voice.adjectives.slice(0, 2).join(" · ")}`
        : brandSkipped
          ? "skipped"
          : undefined,
    },
    {
      id: "market",
      n: 2,
      title: "Market",
      status: rail(researchPhase, Boolean(genome)),
      lines: researchTrace.lines,
      summary: research
        ? `${research.references.length} findings · ${research.angles.length} angles`
        : undefined,
    },
    {
      id: "brief",
      n: 3,
      title: "Brief",
      status: rail(briefPhase, briefUnlocked),
      lines: briefTrace.lines,
      summary: brief ? `${brief.shots.length} shots · ${brief.totalSeconds}s` : undefined,
    },
    {
      id: "shoot",
      n: 4,
      title: "Shoot & upload",
      status: rail(processPhase, briefUnlocked),
      lines: processTrace.lines,
      summary: result
        ? result.clips.length > 1
          ? `${result.clips.length} takes · ${mb(result.render.sizeBytes)}`
          : `${mb(result.render.sizeBytes)} · ${result.render.height}p`
        : brief && attachedCount > 0
          ? `${attachedCount} of ${brief.shots.length} clips ready`
          : undefined,
    },
    {
      id: "cut",
      n: 5,
      title: "Cut & captions",
      status: rail(result ? "done" : "idle", briefUnlocked),
      summary: result
        ? `${result.clips
            .reduce((sum, c) => sum + c.plan.removedSeconds, 0)
            .toFixed(1)}s cut · ${result.clips.reduce((sum, c) => sum + c.captions.length, 0)} groups`
        : undefined,
    },
    {
      id: "post",
      n: 6,
      title: "Publish",
      status: rail(publishPhase, Boolean(result)),
      summary: publishResults.length ? `${posted}/${publishResults.length} posted` : undefined,
    },
  ];

  // What the operator should look at: whatever is moving, then whatever broke,
  // then the first thing still waiting for them.
  const activeId =
    steps.find((s) => s.status === "running")?.id ??
    steps.find((s) => s.status === "error")?.id ??
    steps.find((s) => s.status === "idle")?.id ??
    steps[steps.length - 1].id;

  function jumpTo(id: string) {
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="container-app flex flex-col gap-8 py-8 lg:flex-row lg:gap-12 lg:py-12">
      {/* The rail stays put while the work scrolls — on a laptop the whole run is
          visible at once, which is the point of moving status out of the flow. */}
      <aside className="lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)] lg:w-[280px] lg:shrink-0">
        <div className="flex h-full flex-col gap-7 overflow-y-auto border-border no-scrollbar lg:border-r lg:pr-6">
          <div>
            <p className="display text-[17px]">Legacy Creator</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Brief → Shoot → Post
            </p>
          </div>

          <StepRail steps={steps} activeId={activeId} onJump={jumpTo} />

          <button
            type="button"
            onClick={loadDemo}
            className="mt-auto shrink-0 self-start font-mono text-[10.5px] text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
          >
            load the cached demo run
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-border pb-9">
          <h1 className="display max-w-3xl text-[34px] sm:text-[44px]">
            You film 30 seconds.
            <br />
            <span className="text-muted">The machine does the rest.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            One link is enough: we read how your brand actually sounds, and turn it into a script
            with camera direction. Shoot it on your phone and upload — silences and filler words
            come out, captions get burned in, and the reel goes to the business account.
          </p>
        </header>

        {error && (
          <div className="mt-8 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-red-300">
            {error}
          </div>
        )}

        <Step
          id="brand"
          n={1}
          title="Brand"
          hint="One URL. We read the site and pull out how you sound — tone of voice, your own phrases, your colours."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && readBrand()}
              placeholder="legacy-ai.de"
              spellCheck={false}
              className="max-w-xl flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60"
            />
            <button
              type="button"
              onClick={readBrand}
              disabled={brandPhase === "running" || !url.trim()}
              className="rounded-lg bg-accent px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {brandPhase === "running" ? "reading…" : "Read the brand"}
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
                  skip this, just work from a topic
                </button>
              )}
              {brandPhase === "error" && (
                <button
                  type="button"
                  onClick={useCachedGenome}
                  className="font-mono text-[11px] text-accent underline decoration-dotted underline-offset-4 hover:text-foreground"
                >
                  use the cached brand profile
                </button>
              )}
            </div>
          )}

          {notice && (
            <p className="mt-5 max-w-2xl border-l-2 border-accent/50 pl-4 text-[13px] leading-relaxed text-muted">
              {notice}
            </p>
          )}

          {genome && (
            <div className="mt-8">
              <GenomeCard genome={genome} />
            </div>
          )}
        </Step>

        {genome && (
          <Step
            id="market"
            n={2}
            title="Market"
            hint="A second crawl: what the niche is actually posting right now — and what that means for format, cut order and length."
          >
            {researchPhase !== "running" && (
              <button
                type="button"
                onClick={() => genome && runResearch(genome)}
                className="rounded-lg border border-border bg-surface px-6 py-3 text-[15px] transition-colors hover:border-accent/60"
              >
                {research ? "Scan again" : "Scan the niche"}
              </button>
            )}

            {research && (
              <div className="mt-8">
                <MarketPanel research={research} chosen={angle} onPick={pickAngle} />
              </div>
            )}
          </Step>
        )}

        {briefUnlocked && (
          <div className="animate-rise">
            <Step
              id="brief"
              n={3}
              title="Brief"
              hint={
                genome
                  ? `What's it about? The script gets written in ${genome.name}'s voice${
                      research?.references.length ? ", against what the niche is running" : ""
                    }.`
                  : "What's it about? That becomes a script."
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && makeBrief()}
                  placeholder="e.g. Why our espresso blend gets roasted three times"
                  className="max-w-xl flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60"
                />
                <button
                  type="button"
                  onClick={() => makeBrief()}
                  disabled={briefPhase === "running" || !topic.trim()}
                  className="rounded-lg bg-accent px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {briefPhase === "running" ? "thinking…" : brief ? "Rebuild" : "Build the script"}
                </button>
              </div>

              {brief && (
                <div className="mt-6 border-l-2 border-accent/40 pl-4">
                  <p className="eyebrow">Adjust the template</p>
                  <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
                    Change it in words instead of rebuilding it. Shots the change does not
                    mention stay as they are, and clips already attached to them stay attached.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={adjust}
                      onChange={(e) => setAdjust(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && adjust.trim() && makeBrief({ adjustment: adjust })
                      }
                      placeholder="e.g. make shot 3 shorter, add a shot of the machine running"
                      className="max-w-xl flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60"
                    />
                    <button
                      type="button"
                      onClick={() => makeBrief({ adjustment: adjust })}
                      disabled={briefPhase === "running" || !adjust.trim()}
                      className="rounded-lg border border-accent/50 px-5 py-2.5 text-[14px] text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
                    >
                      {briefPhase === "running" ? "revising…" : "Apply change"}
                    </button>
                  </div>
                </div>
              )}

              {brief && (
                <div className="mt-8">
                  <BriefPanel brief={brief} petPhrases={genome?.voice.petPhrases} />
                </div>
              )}
            </Step>

            <Step
              id="shoot"
              n={4}
              title="Shoot & upload"
              hint={
                brief
                  ? "Phone, vertical, one take per shot. Mistakes don't matter — they get cut out, and each take is cut on its own before they're joined."
                  : "Phone, vertical, one take. Mistakes don't matter — they get cut out."
              }
            >
              <label className="flex cursor-pointer items-center gap-3 font-mono text-[12px] text-muted">
                <input
                  type="checkbox"
                  checked={aggressive}
                  onChange={(e) => setAggressive(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Also cut discourse fillers (“like”, “basically”, “you know”) — tighter, but riskier
              </label>

              {brief && brief.shots.length > 0 && (
                <div className="mt-6">
                  <ClipSlots
                    shots={brief.shots}
                    files={clipFiles}
                    disabled={processPhase === "running"}
                    onPick={(i, file) =>
                      setClipFiles((prev) => {
                        const next = [...prev];
                        next[i] = file;
                        return next;
                      })
                    }
                    onClear={(i) =>
                      setClipFiles((prev) => {
                        const next = [...prev];
                        next[i] = null;
                        return next;
                      })
                    }
                  />
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-4">
                {brief && brief.shots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void processClips(attachedTakes())}
                    disabled={processPhase === "running" || attachedCount === 0}
                    className="rounded-lg bg-accent px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {processPhase === "running"
                      ? "processing…"
                      : attachedCount === 0
                        ? "Attach a clip to start"
                        : attachedCount === 1
                          ? "Cut this clip"
                          : `Cut and join ${attachedCount} clips`}
                  </button>
                )}

                {/* The escape hatch: no script, or a single clip that ignores one. */}
                <input
                  ref={fileInput}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void processClips([{ file: f }]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={processPhase === "running"}
                  className={
                    brief && brief.shots.length > 0
                      ? "font-mono text-[12px] text-muted underline decoration-dotted underline-offset-4 hover:text-foreground disabled:opacity-40"
                      : "rounded-lg border border-border bg-surface px-6 py-3 text-[15px] transition-colors hover:border-accent/60 disabled:opacity-40"
                  }
                >
                  {brief && brief.shots.length > 0
                    ? "or process one single clip instead"
                    : processPhase === "running"
                      ? "processing…"
                      : "Choose raw video"}
                </button>

                {processPhase === "running" && (
                  <p className="font-mono text-[12px] text-muted">
                    Roughly as long as the footage — progress runs on the left.
                  </p>
                )}
              </div>
            </Step>

            <Step
              id="cut"
              n={5}
              title="Cut & captions"
              hint={
                result && result.clips.length > 1
                  ? "Each take was cut on its own, then joined in script order."
                  : "The preview runs without rendering — the mp4 sits next to it."
              }
            >
              {!result ? (
                <p className="font-mono text-[12px] text-muted">No clip processed yet.</p>
              ) : result.clips.length > 1 ? (
                <ShootBreakdown clips={result.clips} render={result.render} />
              ) : (
                <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
                  <ReelPreview
                    rawUrl={result.rawUrl}
                    plan={result.plan}
                    captions={result.captions}
                  />

                  <div className="min-w-0 space-y-6">
                    <CutTimeline plan={result.plan} />

                    <div className="grid grid-cols-2 gap-3 font-mono text-[11px] sm:grid-cols-4">
                      <Stat
                        label="Source"
                        value={`${result.source.width}×${result.source.height}`}
                      />
                      <Stat
                        label="Export"
                        value={`${result.render.width}×${result.render.height}`}
                      />
                      <Stat label="Captions" value={`${result.captions.length} groups`} />
                      <Stat label="File size" value={mb(result.render.sizeBytes)} />
                    </div>

                    <div>
                      <p className="eyebrow">Transcript · {result.transcript.languageCode}</p>
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
                      open the rendered mp4 ↗
                    </a>
                  </div>
                </div>
              )}
            </Step>

            <Step
              id="post"
              n={6}
              title="Publish"
              hint="Instagram fetches the file itself, so it goes public before the post."
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Caption — the first line has to work before the “more”."
                className="w-full max-w-3xl resize-y rounded-lg border border-border bg-surface px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60"
              />

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  ref={attachSecretInput}
                  type="password"
                  onChange={(e) => sessionStorage.setItem("publishSecret", e.target.value)}
                  placeholder="Operator approval"
                  autoComplete="off"
                  className="w-52 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-[13px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60"
                />
                <button
                  type="button"
                  onClick={publish}
                  disabled={!result || publishPhase === "running"}
                  className="rounded-lg bg-live px-6 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {publishPhase === "running" ? "uploading…" : "Post to Instagram"}
                </button>
              </div>

              <p className="mt-3 max-w-xl font-mono text-[11px] leading-relaxed text-muted">
                Two locks, because the caption comes from the client and lands on a real account:
                PUBLISH_ENABLED and PUBLISH_SECRET, both in .env.local.
              </p>

              {publishResults.length > 0 && (
                <div className="mt-6">
                  <ShipPanel results={publishResults} publicUrl={publicUrl} />
                </div>
              )}
            </Step>
          </div>
        )}
      </main>
    </div>
  );
}

function Step({
  id,
  n,
  title,
  hint,
  children,
}: {
  id: string;
  n: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`step-${id}`} className="scroll-mt-8 border-b border-border py-9">
      <p className="eyebrow">Step {String(n).padStart(2, "0")}</p>
      <h2 className="display mt-2 text-[26px]">{title}</h2>
      <p className="mt-2 mb-6 max-w-2xl text-[14px] leading-relaxed text-muted">{hint}</p>
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
