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

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { storySlides: { orderBy: { sortOrder: "asc" } } },
  });
  if (!store) {
    notFound();
  }

  return (
    <GuestFlow
      store={{
        slug: store.slug,
        name: store.name,
        coverImageUrl: store.coverImageUrl,
        googlePlaceId: store.googlePlaceId,
        instagramUrl: store.instagramUrl,
        facebookUrl: store.facebookUrl,
        // Per-store "Our Story" slides; empty falls back to the stock story.
        storySlides: store.storySlides.map((slide) => ({
          title: slide.title,
          body: slide.body,
          imageUrl: slide.imageUrl,
        })),
      }}
      tableLabel={t?.trim() || null}
      resumeTipId={paid?.trim() || null}
    />
  );
}
