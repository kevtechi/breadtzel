"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Entry, RoundState } from "@/lib/types";
import { rankPriceIsRight } from "@/lib/format";

const POLL_MS = 1500;

const EMPTY: RoundState = {
  roundId: "",
  phase: "open",
  actualWeight: null,
  winnerId: null,
  entries: [],
  live: false,
};

async function postOperator(action: string, actualWeight?: number) {
  await fetch("/api/operator", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, actualWeight }),
  });
}

/**
 * Server-backed lottery state. Polls /api/state and exposes the operator
 * mutations (which hit /api/operator and then refetch for snappiness).
 */
export function useLottery({ onNewEntry }: { onNewEntry?: (e: Entry) => void } = {}) {
  const [state, setState] = useState<RoundState>(EMPTY);

  const onNewRef = useRef(onNewEntry);
  useEffect(() => {
    onNewRef.current = onNewEntry;
  }, [onNewEntry]);

  // Poll loop. New entry ids (after the first load) fire onNewEntry.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const seen = new Set<string>();
    let initialized = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (res.ok && alive) {
          const next = (await res.json()) as RoundState;
          if (initialized) {
            for (const e of next.entries) {
              if (!seen.has(e.id)) onNewRef.current?.(e);
            }
          }
          for (const e of next.entries) seen.add(e.id);
          initialized = true;
          setState(next);
        }
      } catch {
        /* transient network error; retry on next tick */
      } finally {
        if (alive) timer = setTimeout(tick, POLL_MS);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.ok) setState((await res.json()) as RoundState);
    } catch {
      /* ignore */
    }
  }, []);

  const beginSpin = useCallback(
    async (weight: number) => {
      await postOperator("spin", weight);
      await refetch();
    },
    [refetch],
  );

  const completeReveal = useCallback(async () => {
    await postOperator("reveal");
    await refetch();
  }, [refetch]);

  const reset = useCallback(async () => {
    await postOperator("reset");
    await refetch();
  }, [refetch]);

  const ranked = useMemo(() => {
    if (state.actualWeight != null) {
      return rankPriceIsRight(state.entries, state.actualWeight);
    }
    return [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
  }, [state.entries, state.actualWeight]);

  const winner = useMemo(
    () => state.entries.find((e) => e.id === state.winnerId) ?? null,
    [state.entries, state.winnerId],
  );

  return { state, ranked, winner, beginSpin, completeReveal, reset };
}
