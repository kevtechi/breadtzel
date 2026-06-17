// Reads incoming BREAD (ERC-20) transfers on Gnosis Chain via Alchemy's
// Transfers API (alchemy_getAssetTransfers), which is purpose-built for ERC-20
// transfers — decoded values, paginated, no manual log parsing.
// Verified against mainnet (chainId 100, BREAD, decoded value + uniqueId).
// Server-only (uses the Alchemy key).
import { CONFIG } from "@/lib/config";

export interface BreadTransfer {
  from: string;
  /** BREAD amount as a float (token decimals already applied by Alchemy). */
  amountBread: number;
  /** Alchemy uniqueId, e.g. "0x<hash>:log:33" — stable idempotency key. */
  transferId: string;
  txHash: string;
  blockNumber: number;
}

interface RawTransfer {
  from: string;
  value: number | null;
  rawContract?: { value?: string | null; decimal?: string | null };
  hash: string;
  blockNum: string;
  uniqueId: string;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  if (!CONFIG.alchemyUrl) throw new Error("ALCHEMY_API_KEY is not set");
  const res = await fetch(CONFIG.alchemyUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

export async function getLatestBlock(): Promise<number> {
  return parseInt(await rpc<string>("eth_blockNumber", []), 16);
}

function amountOf(t: RawTransfer): number {
  // Alchemy's `value` is decimal-adjusted but null for very large/precise
  // amounts; fall back to the raw integer divided by 10^decimals.
  if (t.value != null) return t.value;
  const raw = t.rawContract?.value;
  const decimals = t.rawContract?.decimal ? parseInt(t.rawContract.decimal, 16) : 18;
  return raw ? Number(BigInt(raw)) / 10 ** decimals : 0;
}

/**
 * Fetch BREAD transfers TO the receiving account in [fromBlock, toBlock],
 * following pagination. Ordered ascending by block.
 */
export async function fetchIncomingTransfers(
  fromBlock: number,
  toBlock: number,
): Promise<BreadTransfer[]> {
  if (!CONFIG.receivingAddress) throw new Error("No receiving address");
  const out: BreadTransfer[] = [];
  let pageKey: string | undefined;

  do {
    const result = await rpc<{ transfers: RawTransfer[]; pageKey?: string }>(
      "alchemy_getAssetTransfers",
      [
        {
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          toAddress: CONFIG.receivingAddress,
          contractAddresses: [CONFIG.breadTokenAddress],
          category: ["erc20"],
          excludeZeroValue: true,
          order: "asc",
          maxCount: "0x3e8", // 1000
          ...(pageKey ? { pageKey } : {}),
        },
      ],
    );
    for (const t of result.transfers) {
      out.push({
        from: t.from.toLowerCase(),
        amountBread: amountOf(t),
        transferId: t.uniqueId,
        txHash: t.hash,
        blockNumber: parseInt(t.blockNum, 16),
      });
    }
    pageKey = result.pageKey;
  } while (pageKey);

  return out;
}
