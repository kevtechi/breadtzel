"use client";

import { CONFIG } from "@/lib/config";
import { formatBread, potTotal } from "@/lib/format";
import type { Entry } from "@/lib/types";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[0.2rem]">
      <span
        className="tabular text-[3.4rem] font-bold leading-none"
        style={{ color: accent ?? "var(--color-cream)" }}
      >
        {value}
      </span>
      <span className="text-[1rem] uppercase tracking-[0.22em] text-cream/55">
        {label}
      </span>
    </div>
  );
}

export function StatsBar({ entries }: { entries: Entry[] }) {
  const pot = potTotal(entries);
  const avg =
    entries.length > 0
      ? entries.reduce((s, e) => s + e.weightGuess, 0) / entries.length
      : 0;

  return (
    <div className="panel flex items-center justify-around px-[2rem] py-[1.4rem]">
      <Stat
        label={`pot · ${CONFIG.tokenSymbol}`}
        value={formatBread(pot)}
        accent="var(--color-gold-bright)"
      />
      <div className="h-[3rem] w-px bg-gold/25" />
      <Stat label="entries" value={String(entries.length)} />
      <div className="h-[3rem] w-px bg-gold/25" />
      <Stat label="avg guess" value={`${Math.round(avg)}g`} />
    </div>
  );
}
