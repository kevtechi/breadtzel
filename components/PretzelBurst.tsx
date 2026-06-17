"use client";

import { useEffect, useState } from "react";

interface Bit {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

/**
 * A short, one-shot shower of pretzels — fired each time a new guess lands.
 * Distinct from the reveal Confetti (which is a persistent, mixed-glyph
 * celebration); this is pretzels only and plays once, then the parent unmounts
 * it. Bits are generated after mount to keep render pure. When a name is given,
 * it's flashed front-and-center so the room sees who just played.
 */
export function PretzelBurst({ count = 16, name }: { count?: number; name?: string }) {
  const [bits, setBits] = useState<Bit[]>([]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setBits(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.4,
          duration: 1.8 + Math.random() * 1.1,
          size: 1.4 + Math.random() * 2.2,
        })),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <div
      className="pretzel-burst pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-0"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}rem`,
            animation: `confetti-fall ${b.duration}s ease-in ${b.delay}s forwards`,
          }}
        >
          🥨
        </span>
      ))}

      {name && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-shine font-display text-[5rem] uppercase leading-none tracking-[0.06em]"
            style={{ animation: "pop-in 0.6s ease-out" }}
          >
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
