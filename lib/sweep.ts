import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Bounded disk for the render scratch dirs.
 *
 * A 30s phone clip leaves ~40-90 MB behind per run (raw upload + audio + mp4),
 * and nothing deleted it. On a shared Hetzner box that fills up quietly.
 *
 * Deleting per-request is tempting but wrong: the UI keeps showing rawUrl and
 * the rendered clip after /api/process returns, and when Vercel Blob is not
 * configured the rendered file IS the public URL Instagram fetches from. So
 * instead: sweep anything older than a grace window, on the way in.
 *
 * ponytail: an age sweep on request, not a cron or a queue. One mechanism,
 * bounded disk, and it cannot delete a file the current request still needs.
 */

const GRACE_MS = Number(process.env.SWEEP_AFTER_MINUTES ?? 30) * 60_000;

/** Kept relative so a misconfigured env can never point this at something real. */
const SWEEP_DIRS = ["public/uploads", "public/renders", "tmp/audio"] as const;

export async function sweepOldArtifacts(now = Date.now()): Promise<{ deleted: number; freedBytes: number }> {
  let deleted = 0;
  let freedBytes = 0;

  for (const rel of SWEEP_DIRS) {
    const dir = path.join(process.cwd(), rel);
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      continue; // dir not created yet — nothing to sweep
    }

    for (const name of entries) {
      const target = path.join(dir, name);
      try {
        const s = await stat(target);
        if (now - s.mtimeMs < GRACE_MS) continue;
        freedBytes += s.isDirectory() ? 0 : s.size;
        await rm(target, { recursive: true, force: true });
        deleted++;
      } catch {
        // raced with another request deleting it, or permissions — either way
        // a failed sweep must never fail the actual job.
      }
    }
  }

  if (deleted) {
    console.error(
      JSON.stringify({ evt: "sweep", deleted, freedMB: +(freedBytes / 1e6).toFixed(1) }),
    );
  }
  return { deleted, freedBytes };
}
