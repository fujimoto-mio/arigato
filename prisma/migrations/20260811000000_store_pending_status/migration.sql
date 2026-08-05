-- Self-registration approval flow: a new "pending" store status. Self-registered
-- stores start pending (guest QR/page not published) until the admin approves.
ALTER TYPE "StoreStatus" ADD VALUE IF NOT EXISTS 'pending';
