-- Store timestamps as timestamptz (still UTC internally) and display the database
-- in Asia/Tokyo, so raw SQL / Supabase Studio show JST. Existing naive timestamps
-- were stored as UTC wall-clock, so reinterpret them AT TIME ZONE 'UTC'.
ALTER TABLE "Store" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Tip" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Review" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "AdminUser" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "StorySlide" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "PushSubscription" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "NotificationRead" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- Make the whole database display in JST for future connections / Studio.
ALTER DATABASE postgres SET timezone TO 'Asia/Tokyo';
