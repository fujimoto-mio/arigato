-- Use timestamptz (stores UTC instants) and set the database timezone to JST so
-- Supabase Studio / raw SQL display Asia/Tokyo. Convert the prior naive-JST
-- wall-clock values back to true instants by interpreting them as JST.
-- The app pins its own session to UTC (see src/lib/prisma.ts) so Prisma reads
-- these instants correctly, then converts to JST for display.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['Store','Tip','Review','AdminUser','StorySlide','PushSubscription','NotificationRead']
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "createdAt" DROP DEFAULT', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING ("createdAt" AT TIME ZONE ''Asia/Tokyo'')', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "createdAt" SET DEFAULT now()', t);
  END LOOP;
END $$;

ALTER DATABASE postgres SET timezone TO 'Asia/Tokyo';
