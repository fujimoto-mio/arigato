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
  storeId,
  store,
}: {
  origin: string;
  storeId: string;
  store: {
    name: string;
    slug: string;
    googlePlaceId: string | null;
    coverImageUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
  };
}) {
  const [qrName, setQrName] = useState(store.name);
  const [qrSlug, setQrSlug] = useState(store.slug);
  // Mirrors the saved Place ID so the map updates the moment 保存 is pressed,
  // without waiting for the page to re-fetch.
  const [placeId, setPlaceId] = useState(store.googlePlaceId);
  const [saving, setSaving] = useState(false);

  const tipUrl = storeTipUrl(origin, qrSlug);
  const downloadName = `arigato-qr-${qrSlug}.png`;

  // Maps Embed API is free (no billing needed) and centres the map on the store's
  // Place ID with a marker. Needs the key + "Maps Embed API" enabled.
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.replace(/^["']|["']$/g, "");
  const mapSrc =
    placeId && mapsKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=place_id:${encodeURIComponent(placeId)}&zoom=16&language=ja`
      : null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="lg:min-w-0 lg:flex-[7]">
        <StoreSettingsForm
          storeId={storeId}
          initialName={store.name}
          initialSlug={store.slug}
          initialGooglePlaceId={store.googlePlaceId}
          initialCoverImageUrl={store.coverImageUrl}
          initialInstagramUrl={store.instagramUrl}
          initialFacebookUrl={store.facebookUrl}
          onSavingChange={setSaving}
          onSaved={({ name, slug, googlePlaceId }) => {
            setQrName(name);
            setQrSlug(slug);
            setPlaceId(googlePlaceId || null);
          }}
        />
      </div>

      {/* QR code lives with the store because it targets this store's slug;
          the Google map sits right below it. */}
      <div className="border-t border-neutral-200 pt-6 lg:min-w-0 lg:flex-[5] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <h3 className="text-base font-bold">店舗QRコード</h3>
        <p className="mb-4 text-sm text-neutral-500">
          印刷して店内に置いてください。読み取るとお客様のチップ画面が開きます。
        </p>
        <StoreQrCard storeName={qrName} tipUrl={tipUrl} downloadName={downloadName} loading={saving} />

        {/* Google Maps — the store's location by Place ID (口コミ誘導先). */}
        <div className="mt-6 border-t border-neutral-100 pt-6">
          <h3 className="text-base font-bold">Googleマップ</h3>
          <p className="mb-3 text-sm text-neutral-500">Google Place IDで登録された店舗の場所です。</p>
          {mapSrc ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <iframe
                title={`${store.name} の地図`}
                src={mapSrc}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              {placeId
                ? "地図の表示には NEXT_PUBLIC_GOOGLE_MAPS_API_KEY（Maps Embed API）が必要です。"
                : "Google Place IDを設定すると、地図が表示されます。"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
