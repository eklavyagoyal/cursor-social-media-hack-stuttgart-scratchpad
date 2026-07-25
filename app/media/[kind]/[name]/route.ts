import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the clips /api/process writes at request time.
 *
 * `public/` is indexed during `next build`, so a file written afterwards is a 404
 * in production no matter that it sits on disk — which silently broke the preview,
 * the download link and Instagram's fetch of the finished reel, while every local
 * `next dev` run looked fine.
 *
 * Range support is not optional here: ReelPreview skips the cut regions by setting
 * `video.currentTime`, and a browser will not seek against a server that answers
 * every request with the whole file.
 */

const DIRS = {
  uploads: path.join(process.cwd(), "public", "uploads"),
  renders: path.join(process.cwd(), "public", "renders"),
} as const;

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
};

/** Slugs we mint are `clip-<base36>`; anything else is someone probing. */
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

const notFound = () => new Response("Not found", { status: 404 });

type Located = { file: string; size: number; type: string };

async function locate(kind: string, name: string): Promise<Located | null> {
  if (!Object.hasOwn(DIRS, kind)) return null;
  if (!SAFE_NAME.test(name) || name.includes("..")) return null;

  const dir = DIRS[kind as keyof typeof DIRS];
  const file = path.resolve(dir, name);

  // The regex already excludes separators, so this only guards against a future
  // loosening of it — cheap enough to keep.
  if (path.dirname(file) !== path.resolve(dir)) return null;

  try {
    const info = await stat(file);
    if (!info.isFile()) return null;
    return {
      file,
      size: info.size,
      type: CONTENT_TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

/** Single `bytes=` range only; that is all a media element ever sends. */
function parseRange(header: string, size: number): { start: number; end: number } | "unsatisfiable" {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return "unsatisfiable";

  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;

  if (rawStart === "") {
    // Suffix form: the last N bytes.
    const length = Number(rawEnd);
    if (!rawEnd || !Number.isFinite(length) || length <= 0) return "unsatisfiable";
    start = Math.max(0, size - length);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return "unsatisfiable";
  if (start > end || start >= size) return "unsatisfiable";
  return { start, end: Math.min(end, size - 1) };
}

function baseHeaders(found: Located): Record<string, string> {
  return {
    "content-type": found.type,
    "accept-ranges": "bytes",
    // Uploads are per-session artifacts and get swept, but seeking re-requests the
    // same bytes constantly, so let the browser keep them for the demo's duration.
    "cache-control": "private, max-age=3600",
  };
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ kind: string; name: string }> },
) {
  const { kind, name } = await ctx.params;
  const found = await locate(kind, name);
  if (!found) return notFound();

  const rangeHeader = req.headers.get("range");

  if (!rangeHeader) {
    const stream = createReadStream(found.file);
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      status: 200,
      headers: { ...baseHeaders(found), "content-length": String(found.size) },
    });
  }

  const range = parseRange(rangeHeader, found.size);
  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { ...baseHeaders(found), "content-range": `bytes */${found.size}` },
    });
  }

  const stream = createReadStream(found.file, { start: range.start, end: range.end });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
    status: 206,
    headers: {
      ...baseHeaders(found),
      "content-length": String(range.end - range.start + 1),
      "content-range": `bytes ${range.start}-${range.end}/${found.size}`,
    },
  });
}

/** Players probe with HEAD before deciding whether they can seek. */
export async function HEAD(
  _req: Request,
  ctx: { params: Promise<{ kind: string; name: string }> },
) {
  const { kind, name } = await ctx.params;
  const found = await locate(kind, name);
  if (!found) return notFound();

  return new Response(null, {
    status: 200,
    headers: { ...baseHeaders(found), "content-length": String(found.size) },
  });
}
