"use client";

import { formatGrams, shortenAddress } from "@/lib/format";
import type { Entry } from "@/lib/types";

interface LeaderboardProps {
  /** Entries pre-ranked by the parent (closeness once revealed). */
  ranked: Entry[];
  actualWeight: number | null;
  winnerId: string | null;
}

const TOP_N = 6;
const BUCKET_SIZE = 20; // grams per histogram bucket

function Histogram({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-[1.2rem] text-cream/40">Guesses will appear here…</p>
    );
  }
  const buckets = new Map<number, number>();
  for (const e of entries) {
    const b = Math.floor(e.weightGuess / BUCKET_SIZE) * BUCKET_SIZE;
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const max = Math.max(...sorted.map(([, c]) => c));

  return (
    <div className="flex flex-1 flex-col justify-end gap-[0.5rem]">
      <div className="flex flex-1 items-stretch justify-around gap-[0.5rem]">
        {sorted.map(([bucket, count]) => (
          <div
            key={bucket}
            className="flex h-full flex-1 flex-col items-center justify-end gap-[0.4rem]"
          >
            <span className="tabular text-[1.1rem] text-gold-bright">{count}</span>
            <div
              className="w-full rounded-t-[0.4rem] bg-gradient-to-t from-pretzel-dark to-gold"
              style={{ height: `${(count / max) * 100}%`, minHeight: "0.4rem" }}
            />
            <span className="tabular text-[0.95rem] text-cream/50">
              {bucket}–{bucket + BUCKET_SIZE}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-[0.4rem] text-center text-[1rem] uppercase tracking-[0.2em] text-cream/45">
        grams
      </p>
    </div>
  );
}

export function Leaderboard({
  ranked,
  actualWeight,
  winnerId,
}: LeaderboardProps) {
  const revealed = actualWeight != null;

  return (
    <section className="panel flex h-full flex-col overflow-hidden p-[1.4rem]">
      <h2 className="mb-[1rem] font-display text-[1.6rem] uppercase tracking-[0.12em] text-gold-bright">
        {revealed ? "Closest without going over" : "The spread"}
      </h2>

      {!revealed ? (
        <Histogram entries={ranked} />
      ) : (
        <ol className="flex flex-1 flex-col gap-[0.6rem]">
          {ranked.slice(0, TOP_N).map((e, i) => {
            const isWinner = e.id === winnerId;
            const over = e.weightGuess > (actualWeight ?? 0);
            const delta = e.weightGuess - (actualWeight ?? 0);
            return (
              <li
                key={e.id}
                className="flex items-center gap-[1rem] rounded-[0.7rem] px-[1rem] py-[0.7rem]"
                style={{
                  border: isWinner
                    ? "0.12rem solid var(--color-gold-bright)"
                    : "0.08rem solid rgba(234,96,35,0.18)",
                  background: isWinner
                    ? "linear-gradient(90deg, rgba(234,96,35,0.28), rgba(234,96,35,0.05))"
                    : "rgba(11,20,16,0.5)",
                  opacity: over ? 0.5 : 1,
                  animation: isWinner ? "win-flash 1.3s ease-in-out infinite" : undefined,
                }}
              >
                <span className="tabular w-[2.4rem] text-[1.6rem] font-bold text-gold-bright">
                  {isWinner ? "👑" : i + 1}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="truncate text-[1.3rem] text-cream/95">
                    {e.displayName}
                  </span>
                  <span className="tabular text-[0.95rem] text-cream/45">
                    {shortenAddress(e.address)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="tabular text-[1.5rem] font-bold text-cream">
                    {formatGrams(e.weightGuess)}
                  </span>
                  <span
                    className="tabular text-[1rem]"
                    style={{ color: over ? "var(--color-berry)" : "var(--color-mint)" }}
                  >
                    {over ? `over +${formatGrams(delta)}` : `under −${formatGrams(-delta)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
