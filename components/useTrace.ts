"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceLine } from "./TraceStream";

export type ScriptedLine = TraceLine & { after: number };

/**
 * Drives a TraceStream from client-side phase state.
 *
 * /api/brand, /api/brief and /api/process are plain JSON, not SSE, so there is
 * no server stream to follow. The scripted lines are honest approximations of
 * the work actually happening (crawl → LLM, transcribe → cut → render) and the
 * run always *ends* on lines derived from the real response, so the last thing
 * on screen is a fact rather than a guess.
 */
export function useTrace() {
  const [lines, setLines] = useState<TraceLine[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (script: ScriptedLine[]) => {
      clear();
      setLines([]);
      for (const { after, kind, msg } of script) {
        timers.current.push(
          setTimeout(() => setLines((l) => [...l, { kind, msg }]), after),
        );
      }
    },
    [clear],
  );

  /** Stop the script and land the real numbers. */
  const finish = useCallback(
    (...msgs: string[]) => {
      clear();
      setLines((l) => [...l, ...msgs.map((msg) => ({ kind: "ok" as const, msg }))]);
    },
    [clear],
  );

  const warn = useCallback(
    (msg: string) => {
      clear();
      setLines((l) => [...l, { kind: "warn", msg }]);
    },
    [clear],
  );

  const fail = useCallback(
    (msg: string) => {
      clear();
      setLines((l) => [...l, { kind: "error", msg }]);
    },
    [clear],
  );

  const reset = useCallback(() => {
    clear();
    setLines([]);
  }, [clear]);

  return { lines, start, finish, warn, fail, reset };
}
