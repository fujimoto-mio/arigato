import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js reads .env.local itself; the Prisma CLI (migrate/generate) doesn't,
// so load it here for `prisma migrate`/`prisma generate` runs.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    loadEnv({ path: file, override: false });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pooled) connection — migrations need session-level locks
    // that Supabase's pgbouncer pooler doesn't support.
    url: env("DIRECT_URL"),
  },
});
