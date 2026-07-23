import { notFound } from "next/navigation";
import { GuestFlow } from "@/components/flow/GuestFlow";
import { prisma } from "@/lib/prisma";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; paid?: string }>;
}) {
  const { slug } = await params;
  const { t, paid } = await searchParams;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    notFound();
  }

  return (
    <GuestFlow
      store={{
        slug: store.slug,
        name: store.name,
        logoUrl: store.logoUrl,
        googlePlaceId: store.googlePlaceId,
        instagramUrl: store.instagramUrl,
        facebookUrl: store.facebookUrl,
      }}
      tableLabel={t?.trim() || null}
      resumeTipId={paid?.trim() || null}
    />
  );
}
