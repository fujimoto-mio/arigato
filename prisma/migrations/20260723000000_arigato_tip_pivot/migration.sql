-- ARIGATO TiP spec pivot (2026-07-23):
-- store-level tips (staff optional), cash/card payment method, table label,
-- review photos, per-store social links; drop the unused per-store Stripe account.

-- Payment method enum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card');

-- Store: drop unused per-store Stripe account, add social links
ALTER TABLE "Store" DROP COLUMN IF EXISTS "stripeAccountId";
ALTER TABLE "Store" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN "facebookUrl" TEXT;

-- Tip: staff becomes optional (tips are store-level); add table label + payment method
ALTER TABLE "Tip" DROP CONSTRAINT IF EXISTS "Tip_staffId_fkey";
ALTER TABLE "Tip" ALTER COLUMN "staffId" DROP NOT NULL;
ALTER TABLE "Tip" ADD COLUMN "tableLabel" TEXT;
ALTER TABLE "Tip" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cash';
ALTER TABLE "Tip"
  ADD CONSTRAINT "Tip_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Review: guest-uploaded photos
ALTER TABLE "Review" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
