"use client";

import { formatBread, formatGrams } from "@/lib/format";
import type { Entry } from "@/lib/types";

const MAX_ROWS = 12;

export function GuessFeed({ entries }: { entries: Entry[] }) {
  // Newest first, capped to what fits on screen.
  const rows = [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ROWS);

  return (
    <section className="panel flex h-full flex-col overflow-hidden p-[1.4rem]">
      <h2 className="mb-[1rem] flex items-center gap-[0.6rem] font-display text-[1.6rem] uppercase tracking-[0.12em] text-gold-bright">
        <span className="inline-block h-[0.8rem] w-[0.8rem] animate-pulse rounded-full bg-berry" />
        Live guesses
      </h2>
      <ul className="flex flex-1 flex-col gap-[0.6rem] overflow-hidden">
        {rows.map((e, i) => (
          <li
            key={e.id}
            className="flex items-center justify-between rounded-[0.7rem] border border-gold/15 bg-velvet-deep/50 px-[1rem] py-[0.7rem]"
            style={{
              animation: i === 0 ? "pop-in 0.45s ease-out" : undefined,
              opacity: 1 - i * 0.045,
            }}
          >
            <span className="truncate pr-[0.8rem] text-[1.25rem] text-cream/90">
              {e.displayName}
            </span>
            <span className="flex shrink-0 items-baseline gap-[0.8rem]">
              <span className="tabular text-[1.5rem] font-bold text-gold-bright">
                {formatGrams(e.weightGuess)}
              </span>
              <span className="tabular text-[1rem] text-mint/80">
                {formatBread(e.amountBread)} BREAD
              </span>
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-[1.2rem] text-cream/40">Waiting for guesses…</li>
        )}
      </ul>
    </section>
  );
}
