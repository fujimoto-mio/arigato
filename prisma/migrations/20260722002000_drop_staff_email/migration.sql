-- Revert: staff do not need an email column after all.
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "email";
