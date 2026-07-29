-- A single admin manages every store, so a push subscription is global by default
-- (storeId null) and receives every store's notifications. Detach on store delete.
ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_storeId_fkey";
ALTER TABLE "PushSubscription" ALTER COLUMN "storeId" DROP NOT NULL;
ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
