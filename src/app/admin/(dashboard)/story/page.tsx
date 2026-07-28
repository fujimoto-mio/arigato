import { StoryEditor, type StorySlideDraft } from "@/components/admin/StoryEditor";
import { getActiveStore } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStoryPage() {
  const { activeStore } = await getActiveStore();

  const slides: StorySlideDraft[] = activeStore
    ? (
        await prisma.storySlide.findMany({
          where: { storeId: activeStore.id },
          orderBy: { sortOrder: "asc" },
        })
      ).map((slide) => ({ title: slide.title, body: slide.body, imageUrl: slide.imageUrl }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">ストーリー</h1>
        <p className="mt-1 text-sm text-neutral-500">
          QRコードから開くお客様の画面に表示される「Our Story」を、店舗ごとに設定します。
          {activeStore ? ` 現在の店舗：${activeStore.name}` : ""}
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        {activeStore ? (
          <>
            <p className="mb-5 text-sm text-neutral-500">
              スライドを並べると、お客様は上から順にスクロールしながら読みます。未設定の場合は標準のストーリーが表示されます。
            </p>
            <StoryEditor initialSlides={slides} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            ストーリーを編集するには、上部のメニューから店舗を選択してください。
          </div>
        )}
      </section>
    </div>
  );
}
