import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteStoreButton } from "@/components/admin/DeleteStoreButton";
import { StoreSettings } from "@/components/admin/StoreSettings";
import { StoryEditor, type StorySlideDraft } from "@/components/admin/StoryEditor";
import { getStore } from "@/lib/admin/store-scope";
import { resolveAppOrigin } from "@/lib/origin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStoreEditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [store, origin] = await Promise.all([getStore(storeId), resolveAppOrigin()]);
  if (!store) {
    notFound();
  }

  const slides: StorySlideDraft[] = (
    await prisma.storySlide.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } })
  ).map((slide) => ({ title: slide.title, body: slide.body, imageUrl: slide.imageUrl }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          店舗一覧
        </Link>
        <h1 className="mt-2 text-xl font-bold">{store.name}</h1>
      </div>

      {/* Store info + QR */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗情報</h2>
        <p className="mb-4 text-sm text-neutral-500">お客様の画面に表示されます。</p>
        <StoreSettings
          origin={origin}
          storeId={store.id}
          store={{
            name: store.name,
            slug: store.slug,
            googlePlaceId: store.googlePlaceId,
            coverImageUrl: store.coverImageUrl,
            instagramUrl: store.instagramUrl,
            facebookUrl: store.facebookUrl,
          }}
        />
      </section>

      {/* Story */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">ストーリー</h2>
        <p className="mb-5 text-sm text-neutral-500">
          QRコードから開くお客様の画面に表示される「Our Story」です。未設定の場合は標準のストーリーが表示されます。
        </p>
        <StoryEditor
          storeId={store.id}
          storeName={store.name}
          coverImageUrl={store.coverImageUrl}
          initialSlides={slides}
        />
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-red-700">店舗の削除</h2>
        <p className="mb-4 text-sm text-neutral-500">
          店舗とそのチップ・口コミ・ストーリーをすべて削除します。この操作は取り消せません。
        </p>
        <DeleteStoreButton storeId={store.id} storeName={store.name} />
      </section>
    </div>
  );
}
