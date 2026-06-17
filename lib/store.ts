// Uniform server-side store API. Routes to the live Prisma + chain-ingest
// store when LIVE_MODE is on, otherwise the in-memory mock. The Prisma modules
// are dynamically imported so mock mode never constructs a DB client.
//
// Resilience: if live mode is configured but the database is unreachable, calls
// degrade to the mock store (a blank kiosk is worse than a graceful demo). A
// circuit breaker then skips the DB for a cooldown window so polls stay fast
// instead of paying a connection timeout every 1.5s.
import { LIVE_MODE } from "@/lib/config";
import type { RoundState } from "@/lib/types";
import { mockStore } from "@/lib/mock-store";

const COOLDOWN_MS = 30_000;
let liveDownUntil = 0;

function liveReady(): boolean {
  return LIVE_MODE && Date.now() >= liveDownUntil;
}

function trip(err: unknown) {
  liveDownUntil = Date.now() + COOLDOWN_MS;
  console.error(
    `[breadtzel] live store unavailable — serving mock for ${COOLDOWN_MS / 1000}s:`,
    err instanceof Error ? err.message : err,
  );
}

export async function getState(): Promise<RoundState> {
  if (!liveReady()) return mockStore.getState();
  try {
    const db = await import("@/lib/queries");
    const { ingestNewTransfers } = await import("@/lib/ingest");
    // Ingest-on-poll keeps a single display self-sufficient without a cron job.
    await ingestNewTransfers();
    return await db.getRoundState();
  } catch (err) {
    trip(err);
    return mockStore.getState();
  }
}

async function liveOrMock(
  live: () => Promise<void>,
  mock: () => void,
): Promise<void> {
  if (!liveReady()) return mock();
  try {
    await live();
  } catch (err) {
    trip(err);
    mock();
  }
}

// Admin view: includes hidden guesses (and ingests, so admin polling keeps
// data fresh even with no display open).
export async function getAdminState(): Promise<RoundState> {
  if (!liveReady()) return mockStore.getAdminState();
  try {
    const db = await import("@/lib/queries");
    const { ingestNewTransfers } = await import("@/lib/ingest");
    await ingestNewTransfers();
    return await db.getRoundState({ includeHidden: true });
  } catch (err) {
    trip(err);
    return mockStore.getAdminState();
  }
}

export async function beginSpin(weight: number): Promise<void> {
  await liveOrMock(
    async () => (await import("@/lib/queries")).beginSpin(weight),
    () => mockStore.beginSpin(weight),
  );
}

export async function completeReveal(): Promise<void> {
  await liveOrMock(
    async () => (await import("@/lib/queries")).completeReveal(),
    () => mockStore.completeReveal(),
  );
}

export async function startNewRound(): Promise<void> {
  await liveOrMock(
    async () => (await import("@/lib/queries")).startNewRound(),
    () => mockStore.startNewRound(),
  );
}

export async function setName(address: string, name: string): Promise<void> {
  await liveOrMock(
    async () => (await import("@/lib/queries")).setAccountName(address, name),
    () => mockStore.setName(address, name),
  );
}

export async function setHidden(entryId: string, hidden: boolean): Promise<void> {
  await liveOrMock(
    async () => (await import("@/lib/queries")).setEntryHidden(entryId, hidden),
    () => mockStore.setHidden(entryId, hidden),
  );
}
