-- Store suspend/resume: a store's guest tip page can be turned off by the
-- platform admin while all history/stats remain.
CREATE TYPE "StoreStatus" AS ENUM ('active', 'suspended');
ALTER TABLE "Store" ADD COLUMN "status" "StoreStatus" NOT NULL DEFAULT 'active';
