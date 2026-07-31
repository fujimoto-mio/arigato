-- Soft delete for stores: a "deleted" status + a deletedAt marker. Stores are
-- never hard-deleted, so their tips/reviews/history are preserved.
ALTER TYPE "StoreStatus" ADD VALUE IF NOT EXISTS 'deleted';
ALTER TABLE "Store" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
