import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAppOrigin } from "@/lib/origin";
import { storeQrDataUrl, storeTipUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { store } = await requireAdmin();

  const origin = await resolveAppOrigin();
  const tipUrl = storeTipUrl(origin, store.slug);
  const qrDataUrl = await storeQrDataUrl(origin, store.slug);

  const downloadName = `arigato-qr-${store.slug}.png`;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-xl font-bold">設定</h1>
      <section>
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

      <section>
        <h2 className="text-lg font-bold">店舗QRコード</h2>
        <p className="mb-4 text-sm text-neutral-500">
          印刷してテーブルに置いてください。読み取るとお客様のチップ画面が開きます。
        </p>

        <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-base font-bold text-neutral-900">{store.name}</p>
          {/* Data URL, so next/image optimisation is neither possible nor useful here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code for ${store.name}`}
            width={220}
            height={220}
            className="rounded-lg"
          />
          <p className="break-all font-mono text-xs text-neutral-500">{tipUrl}</p>
          <a
            href={qrDataUrl}
            download={downloadName}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
          >
            PNGをダウンロード
          </a>
        </div>
      </section>
    </div>
  );
}
