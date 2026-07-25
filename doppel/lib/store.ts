import type { BrandGenome, Drop } from "./types";

/**
 * Server-side store for generated artifacts.
 *
 * This is a security boundary, not a cache. /api/publish looks Drops up by id
 * here instead of accepting one from the request body — otherwise the endpoint
 * is a public "post anything to my accounts" API, and every imageUrl in it is
 * an SSRF vector. The client only ever sends an id it was given.
 *
 * ponytail: a Map. One process, one day. Swap for Neon if state must outlive a
 * redeploy — the interface below is the whole surface that would need to change.
 */
const drops = new Map<string, Drop>();
const genomes = new Map<string, BrandGenome>();

const CAP = 200; // bound the memory; oldest out first

function put<T>(m: Map<string, T>, id: string, v: T) {
  m.set(id, v);
  if (m.size > CAP) m.delete(m.keys().next().value!);
}

export const rememberDrop = (d: Drop) => put(drops, d.id, d);
export const recallDrop = (id: string) => drops.get(id);

export const rememberGenome = (g: BrandGenome) => put(genomes, g.id, g);
export const recallGenome = (id: string) => genomes.get(id);

/** Only these hosts may be fetched server-side when attaching media. */
const MEDIA_HOSTS = [/\.fal\.media$/, /\.fal\.ai$/, /\.vercel-storage\.com$/, /\.public\.blob\.vercel-storage\.com$/];

/**
 * Media URLs are fetched by our server (Bluesky needs the bytes), so they are a
 * trust boundary even when they came from our own pipeline. Allowlist by host.
 */
export function assertFetchableMedia(raw: string): URL {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error(`media: refusing non-https url (${u.protocol})`);
  if (!MEDIA_HOSTS.some((re) => re.test(u.hostname))) {
    throw new Error(`media: host not allowlisted (${u.hostname})`);
  }
  return u;
}
