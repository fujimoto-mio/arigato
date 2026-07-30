-- Store the JST (GMT+9) wall-clock in all timestamp columns as naive timestamps,
-- so the database itself reads in JST. Existing values were UTC instants
-- (timestamptz) — convert them to JST wall-clock, and default new rows to JST.
-- The app treats every stored time as JST (see @/lib/admin/period).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['Store','Tip','Review','AdminUser','StorySlide','PushSubscription','NotificationRead']
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING ("createdAt" AT TIME ZONE ''Asia/Tokyo'')', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "createdAt" SET DEFAULT (now() AT TIME ZONE ''Asia/Tokyo'')', t);
  END LOOP;
END $$;
