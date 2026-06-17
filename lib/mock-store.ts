// In-memory mock store used when LIVE_MODE is off (no receiving address).
// Generates organic-looking BREAD guesses over time and supports the full
// operator + naming lifecycle, so the display and admin work with zero infra.
// Module-level state persists for the life of the dev/server process.
import type { Entry, Phase, RoundState } from "@/lib/types";
import { gramsToBread, pickWinner } from "@/lib/format";
import { SPIN_REVEAL_MS } from "@/lib/config";

const WORDS = [
  "salty", "doughboy", "gnosis", "pretzel", "yeast", "baker", "crumb", "lye",
  "bavaria", "twist", "knot", "bread", "sourdough", "carb", "gluten", "munich",
  "soda", "golden", "warm", "snack",
];

const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const hex = (n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

let seq = 0;
const id = () => `e${(seq += 1)}_${hex(6)}`;

function randomWeight(): number {
  const base = 55 + Math.random() * 60;
  const tail = Math.random() < 0.15 ? (Math.random() - 0.5) * 60 : 0;
  return Math.max(20, Math.min(200, Math.round(base + tail)));
}

interface Record {
  id: string;
  address: string;
  txHash: string;
  baseName: string;
  /** Admin-assigned name for this specific guess; overrides baseName. */
  name?: string;
  weightGuess: number;
  amountBread: number;
  timestamp: number;
  hidden: boolean;
}

function makeRecord(timestamp: number): Record {
  const weightGuess = randomWeight();
  return {
    id: id(),
    address: `0x${hex(40)}`,
    txHash: `0x${hex(64)}`,
    baseName: Math.random() < 0.55 ? `${pick(WORDS)}.eth` : `${pick(WORDS)}_${Math.floor(Math.random() * 9999)}`,
    weightGuess,
    amountBread: gramsToBread(weightGuess),
    timestamp,
    hidden: false,
  };
}

interface MockState {
  roundId: string;
  phase: Phase;
  actualWeight: number | null;
  winnerId: string | null;
  records: Record[];
  lastGen: number;
  nextGap: number;
  spinAt: number; // ms when the current spin started (for auto-reveal)
}

function seed(): MockState {
  const now = Date.now();
  const records = Array.from({ length: 16 }, (_, i) =>
    makeRecord(now - (16 - i) * 9000),
  );
  return {
    roundId: `mock_${hex(6)}`,
    phase: "open",
    actualWeight: null,
    winnerId: null,
    records,
    lastGen: now,
    nextGap: 2500 + Math.random() * 3500,
    spinAt: 0,
  };
}

// Persist across hot reloads in dev.
const g = globalThis as unknown as { __breadtzelMock?: MockState };
const state: MockState = (g.__breadtzelMock ??= seed());

function maybeGenerate() {
  if (state.phase !== "open") return;
  const now = Date.now();
  if (now - state.lastGen >= state.nextGap) {
    state.records.push(makeRecord(now));
    state.lastGen = now;
    state.nextGap = 2500 + Math.random() * 3500;
  }
}

function toEntry(r: Record): Entry {
  return {
    id: r.id,
    address: r.address,
    displayName: r.name ?? r.baseName,
    txHash: r.txHash,
    weightGuess: r.weightGuess,
    amountBread: r.amountBread,
    timestamp: r.timestamp,
    hidden: r.hidden,
  };
}

function snapshot(includeHidden: boolean): RoundState {
  const entries = [...state.records]
    .filter((r) => includeHidden || !r.hidden)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(toEntry);
  return {
    roundId: state.roundId,
    phase: state.phase,
    actualWeight: state.actualWeight,
    winnerId: state.winnerId,
    entries,
    live: false,
  };
}

export const mockStore = {
  getState(): RoundState {
    maybeGenerate();
    // Server-driven reveal after the spin has run long enough.
    if (
      state.phase === "spinning" &&
      state.actualWeight != null &&
      Date.now() - state.spinAt >= SPIN_REVEAL_MS
    ) {
      this.completeReveal();
    }
    return snapshot(false);
  },

  // Admin view: includes hidden guesses so they can be unhidden.
  getAdminState(): RoundState {
    maybeGenerate();
    return snapshot(true);
  },

  beginSpin(actualWeight: number) {
    if (state.phase !== "open" || state.records.length === 0) return;
    state.phase = "spinning";
    state.actualWeight = actualWeight;
    state.spinAt = Date.now();
    state.winnerId = null;
  },

  completeReveal() {
    if (state.phase !== "spinning" || state.actualWeight == null) return;
    // Hidden guesses can't win.
    const eligible = state.records.filter((r) => !r.hidden).map(toEntry);
    const winner = pickWinner(eligible, state.actualWeight);
    state.phase = "revealed";
    state.winnerId = winner?.id ?? null;
  },

  startNewRound() {
    Object.assign(state, seed());
  },

  setName(entryId: string, displayName: string) {
    const r = state.records.find((x) => x.id === entryId);
    if (r) r.name = displayName;
  },

  setHidden(entryId: string, hidden: boolean) {
    const r = state.records.find((x) => x.id === entryId);
    if (r) r.hidden = hidden;
  },
};
