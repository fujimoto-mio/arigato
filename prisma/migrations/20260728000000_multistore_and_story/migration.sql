-- A single admin manages every store, so AdminUser.storeId becomes optional and
-- its FK detaches (SET NULL) rather than cascading.
ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_storeId_fkey";
ALTER TABLE "AdminUser" ALTER COLUMN "storeId" DROP NOT NULL;
ALTER TABLE "AdminUser"
  ADD CONSTRAINT "AdminUser_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Per-store "Our Story" slides (single language).
CREATE TABLE "StorySlide" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StorySlide_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StorySlide_storeId_idx" ON "StorySlide"("storeId");
ALTER TABLE "StorySlide"
  ADD CONSTRAINT "StorySlide_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
