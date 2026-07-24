-- Switch from a single "read at" timestamp to per-notification read markers.
ALTER TABLE "AdminUser" DROP COLUMN IF EXISTS "notificationsReadAt";

CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationRead_adminUserId_tipId_key" ON "NotificationRead"("adminUserId", "tipId");
CREATE INDEX "NotificationRead_adminUserId_idx" ON "NotificationRead"("adminUserId");

ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
