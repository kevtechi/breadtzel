// Prisma data access for the live (DB-backed) store. Server-only.
import { prisma } from "@/lib/prisma";
import type { Entry as PrismaEntry, Round } from "@/generated/prisma/client";
import type { Entry, Phase, RoundState } from "@/lib/types";
import { pickWinner, shortenAddress } from "@/lib/format";
import { SPIN_REVEAL_MS } from "@/lib/config";
import type { BreadTransfer } from "@/lib/bread-chain";

/** Resolve admin-tagged names for a set of addresses. */
async function nameMap(addresses: string[]): Promise<Map<string, string>> {
  if (addresses.length === 0) return new Map();
  const accounts = await prisma.account.findMany({
    where: { address: { in: [...new Set(addresses)] } },
  });
  return new Map(accounts.map((a) => [a.address, a.displayName]));
}

function toEntry(row: PrismaEntry, names: Map<string, string>): Entry {
  return {
    id: row.id,
    address: row.address,
    displayName: names.get(row.address) ?? shortenAddress(row.address),
    weightGuess: row.weightGuess,
    amountBread: Number(row.amountBread),
    timestamp: row.createdAt.getTime(),
    hidden: row.hidden,
  };
}

/** Latest round, creating an initial open one if the table is empty. */
async function currentRound(): Promise<Round> {
  const latest = await prisma.round.findFirst({ orderBy: { createdAt: "desc" } });
  return latest ?? prisma.round.create({ data: {} });
}

/**
 * Round state. The public display excludes hidden guesses; the admin view
 * (includeHidden) keeps them so they can be unhidden.
 */
export async function getRoundState(
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<RoundState> {
  let round = await currentRound();
  // Server-driven reveal: once the spin has run long enough, crown the winner.
  if (
    round.phase === "spinning" &&
    round.actualWeight != null &&
    Date.now() - round.updatedAt.getTime() >= SPIN_REVEAL_MS
  ) {
    await completeReveal();
    round = await currentRound();
  }
  const rows = await prisma.entry.findMany({
    where: includeHidden
      ? { roundId: round.id }
      : { roundId: round.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });
  const names = await nameMap(rows.map((r) => r.address));
  return {
    roundId: round.id,
    phase: round.phase as Phase,
    actualWeight: round.actualWeight,
    winnerId: round.winnerId,
    entries: rows.map((r) => toEntry(r, names)),
    live: true,
  };
}

export async function beginSpin(actualWeight: number): Promise<void> {
  const round = await currentRound();
  if (round.phase !== "open") return;
  await prisma.round.update({
    where: { id: round.id },
    data: { phase: "spinning", actualWeight, winnerId: null },
  });
}

export async function completeReveal(): Promise<void> {
  const round = await currentRound();
  if (round.phase !== "spinning" || round.actualWeight == null) return;
  // Hidden guesses can't win.
  const rows = await prisma.entry.findMany({
    where: { roundId: round.id, hidden: false },
  });
  const names = await nameMap(rows.map((r) => r.address));
  const winner = pickWinner(
    rows.map((r) => toEntry(r, names)),
    round.actualWeight,
  );
  await prisma.round.update({
    where: { id: round.id },
    data: {
      phase: "revealed",
      winnerId: winner?.id ?? null,
      revealedAt: new Date(),
    },
  });
}

export async function startNewRound(): Promise<void> {
  await prisma.round.create({ data: {} });
}

export async function setAccountName(
  address: string,
  displayName: string,
): Promise<void> {
  const addr = address.toLowerCase();
  await prisma.account.upsert({
    where: { address: addr },
    create: { address: addr, displayName },
    update: { displayName },
  });
}

export async function setEntryHidden(
  entryId: string,
  hidden: boolean,
): Promise<void> {
  await prisma.entry.update({ where: { id: entryId }, data: { hidden } });
}

/** Persist new BREAD transfers as entries on the current round (idempotent). */
export async function recordTransfers(
  transfers: BreadTransfer[],
): Promise<number> {
  if (transfers.length === 0) return 0;
  const round = await currentRound();
  const result = await prisma.entry.createMany({
    data: transfers.map((t) => ({
      roundId: round.id,
      address: t.from.toLowerCase(),
      weightGuess: Math.round(t.amountBread * 10),
      amountBread: t.amountBread,
      transferId: t.transferId,
      txHash: t.txHash,
      blockNumber: BigInt(t.blockNumber),
    })),
    skipDuplicates: true,
  });
  return result.count;
}

export async function getCursor(): Promise<number | null> {
  const row = await prisma.ingestCursor.findUnique({ where: { id: "bread" } });
  return row ? Number(row.lastBlock) : null;
}

export async function setCursor(lastBlock: number): Promise<void> {
  await prisma.ingestCursor.upsert({
    where: { id: "bread" },
    create: { id: "bread", lastBlock: BigInt(lastBlock) },
    update: { lastBlock: BigInt(lastBlock) },
  });
}
