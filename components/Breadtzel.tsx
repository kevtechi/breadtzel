"use client";

import { useCallback, useRef, useState } from "react";
import { formatBread, formatGrams, potTotal, shortenAddress } from "@/lib/format";
import { CONFIG } from "@/lib/config";
import type { PaymentInfo } from "@/lib/types";
import { useLottery } from "@/components/useLottery";
import { useSound } from "@/components/useSound";
import { SlotMachine } from "@/components/SlotMachine";
import { GuessFeed } from "@/components/GuessFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsBar } from "@/components/StatsBar";
import { SubmitPanel } from "@/components/SubmitPanel";
import { Confetti } from "@/components/Confetti";
import { PretzelBurst } from "@/components/PretzelBurst";

const BURST_MS = 3200;

function Marquee({ live }: { live: boolean }) {
  return (
    <header className="panel flex items-center justify-between px-[2.5rem] py-[1.2rem]">
      <div className="flex gap-[0.6rem]">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="bulb" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <h1 className="text-shine font-display text-[4.5rem] uppercase leading-none tracking-[0.06em]">
        🥨 Breadtzel
      </h1>
      <p className="max-w-[22rem] text-right text-[1.25rem] leading-snug text-cream/70">
        Guess the pretzel&rsquo;s weight in {CONFIG.tokenSymbol}.{" "}
        <span className="text-gold-bright">Closest without going over wins.</span>
        {!live && (
          <span className="ml-[0.5rem] rounded-full border border-cream/25 px-[0.5rem] text-[0.85rem] uppercase tracking-[0.1em] text-cream/50">
            demo
          </span>
        )}
      </p>
    </header>
  );
}

function WinnerBanner({
  name,
  address,
  guess,
  actual,
  pot,
}: {
  name: string;
  address: string;
  guess: number;
  actual: number;
  pot: number;
}) {
  return (
    <div
      className="panel flex flex-col items-center gap-[0.4rem] px-[2.5rem] py-[1.4rem]"
      style={{ borderColor: "var(--color-gold-bright)", animation: "pop-in 0.6s ease-out" }}
    >
      <span className="font-display text-[1.4rem] uppercase tracking-[0.2em] text-gold-bright">
        👑 Winner
      </span>
      <span className="text-[2.8rem] font-bold leading-none text-cream">{name}</span>
      <span className="tabular text-[1.05rem] text-cream/50">{shortenAddress(address)}</span>
      <span className="tabular mt-[0.4rem] text-[1.4rem] text-mint">
        Guessed {formatGrams(guess)} · under by {formatGrams(Math.abs(actual - guess))}
      </span>
      <span className="tabular text-[1.6rem] font-bold text-gold-bright">
        Wins {formatBread(pot)} {CONFIG.tokenSymbol}
      </span>
    </div>
  );
}

function NoWinnerBanner({ actual }: { actual: number }) {
  return (
    <div
      className="panel flex flex-col items-center gap-[0.3rem] px-[2.5rem] py-[1.4rem]"
      style={{ borderColor: "var(--color-berry)", animation: "pop-in 0.6s ease-out" }}
    >
      <span className="font-display text-[1.4rem] uppercase tracking-[0.2em] text-berry">
        Everyone overbid!
      </span>
      <span className="text-[1.6rem] text-cream/85">
        No guess came in at or under {formatGrams(actual)} — no winner this round.
      </span>
    </div>
  );
}

export function Breadtzel({ payment }: { payment: PaymentInfo }) {
  const sound = useSound();

  // One-shot pretzel celebrations, one per active burst id.
  const [bursts, setBursts] = useState<number[]>([]);
  const burstSeq = useRef(0);
  const spawnBurst = useCallback(() => {
    const id = (burstSeq.current += 1);
    setBursts((b) => [...b, id]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), BURST_MS);
  }, []);

  // The display is read-only: all control lives on the protected /admin page.
  // useLottery fires onNewEntry exactly once per new guess (deduped by entry
  // id, which is 1:1 with a tx), so each transfer celebrates exactly once.
  const { state, ranked, winner } = useLottery({
    onNewEntry: () => {
      sound.coin();
      spawnBurst();
    },
  });

  const pot = potTotal(state.entries);

  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr] gap-[1.5rem] p-[1.5rem]">
      <Marquee live={state.live} />

      <main className="grid min-h-0 grid-cols-[1fr_1.5fr_1fr] gap-[1.5rem]">
        <div className="min-h-0">
          <GuessFeed entries={state.entries} />
        </div>

        <div className="flex min-h-0 flex-col gap-[1.5rem]">
          <div className="flex flex-1 flex-col items-center justify-center gap-[2rem]">
            <SlotMachine
              phase={state.phase}
              actualWeight={state.actualWeight}
              sound={sound}
            />
            {state.phase === "revealed" && state.actualWeight != null && (
              winner ? (
                <WinnerBanner
                  name={winner.displayName}
                  address={winner.address}
                  guess={winner.weightGuess}
                  actual={state.actualWeight}
                  pot={pot}
                />
              ) : (
                <NoWinnerBanner actual={state.actualWeight} />
              )
            )}
          </div>
          <StatsBar entries={state.entries} />
        </div>

        <div className="flex min-h-0 flex-col gap-[1.5rem]">
          <div className="min-h-0 flex-1">
            <Leaderboard
              ranked={ranked}
              actualWeight={state.actualWeight}
              winnerId={state.winnerId}
            />
          </div>
          <SubmitPanel payment={payment} />
        </div>
      </main>

      {bursts.map((id) => (
        <PretzelBurst key={id} />
      ))}

      {state.phase === "revealed" && winner && <Confetti />}

      {!sound.enabled && (
        <button
          onClick={sound.enable}
          className="fixed bottom-[1.5rem] right-[1.5rem] z-40 rounded-full border border-gold/40 bg-velvet-deep/90 px-[1.2rem] py-[0.7rem] text-[1.05rem] text-cream/80 backdrop-blur hover:text-cream"
        >
          🔊 Click anywhere for sound
        </button>
      )}
    </div>
  );
}
