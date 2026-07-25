import type { Trace } from "./types";

/**
 * Wrap an async job in an SSE response. The job gets a `say` function; every
 * call lands as a line in the trace UI.
 *
 * ponytail: no framework, no deps. 20 lines covers every streaming route.
 */
export function sseResponse(job: (say: (e: Trace) => void) => Promise<void>) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      const say = (e: Trace) => {
        try {
          c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          /* client hung up mid-write; nothing useful to do */
        }
      };
      try {
        await job(say);
      } catch (err) {
        // No silent failures: the UI must be able to fall back visibly.
        console.error(JSON.stringify({ evt: "sse.fail", err: String(err) }));
        say({ t: "error", msg: err instanceof Error ? err.message : String(err) });
      } finally {
        say({ t: "done" });
        c.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
    },
  });
}

/** Client-side reader for the above. Returns when the stream closes. */
export async function readSSE(res: Response, on: (e: Trace) => void) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("no response body");
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const p of parts) {
      const line = p.split("\n").find((l) => l.startsWith("data: "));
      if (line) on(JSON.parse(line.slice(6)) as Trace);
    }
  }
}
