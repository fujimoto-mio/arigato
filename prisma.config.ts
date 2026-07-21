import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local itself; the Prisma CLI (migrate/generate) doesn't,
// so load it here for `prisma migrate`/`prisma generate` runs.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    loadEnv({ path: file, override: false });
  }
}

// Direct (non-pooled) connection — migrations need session-level locks that
// Supabase's pgbouncer pooler doesn't support.
//
// Declared only when present: `prisma generate` runs on every deploy (via
// postinstall) and needs no database, so requiring this here would make the
// build depend on a migration-only secret. `prisma migrate` still fails loudly
// if it is missing.
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
});
