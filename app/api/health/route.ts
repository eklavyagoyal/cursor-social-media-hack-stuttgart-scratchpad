import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const run = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness, not liveness.
 *
 * A container without ffmpeg boots fine, serves the landing page fine, and then
 * fails the moment anyone uploads a video — which on a demo day means it fails in
 * front of the room. So readiness checks the one dependency the product cannot
 * work without, and Coolify refuses to route traffic when it's missing.
 *
 * Config presence is reported but does NOT fail the probe: a missing API key is
 * a degraded mode we can still demo from the cached path, not a broken container.
 */

// Binaries can't appear at runtime, so probe once and remember.
let binaries: { ffmpeg: boolean; ffprobe: boolean } | null = null;

async function checkBinaries() {
  if (binaries) return binaries;
  const has = async (bin: string) => {
    try {
      await run(bin, ["-version"], { timeout: 4000 });
      return true;
    } catch {
      return false;
    }
  };
  binaries = { ffmpeg: await has("ffmpeg"), ffprobe: await has("ffprobe") };
  return binaries;
}

export async function GET() {
  const bins = await checkBinaries();
  const ready = bins.ffmpeg && bins.ffprobe;

  const body = {
    status: ready ? "ok" : "unhealthy",
    // hard requirements — these gate the probe
    render: bins,
    // informational: degraded but demoable
    config: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      publishEnabled: process.env.PUBLISH_ENABLED === "true",
      publishSecret: Boolean(process.env.PUBLISH_SECRET),
      instagram: Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN),
      publicUpload: Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.PUBLIC_BASE_URL),
    },
  };

  if (!ready) {
    console.error(JSON.stringify({ evt: "health.unready", render: bins }));
  }

  return NextResponse.json(body, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
