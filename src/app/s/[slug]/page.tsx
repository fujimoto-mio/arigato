import { notFound } from "next/navigation";
import { StoreLandingClient } from "@/components/StoreLandingClient";
import { prisma } from "@/lib/prisma";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      staff: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <StoreLandingClient
      slug={store.slug}
      storeName={store.name}
      staff={store.staff.map((member) => ({
        id: member.id,
        name: member.name,
        photoUrl: member.photoUrl,
      }))}
    />
  );
}
