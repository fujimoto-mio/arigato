import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // Cached on globalThis so dev hot reload doesn't exhaust the connection pool.
  globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Lazily constructed Prisma client.
 *
 * Connecting at module scope would throw during `next build`, which imports
 * route modules to collect page data but never queries the database. The proxy
 * defers construction to first use, so call sites keep using `prisma.model` and
 * a missing DATABASE_URL fails at request time with a clear message.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, property) => {
    const instance = getPrismaClient();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
