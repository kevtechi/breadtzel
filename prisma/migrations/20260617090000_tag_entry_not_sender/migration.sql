-- Tag guesses per-transaction instead of per-sender: the display name now lives
-- on the Entry (one row per tx), and the address-keyed Account table is removed.

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "displayName" TEXT;

-- DropTable
DROP TABLE "Account";
