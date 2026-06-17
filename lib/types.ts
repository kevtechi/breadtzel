// Core domain types for Breadtzel.

/** A single guess: someone sent BREAD on Gnosis to guess the pretzel's weight. */
export interface Entry {
  id: string;
  /** Full 0x address of the sender. */
  address: string;
  /** On-screen name: admin-tagged on this specific tx, else a shortened address. */
  displayName: string;
  /** Hash of the transaction that placed this guess (for admin identification). */
  txHash?: string;
  /** Guessed weight in grams (decoded from the BREAD amount). */
  weightGuess: number;
  /** BREAD sent === weightGuess / 10. */
  amountBread: number;
  /** Unix ms when the entry landed. */
  timestamp: number;
  /** Admin-hidden from the public display. Only populated in the admin view. */
  hidden?: boolean;
}

/** Server-provided payment details for the QR / how-to panel. */
export interface PaymentInfo {
  /** Plain receiving address (QR encodes this), or null in demo mode. */
  receivingAddress: string | null;
  tokenSymbol: string;
  tokenAddress: string;
  chainName: string;
}

/**
 * open      – accepting guesses, slot machine idle
 * spinning  – operator triggered the reveal, reels are spinning
 * revealed  – real weight shown, winner crowned
 */
export type Phase = "open" | "spinning" | "revealed";

/** Everything the display needs for one render, served by /api/state. */
export interface RoundState {
  roundId: string;
  phase: Phase;
  /** Real pretzel weight in grams, known only once revealed. */
  actualWeight: number | null;
  /** Id of the winning entry (closest guess), set on reveal. */
  winnerId: string | null;
  entries: Entry[];
  /** Whether the data is real on-chain ingestion or the in-memory mock. */
  live: boolean;
}
