"use client";

import { useState } from "react";
import { StoreQrCard } from "@/components/admin/StoreQrCard";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { storeTipUrl } from "@/lib/qr";

/**
 * Store-info section: the edit form and its QR code, side by side on desktop and
 * stacked on mobile. Holds the shared "saving" signal so the QR shows a spinner
 * from the moment 保存 is pressed until the new code is ready, and refreshes the
 * QR to the saved name/slug without a full reload.
 */
export function StoreSettings({
  origin,
  store,
}: {
  origin: string;
  store: {
    name: string;
    slug: string;
    googlePlaceId: string | null;
    logoUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
  };
}) {
  const [qrName, setQrName] = useState(store.name);
  const [qrSlug, setQrSlug] = useState(store.slug);
  const [saving, setSaving] = useState(false);

  const tipUrl = storeTipUrl(origin, qrSlug);
  const downloadName = `arigato-qr-${qrSlug}.png`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="lg:min-w-0 lg:flex-1">
        <StoreSettingsForm
          initialName={store.name}
          initialSlug={store.slug}
          initialGooglePlaceId={store.googlePlaceId}
          initialLogoUrl={store.logoUrl}
          initialInstagramUrl={store.instagramUrl}
          initialFacebookUrl={store.facebookUrl}
          onSavingChange={setSaving}
          onSaved={({ name, slug }) => {
            setQrName(name);
            setQrSlug(slug);
          }}
        />
      </div>

      {/* QR code lives with the store because it targets this store's slug. */}
      <div className="border-t border-neutral-200 pt-6 lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <h3 className="text-base font-bold">店舗QRコード</h3>
        <p className="mb-4 text-sm text-neutral-500">
          印刷して店内に置いてください。読み取るとお客様のチップ画面が開きます。
        </p>
        <StoreQrCard storeName={qrName} tipUrl={tipUrl} downloadName={downloadName} loading={saving} />
      </div>
    </div>
  );
}
