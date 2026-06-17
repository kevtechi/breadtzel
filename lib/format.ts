import type { Entry } from "@/lib/types";

// The rule that ties everything together:
//   guess 75 g  ->  send 7.5 BREAD
// i.e. 0.1 BREAD per gram (1 BREAD = 10 g).
export const BREAD_PER_GRAM = 0.1;

export const gramsToBread = (grams: number) => grams * BREAD_PER_GRAM;
export const breadToGrams = (bread: number) => bread / BREAD_PER_GRAM;

export function formatBread(bread: number): string {
  return bread.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function formatGrams(grams: number): string {
  return `${Math.round(grams)}g`;
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Total pot in BREAD. */
export function potTotal(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.amountBread, 0);
}

/**
 * Price Is Right ranking: valid bids (at or under the real weight) first,
 * ordered closest-under → furthest-under; then the overbids, least-over first.
 * The winner is the first element IF it didn't go over.
 */
export function rankPriceIsRight(entries: Entry[], target: number): Entry[] {
  const under = entries
    .filter((e) => e.weightGuess <= target)
    .sort((a, b) => b.weightGuess - a.weightGuess);
  const over = entries
    .filter((e) => e.weightGuess > target)
    .sort((a, b) => a.weightGuess - b.weightGuess);
  return [...under, ...over];
}

/**
 * The winning entry under Price Is Right rules: the highest guess that does
 * NOT exceed the real weight. Returns null if everyone overbid.
 */
export function pickWinner(entries: Entry[], target: number): Entry | null {
  let best: Entry | null = null;
  for (const e of entries) {
    if (e.weightGuess <= target && (!best || e.weightGuess > best.weightGuess)) {
      best = e;
    }
  }
  return best;
}
