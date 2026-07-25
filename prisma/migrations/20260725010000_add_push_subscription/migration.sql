-- Web Push subscriptions for admin devices.
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_storeId_idx" ON "PushSubscription"("storeId");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
