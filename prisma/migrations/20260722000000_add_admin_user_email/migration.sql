-- Add email column, backfilled from Supabase's own auth.users table.
ALTER TABLE "AdminUser" ADD COLUMN "email" TEXT;

UPDATE "AdminUser" a
SET "email" = u.email
FROM auth.users u
WHERE u.id::text = a."supabaseUserId";

ALTER TABLE "AdminUser" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
