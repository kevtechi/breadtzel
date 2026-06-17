"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tiny Web Audio synthesizer for the slot-machine SFX. No audio assets —
 * every sound is generated, so there's nothing to bundle or load.
 *
 * Browsers block audio until a user gesture, so the AudioContext is created
 * lazily and resumed on the first interaction. `enabled` reflects whether
 * sound is currently allowed to play.
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const enable = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    setEnabled(true);
  }, [getCtx]);

  // Resume on the first user gesture anywhere on the page.
  useEffect(() => {
    const onGesture = () => enable();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [enable]);

  /** One enveloped oscillator note. */
  const tone = useCallback(
    (
      ctx: AudioContext,
      {
        freq,
        type = "sine",
        start = 0,
        dur = 0.15,
        gain = 0.2,
        endFreq,
      }: {
        freq: number;
        type?: OscillatorType;
        start?: number;
        dur?: number;
        gain?: number;
        endFreq?: number;
      },
    ) => {
      const t0 = ctx.currentTime + start;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    [],
  );

  const ready = useCallback((): AudioContext | null => {
    if (muted || !enabled) return null;
    const ctx = getCtx();
    if (!ctx || ctx.state !== "running") return null;
    return ctx;
  }, [muted, enabled, getCtx]);

  /** Bright two-tone blip when a new guess lands. */
  const coin = useCallback(() => {
    const ctx = ready();
    if (!ctx) return;
    tone(ctx, { freq: 880, type: "square", dur: 0.07, gain: 0.12 });
    tone(ctx, { freq: 1320, type: "square", start: 0.06, dur: 0.1, gain: 0.1 });
  }, [ready, tone]);

  /** Short tick while reels spin. */
  const tick = useCallback(() => {
    const ctx = ready();
    if (!ctx) return;
    tone(ctx, { freq: 1200, type: "triangle", dur: 0.03, gain: 0.05 });
  }, [ready, tone]);

  /** Thunk when a reel locks into place. */
  const reelStop = useCallback(() => {
    const ctx = ready();
    if (!ctx) return;
    tone(ctx, { freq: 320, type: "sine", endFreq: 120, dur: 0.18, gain: 0.22 });
  }, [ready, tone]);

  /** Triumphant arpeggio + sparkle on reveal. */
  const win = useCallback(() => {
    const ctx = ready();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((f, i) =>
      tone(ctx, {
        freq: f,
        type: "square",
        start: i * 0.12,
        dur: 0.22,
        gain: 0.16,
      }),
    );
    for (let i = 0; i < 6; i++) {
      tone(ctx, {
        freq: 1500 + i * 350,
        type: "triangle",
        start: 0.5 + i * 0.05,
        dur: 0.12,
        gain: 0.07,
      });
    }
  }, [ready, tone]);

  return {
    enabled,
    muted,
    enable,
    toggleMute: () => setMuted((m) => !m),
    coin,
    tick,
    reelStop,
    win,
  };
}

export type SoundApi = ReturnType<typeof useSound>;
