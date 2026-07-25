-- Restore the per-tip table number (dropped earlier, now needed again).
ALTER TABLE "Tip" ADD COLUMN IF NOT EXISTS "tableLabel" TEXT;
