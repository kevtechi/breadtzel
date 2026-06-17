"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const SPINS = 6; // full 0-9 loops before landing, for that slot-machine blur

interface ReelProps {
  /** Digit to land on (0-9), or null while idle. */
  target: number | null;
  /** True while this round is spinning toward the target. */
  spin: boolean;
  /** Stagger so reels stop left-to-right. */
  delayMs: number;
  /** Spin duration in ms. */
  durationMs: number;
  /** Fired once when the reel locks into place. */
  onSettle?: () => void;
  /** Glyph shown before any spin. */
  idleGlyph?: string;
}

export function Reel({
  target,
  spin,
  delayMs,
  durationMs,
  onSettle,
  idleGlyph = "?",
}: ReelProps) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const settledRef = useRef(false);

  // Kick off the spin: jump to top with no transition, then on the next
  // frame enable the transition and translate to the final cell. All state
  // updates happen inside rAF callbacks so the reset and the move land on
  // separate frames (and never synchronously in the effect body).
  useEffect(() => {
    if (!spin || target == null) return;
    settledRef.current = false;
    const final = SPINS * 10 + target;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      setAnimating(false);
      setOffset(0);
      raf2 = requestAnimationFrame(() => {
        setAnimating(true);
        setOffset(final);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [spin, target]);

  const handleEnd = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettle?.();
  };

  // Idle (no spin yet) — show a static glyph or the settled digit.
  if (!spin || target == null) {
    const glyph = target == null ? idleGlyph : String(target);
    return (
      <div className="reel-window">
        <div className="reel-cell">{glyph}</div>
      </div>
    );
  }

  const strip = Array.from({ length: SPINS * 10 + target + 1 }, (_, i) => i % 10);

  const stripStyle: CSSProperties = {
    transform: `translateY(calc(var(--reel-h) * ${-offset}))`,
    transition: animating
      ? `transform ${durationMs}ms cubic-bezier(0.15, 0.85, 0.2, 1) ${delayMs}ms`
      : "none",
  };

  return (
    <div className="reel-window">
      <div className="reel-strip" style={stripStyle} onTransitionEnd={handleEnd}>
        {strip.map((d, i) => (
          <div key={i} className="reel-cell">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
