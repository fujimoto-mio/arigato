import { notFound } from "next/navigation";
import { ThankYouClient } from "@/components/ThankYouClient";
import { prisma } from "@/lib/prisma";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipId?: string }>;
}) {
  const { slug } = await params;
  const { tipId } = await searchParams;

  if (!tipId) {
    notFound();
  }

  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: { store: true },
  });

  if (!tip || tip.store.slug !== slug) {
    notFound();
  }

  return <ThankYouClient slug={slug} tipId={tip.id} />;
}
