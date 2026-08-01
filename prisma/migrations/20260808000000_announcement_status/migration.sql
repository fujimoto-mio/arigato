-- Announcement status: draft / published / deleted (existing rows → published).
CREATE TYPE "AnnouncementStatus" AS ENUM ('draft', 'published', 'deleted');
ALTER TABLE "Announcement" ADD COLUMN "status" "AnnouncementStatus" NOT NULL DEFAULT 'published';
