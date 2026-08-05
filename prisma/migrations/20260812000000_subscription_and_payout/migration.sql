-- Store subscription (Stripe) + manual payout ledger.

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('none', 'trialing', 'active', 'past_due', 'canceled');

-- AlterTable: Stripe subscription state on the store, mirrored by the webhook.
ALTER TABLE "Store"
  ADD COLUMN "stripeCustomerId"             TEXT,
  ADD COLUMN "stripeSubscriptionId"         TEXT,
  ADD COLUMN "subscriptionStatus"           "SubscriptionStatus" NOT NULL DEFAULT 'none',
  ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMPTZ(3);

-- CreateIndex
CREATE UNIQUE INDEX "Store_stripeSubscriptionId_key" ON "Store"("stripeSubscriptionId");

-- CreateTable: manual payout ledger (USD cents, same unit as Tip.amount).
CREATE TABLE "Payout" (
    "id"               TEXT NOT NULL,
    "storeId"          TEXT NOT NULL,
    "amount"           INTEGER NOT NULL,
    "periodStart"      TIMESTAMPTZ(3),
    "periodEnd"        TIMESTAMPTZ(3),
    "note"             TEXT,
    "createdByAdminId" TEXT,
    "createdAt"        TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payout_storeId_createdAt_idx" ON "Payout"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
