import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const store = await prisma.store.upsert({
    where: { slug: "kokoro" },
    update: {},
    create: {
      slug: "kokoro",
      name: "KOKORO",
      googlePlaceId: null,
    },
  });

  console.log(`Seeded store "${store.slug}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
