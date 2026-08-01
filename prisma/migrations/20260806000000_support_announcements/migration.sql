-- Phase 2: support chat (運営へのお問い合わせ) + announcements (お知らせ).
CREATE TYPE "SupportStatus" AS ENUM ('open', 'resolved');
CREATE TYPE "SupportSender" AS ENUM ('operator', 'admin');

CREATE TABLE "SupportThread" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "SupportStatus" NOT NULL DEFAULT 'open',
  "operatorUnread" BOOLEAN NOT NULL DEFAULT false,
  "adminUnread" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "SupportThread_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportThread_storeId_idx" ON "SupportThread"("storeId");
ALTER TABLE "SupportThread" ADD CONSTRAINT "SupportThread_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "sender" "SupportSender" NOT NULL,
  "body" TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportMessage_threadId_idx" ON "SupportMessage"("threadId");
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "storeId" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Announcement_storeId_idx" ON "Announcement"("storeId");
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AnnouncementRead" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_adminUserId_key" ON "AnnouncementRead"("announcementId", "adminUserId");
CREATE INDEX "AnnouncementRead_adminUserId_idx" ON "AnnouncementRead"("adminUserId");
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
