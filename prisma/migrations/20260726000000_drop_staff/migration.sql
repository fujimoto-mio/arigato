-- Drop the Staff feature. The product pivoted to a story-first flow with no
-- staff selection, so `Staff` and `Tip.staffId` were left unused (staffId was
-- never written and the roster UI was unreachable).

-- Detach tips from staff, then remove the column + its index.
ALTER TABLE "Tip" DROP CONSTRAINT IF EXISTS "Tip_staffId_fkey";
DROP INDEX IF EXISTS "Tip_staffId_idx";
ALTER TABLE "Tip" DROP COLUMN IF EXISTS "staffId";

-- Remove the staff table (FK from Tip is already gone).
DROP TABLE IF EXISTS "Staff";
