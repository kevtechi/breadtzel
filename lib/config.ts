// Breadtzel configuration.
//
// Payment model: guesses are BREAD (ERC-20 on Gnosis) transfers to a receiving
// account. The BREAD amount IS the guess: 1 BREAD = 10 g (7.5 BREAD = 75 g).
// Winner: Price Is Right — closest guess WITHOUT going over the real weight.
//
// "Live" mode (read real transfers via Alchemy + persist in Postgres) turns on
// automatically when ACCOUNT_ADDRESS is set. Without it, the app runs on an
// in-memory mock so the display works with zero infra.

const RECEIVING = (
  process.env.ACCOUNT_ADDRESS ?? process.env.BREADTZEL_RECEIVING_ADDRESS
)?.toLowerCase();

export const CONFIG = {
  chainId: 100,
  chainName: "Gnosis Chain",
  tokenSymbol: "BREAD",

  /** BREAD token on Gnosis (verified: symbol BREAD, 18 decimals). */
  breadTokenAddress: (
    process.env.TOKEN_ADDRESS ??
    process.env.BREAD_TOKEN_ADDRESS ??
    "0xa555d5344f6fb6c65da19e403cb4c1ec4a1a5ee3"
  ).toLowerCase(),

  /** Account that receives guesses. Required for live mode. */
  receivingAddress: RECEIVING,

  /** First block to ingest from on a cold start (defaults to "latest"). */
  startBlock: process.env.BREADTZEL_START_BLOCK
    ? Number(process.env.BREADTZEL_START_BLOCK)
    : null,

  /** Alchemy Gnosis JSON-RPC endpoint, if a key is present. */
  alchemyUrl: process.env.ALCHEMY_API_KEY
    ? `https://gnosis-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : null,
} as const;

/** True when we should read real on-chain transfers and persist them. */
export const LIVE_MODE = Boolean(CONFIG.receivingAddress && CONFIG.alchemyUrl);

/**
 * How long a round stays in "spinning" before the server auto-reveals the
 * winner. Must comfortably exceed the display's reel animation (~3.7s) plus
 * poll latency so the reels visibly settle before the winner appears.
 */
export const SPIN_REVEAL_MS = 5500;
