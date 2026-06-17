// Server-only Prisma client singleton.
//
// Prisma 7 removed the Rust query engine, so a driver adapter is required.
// We use @prisma/adapter-pg (node-postgres). The singleton guard keeps dev
// hot-reload from opening a new pool on every change.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function makeClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Hosted Postgres (e.g. Supabase) requires TLS; local does not.
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    // Fail fast if the DB is unreachable so the store can degrade to mock
    // instead of hanging the display on every poll.
    connectionTimeoutMillis: 4000,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
