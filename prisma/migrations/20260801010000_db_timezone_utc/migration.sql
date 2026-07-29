-- The database session must stay UTC: Prisma over the Supabase (pgbouncer) pooler
-- misreads timestamptz by the offset when the session timezone is non-UTC, which
-- would shift every time in the app. JST is applied in the app layer instead
-- (see @/lib/admin/period). Columns remain timestamptz (stored as UTC).
ALTER DATABASE postgres SET timezone TO 'UTC';
