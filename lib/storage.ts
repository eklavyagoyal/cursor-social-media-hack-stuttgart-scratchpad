import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

/**
 * Instagram fetches the video itself, so the file must sit behind a public HTTPS
 * URL — you cannot POST bytes to the Graph API. Vercel Blob is the shortest path
 * to that from a laptop; PUBLIC_BASE_URL covers the tunnel case.
 */
export async function toPublicUrl(filePath: string, localUrlPath: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const bytes = await readFile(filePath);
    const blob = await put(path.basename(filePath), bytes, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const base = process.env.PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      "No public upload possible: set BLOB_READ_WRITE_TOKEN (Vercel Blob) " +
        "or PUBLIC_BASE_URL (e.g. a cloudflared tunnel to localhost:3000).",
    );
  }
  return new URL(localUrlPath, base).toString();
}
