// Pulls new BREAD transfers from Gnosis and persists them. Server-only.
import { CONFIG } from "@/lib/config";
import { fetchIncomingTransfers, getLatestBlock } from "@/lib/bread-chain";
import { getCursor, recordTransfers, setCursor } from "@/lib/queries";

let running = false;

// Re-scan this many blocks below the cursor every poll. Alchemy's Transfers
// API indexes a few seconds behind the chain head, so a transfer can be
// unindexed when the cursor first passes its block. Re-scanning a trailing
// window (deduped by transferId) guarantees we still pick it up once indexed,
// with no added latency. ~20 blocks ≈ 100s on Gnosis.
const OVERLAP_BLOCKS = 20;

/**
 * Ingest BREAD transfers up to the latest block, always re-scanning a trailing
 * overlap window so indexing-lagged transfers aren't missed. Idempotent (DB
 * skips duplicate transferIds) and guarded against overlapping polls. On a cold
 * start, begins at CONFIG.startBlock or the latest block.
 */
export async function ingestNewTransfers(): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const latest = await getLatestBlock();
    const cursor = await getCursor();
    const base = cursor != null ? cursor + 1 : (CONFIG.startBlock ?? latest);
    const from = Math.max(0, Math.min(base, latest) - OVERLAP_BLOCKS);
    if (from > latest) {
      await setCursor(latest);
      return 0;
    }
    const transfers = await fetchIncomingTransfers(from, latest);
    const count = await recordTransfers(transfers);
    await setCursor(latest);
    return count;
  } finally {
    running = false;
  }
}
