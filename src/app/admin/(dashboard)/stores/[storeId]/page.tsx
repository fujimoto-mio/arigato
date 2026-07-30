import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteStoreButton } from "@/components/admin/DeleteStoreButton";
import { StoreOperators } from "@/components/admin/StoreOperators";
import { StorePreviewButton } from "@/components/admin/StorePreviewButton";
import { StoreQrCard } from "@/components/admin/StoreQrCard";
import { StoreSettings } from "@/components/admin/StoreSettings";
import { StoreStatusToggle } from "@/components/admin/StoreStatusToggle";
import { StoryEditor, type StorySlideDraft } from "@/components/admin/StoryEditor";
import { requireStoreAccess } from "@/lib/admin/auth";
import { getStore } from "@/lib/admin/store-scope";
import { resolveAppOrigin } from "@/lib/origin";
import { storeTipUrl } from "@/lib/qr";
import { prisma } from "@/lib/prisma";
import { toLocaleText } from "@/lib/story";

export const dynamic = "force-dynamic";

export default async function AdminStoreEditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  // Platform admin → any store; store operator → only their own (else 404).
  const ctx = await requireStoreAccess(storeId);
  const [store, origin] = await Promise.all([getStore(storeId), resolveAppOrigin()]);
  if (!store) {
    notFound();
  }

  // Operator accounts for this store (platform admin manages these).
  const operators = ctx.isPlatformAdmin
    ? await prisma.adminUser.findMany({
        where: { storeId: store.id, role: "store_operator" },
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Story slides are only edited by the operator, so skip the query for admins.
  const slides: StorySlideDraft[] = ctx.isPlatformAdmin
    ? []
    : (await prisma.storySlide.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } })).map(
        (slide) => ({
          title: toLocaleText(slide.title),
          body: toLocaleText(slide.body),
          imageUrl: slide.imageUrl,
        }),
      );

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Store operators land here from the sidebar, so no back link for them. */}
        {ctx.isPlatformAdmin ? (
          <Link
            href="/admin/stores"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            店舗一覧
          </Link>
        ) : null}
        <h1 className={`text-xl font-bold ${ctx.isPlatformAdmin ? "mt-2" : ""}`}>
          {ctx.isPlatformAdmin ? store.name : "店舗設定"}
        </h1>
      </div>

      {/* Platform admin: read-only summary — store info / QR / story are edited by
          the store operator, not here. */}
      {ctx.isPlatformAdmin ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          {/* Header: title + status on the left, preview on the right. */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-neutral-500">お客様用ページ</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  store.status === "suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {store.status === "suspended" ? "Suspended" : "Active"}
              </span>
            </div>
            <StorePreviewButton url={`/s/${store.slug}`} />
          </div>

          {/* QR + URL / note */}
          <div className="mt-3 flex items-center gap-4">
            <StoreQrCard
              storeName={store.name}
              tipUrl={storeTipUrl(origin, store.slug)}
              downloadName={`arigato-qr-${store.slug}.png`}
              size={84}
              imageOnly
            />
            <div className="min-w-0 flex-1">
              <a
                href={`/s/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-mono text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                /s/{store.slug}
              </a>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                QRコードをクリックで拡大。店舗情報・ストーリーの編集は店舗運営者アカウントから行います。
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Store info + QR — store operator edits their own store. */}
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
        </>
      )}

      {/* Store operator accounts — platform admin only (1 account = 1 store). */}
      {ctx.isPlatformAdmin ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">店舗運営者アカウント</h2>
          <p className="mb-4 text-sm text-neutral-500">
            この店舗のみを管理できるアカウントです。作成すると仮パスワードが1度だけ表示されるので、店舗にお渡しください。
          </p>
          <StoreOperators storeId={store.id} initialOperators={operators} />
        </section>
      ) : null}

      {/* Suspend / reactivate — platform admin only. */}
      {ctx.isPlatformAdmin ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">受付の停止 / 再開</h2>
          <p className="mb-4 text-sm text-neutral-500">
            停止するとお客様のチップ画面（QRの遷移先）が一時的に閉じられます。チップ・口コミの履歴や集計は保持されます。
          </p>
          <StoreStatusToggle
            storeId={store.id}
            initialStatus={store.status === "suspended" ? "suspended" : "active"}
          />
        </section>
      ) : null}

      {/* Danger zone — platform admin only (operators can't delete their store). */}
      {ctx.isPlatformAdmin ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-red-700">店舗の削除</h2>
          <p className="mb-4 text-sm text-neutral-500">
            店舗とそのチップ・口コミ・ストーリーをすべて削除します。この操作は取り消せません。
          </p>
          <DeleteStoreButton storeId={store.id} storeName={store.name} />
        </section>
      ) : null}
    </div>
  );
}
