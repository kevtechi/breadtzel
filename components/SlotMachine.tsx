"use client";

import { useEffect, useRef, useState } from "react";
import { Reel } from "@/components/Reel";
import type { Phase } from "@/lib/types";
import type { SoundApi } from "@/components/useSound";

interface SlotMachineProps {
  phase: Phase;
  /** Real weight in grams once the operator reveals it. */
  actualWeight: number | null;
  /** Optional hook fired once all reels have stopped. */
  onReelsSettled?: () => void;
  sound: SoundApi;
}

const REEL_COUNT = 3;
const STOP_STAGGER_MS = 550;
const BASE_DURATION_MS = 2600;

export function SlotMachine({
  phase,
  actualWeight,
  onReelsSettled,
  sound,
}: SlotMachineProps) {
  const spinning = phase === "spinning";
  const showDigits = phase === "spinning" || phase === "revealed";

  // Digits of the weight, padded to 3 (e.g. 73 -> [0, 7, 3]).
  const digits =
    actualWeight != null
      ? String(Math.min(999, Math.round(actualWeight)))
          .padStart(REEL_COUNT, "0")
          .split("")
          .map(Number)
      : null;

  const settledCount = useRef(0);
  const [shakeKey, setShakeKey] = useState(0);

  // Reset the settle counter at the start of each spin.
  useEffect(() => {
    if (spinning) settledCount.current = 0;
  }, [spinning]);

  // Ticking while the reels blur past.
  useEffect(() => {
    if (!spinning) return;
    const id = setInterval(() => sound.tick(), 70);
    return () => clearInterval(id);
  }, [spinning, sound]);

  const handleReelSettle = () => {
    sound.reelStop();
    setShakeKey((k) => k + 1); // nudge for a physical "thunk"
    settledCount.current += 1;
    if (settledCount.current >= REEL_COUNT) {
      sound.win();
      onReelsSettled?.();
    }
  };

  return (
    <div className="flex flex-col items-center gap-[2rem]">
      {/* Hanging pretzel mascot */}
      <div
        className="text-[6rem] leading-none"
        style={{ animation: "float-y 3.4s ease-in-out infinite" }}
        aria-hidden
      >
        🥨
      </div>

      {/* Reel cabinet */}
      <div
        key={shakeKey}
        className="panel flex items-center gap-[1.2rem] px-[2.2rem] py-[2rem]"
        style={{
          animation: spinning ? "none" : undefined,
          borderColor: phase === "revealed" ? "var(--color-gold-bright)" : undefined,
        }}
      >
        <div className="flex items-end gap-[1rem]">
          {Array.from({ length: REEL_COUNT }, (_, i) => (
            <Reel
              key={i}
              target={showDigits && digits ? digits[i] : null}
              spin={spinning}
              delayMs={i * STOP_STAGGER_MS}
              durationMs={BASE_DURATION_MS + i * STOP_STAGGER_MS}
              onSettle={handleReelSettle}
              idleGlyph="?"
            />
          ))}
        </div>
        <span
          className="font-display text-[5rem] leading-none text-gold-bright"
          style={{ animation: "glow-pulse 2.6s ease-in-out infinite" }}
        >
          g
        </span>
      </div>

      {/* Caption under the cabinet */}
      <div className="h-[3.5rem] text-center">
        {phase === "open" && (
          <p className="font-display text-[2rem] uppercase tracking-[0.15em] text-cream/80">
            Guess the weight
          </p>
        )}
        {phase === "spinning" && (
          <p className="font-display text-[2rem] uppercase tracking-[0.15em] text-gold-bright">
            Weighing the pretzel…
          </p>
        )}
        {phase === "revealed" && (
          <p className="font-display text-[2rem] uppercase tracking-[0.15em] text-mint">
            Actual weight!
          </p>
        )}
      </div>
    </div>
  );
}
