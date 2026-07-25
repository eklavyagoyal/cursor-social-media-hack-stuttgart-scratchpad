/**
 * Proves the demo path works before the demo, not during it.
 *
 * The generative routes need API keys and will 401 without them — that is fine
 * and expected. What must never break is the cached path the stage falls back
 * to, plus the one security property that matters on a publicly deployed app:
 * a stranger cannot post to our Instagram account.
 *
 *   npm run dev
 *   npx tsx scripts/smoke.mts              # or BASE=https://... npx tsx scripts/smoke.mts
 */
const BASE = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");

type Row = { name: string; ok: boolean; detail: string };
const rows: Row[] = [];

async function check(name: string, fn: () => Promise<string>) {
  try {
    rows.push({ name, ok: true, detail: await fn() });
  } catch (e) {
    rows.push({ name, ok: false, detail: e instanceof Error ? e.message : String(e) });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** Field-shape assertions, so a fixture that drifts from lib/types.ts fails here. */
const isStr = (v: unknown) => typeof v === "string" && v.length > 0;
const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isArr = (v: unknown, min = 1) => Array.isArray(v) && v.length >= min;

function need(obj: Record<string, unknown>, path: string, ok: boolean) {
  assert(ok, `${path} fehlt oder hat den falschen Typ`);
}

async function getJson(path: string): Promise<Record<string, any>> {
  const res = await fetch(`${BASE}${path}`);
  assert(res.ok, `GET ${path} → ${res.status}`);
  try {
    return (await res.json()) as Record<string, any>;
  } catch {
    throw new Error(`GET ${path} ist kein gültiges JSON`);
  }
}

// ── 1. readiness ────────────────────────────────────────────────────────────
await check("health · ffmpeg + ffprobe", async () => {
  const res = await fetch(`${BASE}/api/health`);
  const body = (await res.json()) as {
    status?: string;
    render?: { ffmpeg?: boolean; ffprobe?: boolean };
    config?: Record<string, boolean>;
  };
  assert(body.render?.ffmpeg === true, "ffmpeg fehlt im PATH — Rendern unmöglich");
  assert(body.render?.ffprobe === true, "ffprobe fehlt im PATH");
  assert(body.status === "ok", `status=${body.status} (erwartet "ok")`);
  assert(res.status === 200, `HTTP ${res.status}`);
  const off = Object.entries(body.config ?? {})
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return off.length ? `ok · ohne Key: ${off.join(", ")}` : "ok · alle Keys gesetzt";
});

// ── 2. cached fixtures the UI reads ─────────────────────────────────────────
await check("demo/genome.json · BrandGenome", async () => {
  const g = await getJson("/demo/genome.json");
  need(g, "sourceUrl", isStr(g.sourceUrl));
  need(g, "name", isStr(g.name));
  need(g, "voice.adjectives", isArr(g.voice?.adjectives, 3));
  need(g, "voice.petPhrases", isArr(g.voice?.petPhrases, 4));
  need(g, "voice.forbidden", Array.isArray(g.voice?.forbidden));
  need(g, "voice.sentenceStyle", isStr(g.voice?.sentenceStyle));
  need(g, "voice.emojiPolicy", ["none", "sparing", "heavy"].includes(g.voice?.emojiPolicy));
  need(g, "look.palette", isArr(g.look?.palette, 5));
  assert(
    g.look.palette.every((h: unknown) => typeof h === "string" && /^#[0-9a-f]{6}$/i.test(h)),
    "look.palette enthält etwas, das kein #RRGGBB ist",
  );
  need(g, "look.typographyVibe", isStr(g.look?.typographyVibe));
  need(g, "look.imageryStyle", isStr(g.look?.imageryStyle));
  need(g, "substance.pillars", isArr(g.substance?.pillars, 4));
  need(g, "substance.icp", isStr(g.substance?.icp));
  need(g, "substance.proofPoints", Array.isArray(g.substance?.proofPoints));
  need(g, "hooks", isArr(g.hooks, 3));
  // The whole point of the brand step: this string is what grounds the brief.
  need(g, "context", isStr(g.context));
  return `${g.name} · ${g.voice.petPhrases.length} Formulierungen · ${g.look.palette.length} Farben`;
});

await check("demo/brief.json · ShootBrief", async () => {
  const b = await getJson("/demo/brief.json");
  for (const f of ["id", "topic", "hook", "caption", "cta", "soundIdea", "bestPostTime", "createdAt"]) {
    need(b, f, isStr(b[f]));
  }
  need(b, "totalSeconds", isNum(b.totalSeconds));
  need(b, "hashtags", isArr(b.hashtags));
  need(b, "shots", isArr(b.shots));
  b.shots.forEach((s: Record<string, unknown>, i: number) => {
    need(b, `shots[${i}].n`, isNum(s.n));
    need(b, `shots[${i}].label`, isStr(s.label));
    need(b, `shots[${i}].seconds`, isNum(s.seconds));
    need(b, `shots[${i}].say`, isStr(s.say));
    need(b, `shots[${i}].camera`, isStr(s.camera));
  });
  return `"${b.topic}" · ${b.shots.length} Shots · ${b.totalSeconds}s`;
});

await check("demo/result.json · ProcessResult", async () => {
  const r = await getJson("/demo/result.json");
  need(r, "slug", isStr(r.slug));
  need(r, "rawUrl", isStr(r.rawUrl));
  for (const f of ["duration", "width", "height"]) need(r, `source.${f}`, isNum(r.source?.[f]));
  need(r, "source.hasAudio", typeof r.source?.hasAudio === "boolean");
  need(r, "transcript.text", typeof r.transcript?.text === "string");
  need(r, "transcript.languageCode", isStr(r.transcript?.languageCode));
  need(r, "transcript.words", isArr(r.transcript?.words));
  for (const f of ["sourceDuration", "outDuration", "removedSeconds"]) {
    need(r, `plan.${f}`, isNum(r.plan?.[f]));
  }
  need(r, "plan.keep", isArr(r.plan?.keep));
  need(r, "plan.cuts", Array.isArray(r.plan?.cuts));
  need(r, "captions", isArr(r.captions));
  r.captions.forEach((c: Record<string, unknown>, i: number) => {
    need(r, `captions[${i}]`, isNum(c.start) && isNum(c.end) && isStr(c.text));
  });
  for (const f of ["path", "publicUrl"]) need(r, `render.${f}`, isStr(r.render?.[f]));
  for (const f of ["width", "height", "duration", "sizeBytes"]) {
    need(r, `render.${f}`, isNum(r.render?.[f]));
  }
  assert(r.render.width === 1080 && r.render.height === 1920, "Export ist nicht 1080×1920");
  return `${r.plan.sourceDuration.toFixed(1)}s → ${r.plan.outDuration.toFixed(1)}s · ${r.captions.length} Untertitel`;
});

// ── 3. the media the cached path actually plays ─────────────────────────────
for (const [label, path] of [
  ["demo/demo.mp4 · gerendert", "/demo/demo.mp4"],
  ["demo/demo-raw.mp4 · Rohclip", "/demo/demo-raw.mp4"],
] as const) {
  await check(label, async () => {
    const res = await fetch(`${BASE}${path}`);
    assert(res.ok, `GET ${path} → ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    assert(type.includes("video/mp4"), `content-type ist "${type}", erwartet video/mp4`);
    const bytes = (await res.arrayBuffer()).byteLength;
    assert(bytes > 100_000, `nur ${(bytes / 1024).toFixed(0)} KB (erwartet >100 KB)`);
    return `${(bytes / 1024).toFixed(0)} KB · ${type}`;
  });
}

// ── 4. security regression: publishing is not open to the internet ──────────
await check("publish ohne Secret → 401", async () => {
  const res = await fetch(`${BASE}/api/publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "demo", caption: "smoke test — darf nie rausgehen" }),
  });
  assert(
    res.status === 401,
    `HTTP ${res.status} statt 401 — die Route ist offen, jeder kann auf den echten Account posten`,
  );
  return "401, wie es sein muss";
});

// ── report ──────────────────────────────────────────────────────────────────
const width = Math.max(...rows.map((r) => r.name.length));
console.log(`\nSmoke-Test · ${BASE}\n`);
for (const r of rows) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}  ${r.detail}`);
}

const failed = rows.filter((r) => !r.ok).length;
console.log(`\n${rows.length - failed}/${rows.length} bestanden${failed ? ` · ${failed} FEHLER` : ""}\n`);
process.exit(failed ? 1 : 0);
