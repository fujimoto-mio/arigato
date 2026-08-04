import { Clock, PauseCircle } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Sakura } from "@/components/brand/Cityscape";
import { GuestFlow } from "@/components/flow/GuestFlow";
import { LogoBadge } from "@/components/flow/brand";
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

  // Not yet published: a self-registered store awaiting admin approval, or one the
  // admin has suspended. Either way the tip page is closed.
  if (store.status === "pending" || store.status === "suspended") {
    const pending = store.status === "pending";
    return (
      <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#faf7f1] px-8 text-center">
        <Sakura className="pointer-events-none absolute left-6 top-12 text-[#f4c4cf] opacity-70" size={30} />
        <Sakura className="pointer-events-none absolute right-8 top-20 text-[#f6d0b0] opacity-60" size={22} />
        <Sakura className="pointer-events-none absolute right-16 top-10 text-[#f4c4cf] opacity-50" size={16} />

        <div className="relative z-10 flex flex-col items-center">
          <LogoBadge size={64} />
          <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
            {pending ? (
              <Clock className="h-8 w-8" strokeWidth={1.6} />
            ) : (
              <PauseCircle className="h-8 w-8" strokeWidth={1.6} />
            )}
          </div>
          <h1 className="mt-5 text-xl font-bold text-neutral-900">
            {pending ? "準備中です" : "受付を停止しています"}
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
            {pending
              ? "ただいまこちらの店舗ページは準備中です。公開までしばらくお待ちください。"
              : "ただいまこちらの店舗ではチップの受付を一時停止しています。"}
          </p>
        </div>

        <Image
          src="/lp/skyline.png"
          alt=""
          aria-hidden="true"
          width={889}
          height={345}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full opacity-80"
        />
      </main>
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
