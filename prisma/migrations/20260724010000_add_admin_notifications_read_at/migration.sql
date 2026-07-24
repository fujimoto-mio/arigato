-- Track when an admin last read their notifications, to drive the unread badge.
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "notificationsReadAt" TIMESTAMP(3);
