import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { PushToggle } from "@/components/admin/PushToggle";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAppOrigin } from "@/lib/origin";
import { storeQrDataUrl, storeTipUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { store } = await requireAdmin();
  const { table } = await searchParams;
  const tableLabel = table?.trim() || null;

  const origin = await resolveAppOrigin();
  const tipUrl = storeTipUrl(origin, store.slug, tableLabel);
  const qrDataUrl = await storeQrDataUrl(origin, store.slug, tableLabel);

  const downloadName = tableLabel
    ? `arigato-qr-${store.slug}-table-${tableLabel}.png`
    : `arigato-qr-${store.slug}.png`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">設定</h1>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗情報</h2>
        <p className="mb-4 text-sm text-neutral-500">お客様の画面に表示されます。</p>
        <StoreSettingsForm
          initialName={store.name}
          initialGooglePlaceId={store.googlePlaceId}
          initialLogoUrl={store.logoUrl}
          initialInstagramUrl={store.instagramUrl}
          initialFacebookUrl={store.facebookUrl}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">通知設定</h2>
        <p className="mb-4 text-sm text-neutral-500">
          新しいチップ・口コミが届いたときに、この端末へプッシュ通知を送ります。端末ごとに設定が必要です。
        </p>
        <PushToggle variant="switch" />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">パスワード変更</h2>
        <p className="mb-4 text-sm text-neutral-500">ログインに使用するパスワードを変更します。</p>
        <ChangePasswordForm />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">テーブルQRコード</h2>
        <p className="mb-4 text-sm text-neutral-500">
          印刷してテーブルに置いてください。読み取るとお客様のチップ画面が開きます。
        </p>

        <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-neutral-700">
            テーブル番号（任意）
            <input
              name="table"
              defaultValue={tableLabel ?? ""}
              placeholder="例：5"
              className="mt-1 block w-full rounded-lg border border-neutral-300 p-2 text-sm sm:w-40"
            />
          </label>
          <button
            type="submit"
            className="w-full shrink-0 whitespace-nowrap rounded-full border border-neutral-300 px-6 py-2 text-sm font-medium hover:bg-neutral-100 sm:w-auto"
          >
            生成
          </button>
        </form>

        <div className="flex max-w-xs flex-col items-center gap-3 rounded-xl bg-neutral-50 p-6 text-center">
          <p className="text-base font-bold text-neutral-900">
            {store.name}
            {tableLabel ? <span className="ml-1 text-sm font-normal text-neutral-500">（{tableLabel}番）</span> : null}
          </p>
          {/* Data URL, so next/image optimisation is neither possible nor useful here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code for ${store.name}${tableLabel ? ` table ${tableLabel}` : ""}`}
            width={220}
            height={220}
            className="rounded-lg"
          />
          <p className="break-all font-mono text-xs text-neutral-500">{tipUrl}</p>
          <a
            href={qrDataUrl}
            download={downloadName}
            className="w-full rounded-full bg-neutral-900 px-5 py-2 text-center text-sm font-semibold text-white"
          >
            PNGをダウンロード
          </a>
        </div>
      </section>
    </div>
  );
}
