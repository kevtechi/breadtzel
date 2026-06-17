"use client";

import { useEffect, useState } from "react";

const PIECES = ["🥨", "🪙", "⭐", "💰", "🥨", "✨"];

interface Bit {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  glyph: string;
}

/** Full-screen emoji confetti shower. Mount it only while celebrating. */
export function Confetti({ count = 90 }: { count?: number }) {
  const [bits, setBits] = useState<Bit[]>([]);

  // Randomized positions are generated after mount (in a rAF callback) to
  // keep render pure and avoid a synchronous setState in the effect body.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setBits(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2.5,
          duration: 3 + Math.random() * 3.5,
          size: 1.4 + Math.random() * 2.6,
          glyph: PIECES[Math.floor(Math.random() * PIECES.length)],
        })),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-0"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}rem`,
            animation: `confetti-fall ${b.duration}s linear ${b.delay}s infinite`,
          }}
        >
          {b.glyph}
        </span>
      ))}
    </div>
  );
}
