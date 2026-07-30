import { notFound } from "next/navigation";
import { GuestFlow } from "@/components/flow/GuestFlow";
import { prisma } from "@/lib/prisma";
import { toLocaleText } from "@/lib/story";

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
  if (!store || store.deletedAt) {
    notFound();
  }

  // Suspended by the platform admin — the tip page is temporarily closed.
  if (store.status === "suspended") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 bg-white px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-neutral-900">受付を停止しています</h1>
        <p className="text-sm leading-relaxed text-neutral-500">
          ただいまこちらの店舗ではチップの受付を一時停止しています。
        </p>
      </div>
    );
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
        // Per-store "Our Story" slides (locale maps); empty falls back to stock.
        storySlides: store.storySlides.map((slide) => ({
          title: toLocaleText(slide.title),
          body: toLocaleText(slide.body),
          imageUrl: slide.imageUrl,
        })),
      }}
      tableLabel={t?.trim() || null}
      resumeTipId={paid?.trim() || null}
    />
  );
}
