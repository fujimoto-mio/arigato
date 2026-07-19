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

  const staffNames = ["Tanaka", "Sato", "Suzuki", "Yamada"];
  for (const [index, name] of staffNames.entries()) {
    await prisma.staff.upsert({
      where: { id: `${store.id}-seed-${index}` },
      update: {},
      create: {
        id: `${store.id}-seed-${index}`,
        storeId: store.id,
        name,
        sortOrder: index,
      },
    });
  }

  console.log(`Seeded store "${store.slug}" with ${staffNames.length} staff.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
