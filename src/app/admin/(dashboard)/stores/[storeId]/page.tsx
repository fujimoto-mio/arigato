import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteStoreButton } from "@/components/admin/DeleteStoreButton";
import { StoreApproveButton } from "@/components/admin/StoreApproveButton";
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

  // The store's email = the operator's own login email (they edit it in 店舗設定).
  const contactEmail = ctx.email ?? store.email;

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
        <>
        {store.status === "pending" ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <h2 className="text-base font-bold text-amber-800">承認待ちの店舗です</h2>
            <p className="mb-4 mt-1 text-sm leading-relaxed text-amber-700">
              自己登録された店舗です。承認すると、お客様用のQRコード・ページが公開されます。
            </p>
            <StoreApproveButton storeId={store.id} />
          </section>
        ) : null}
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          {/* Header: title + status on the left, preview on the right. */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-neutral-500">お客様用ページ</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  store.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : store.status === "suspended"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {store.status === "pending" ? "承認待ち" : store.status === "suspended" ? "停止中" : "受付中"}
              </span>
            </div>
            {store.status === "pending" ? null : <StorePreviewButton url={`/s/${store.slug}`} />}
          </div>

          {/* QR + URL / note — the QR is generated even while pending; the linked
              guest page only goes live once approved. */}
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
              {store.status === "pending" ? (
                <p className="mt-1 text-xs leading-relaxed text-amber-700">
                  承認待ちです。QRコードは発行済みですが、読み取り先のお客様ページは承認後に有効になります。
                </p>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  QRコードをクリックで拡大。店舗情報・ストーリーの編集は店舗運営者アカウントから行います。
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Registration / contact info — the fields the store entered at signup,
            read-only for the platform admin (same fields the operator edits). */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">登録情報</h2>
          <p className="mb-4 text-sm text-neutral-500">店舗登録時に入力された情報です。</p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { label: "会社名", value: store.companyName },
              { label: "担当者名", value: store.contactName },
              { label: "電話番号", value: store.phone },
              { label: "店舗住所", value: store.address },
              { label: "Google Place ID", value: store.googlePlaceId },
              { label: "Instagram", value: store.instagramUrl },
              { label: "Facebook", value: store.facebookUrl },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-0.5 border-b border-neutral-100 pb-2">
                <dt className="text-xs font-medium text-neutral-500">{field.label}</dt>
                <dd className="text-sm break-words text-neutral-800">
                  {field.value ? (
                    /^https?:\/\//.test(field.value) ? (
                      <a
                        href={field.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {field.value}
                      </a>
                    ) : (
                      field.value
                    )
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        </>
      ) : (
        <>
          {store.status === "pending" ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <h2 className="text-base font-bold text-amber-800">承認待ちです</h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                ご登録ありがとうございます。管理者の承認後に、お客様用のQRコード・ページが公開されます。
                承認までの間も店舗情報・ストーリーの編集は可能です。
              </p>
            </section>
          ) : null}

          {/* Store info + QR — store operator edits their own store. */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">店舗情報</h2>
            <p className="mb-4 text-sm text-neutral-500">お客様の画面に表示されます。</p>
            <StoreSettings
              origin={origin}
              storeId={store.id}
              published={store.status === "active"}
              slugLocked={store.status !== "pending"}
              store={{
                name: store.name,
                slug: store.slug,
                googlePlaceId: store.googlePlaceId,
                coverImageUrl: store.coverImageUrl,
                instagramUrl: store.instagramUrl,
                facebookUrl: store.facebookUrl,
                companyName: store.companyName,
                contactName: store.contactName,
                phone: store.phone,
                email: contactEmail,
                address: store.address,
              }}
            />
          </section>

          {/* Story */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">ストーリー</h2>
            <p className="mb-5 text-sm text-neutral-500">
              QRコードから開くお客様の画面に表示される「Our Story」です。未設定の場合は標準のストーリーが表示されます。
            </p>
            <StoryEditor storeId={store.id} slug={store.slug} initialSlides={slides} />
          </section>
        </>
      )}

      {/* Suspend / reactivate — platform admin only, and only once approved. */}
      {ctx.isPlatformAdmin && store.status !== "pending" ? (
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
