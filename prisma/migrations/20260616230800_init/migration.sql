-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('open', 'spinning', 'revealed');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "phase" "RoundPhase" NOT NULL DEFAULT 'open',
    "actualWeight" INTEGER,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revealedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "weightGuess" INTEGER NOT NULL,
    "amountBread" DECIMAL(36,18) NOT NULL,
    "transferId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "address" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "IngestCursor" (
    "id" TEXT NOT NULL DEFAULT 'bread',
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_winnerId_key" ON "Round"("winnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_transferId_key" ON "Entry"("transferId");

-- CreateIndex
CREATE INDEX "Entry_roundId_createdAt_idx" ON "Entry"("roundId", "createdAt");

-- CreateIndex
CREATE INDEX "Entry_address_idx" ON "Entry"("address");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
