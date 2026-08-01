-- Optimize the hot read paths (tip history/aggregates, review lists, support list).
-- Replaces single-column storeId indexes with composites that also cover the
-- status filter and createdAt/updatedAt ordering these queries always apply.

-- Tip: scoped history/aggregates (storeId + status="succeeded" ORDER BY createdAt),
-- plus the all-stores admin view (no storeId).
DROP INDEX IF EXISTS "Tip_storeId_idx";
CREATE INDEX IF NOT EXISTS "Tip_storeId_status_createdAt_idx" ON "Tip" ("storeId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Tip_status_createdAt_idx" ON "Tip" ("status", "createdAt");

-- Review: public/private lists paginate by createdAt within a store.
DROP INDEX IF EXISTS "Review_storeId_idx";
CREATE INDEX IF NOT EXISTS "Review_storeId_createdAt_idx" ON "Review" ("storeId", "createdAt");

-- SupportThread: operator list scoped by store, ordered by most-recent activity.
DROP INDEX IF EXISTS "SupportThread_storeId_idx";
CREATE INDEX IF NOT EXISTS "SupportThread_storeId_updatedAt_idx" ON "SupportThread" ("storeId", "updatedAt");
