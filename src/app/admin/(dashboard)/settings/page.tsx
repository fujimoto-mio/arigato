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
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-bold">Store settings</h2>
        <p className="mb-4 text-sm text-neutral-500">Shown to guests on the tip screen.</p>
        <StoreSettingsForm
          initialName={store.name}
          initialGooglePlaceId={store.googlePlaceId}
          initialLogoUrl={store.logoUrl}
        />
      </section>

      <section>
        <h2 className="text-lg font-bold">Table QR code</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Print this and place it on the table. Scanning it opens your tip screen.
        </p>

        <form method="get" className="mb-4 flex items-end gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Table label (optional)
            <input
              name="table"
              defaultValue={tableLabel ?? ""}
              placeholder="e.g. 5"
              className="mt-1 w-40 rounded-lg border border-neutral-300 p-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Generate
          </button>
        </form>

        <div className="flex flex-col items-start gap-3 rounded-xl border border-neutral-200 p-4">
          {/* Data URL, so next/image optimisation is neither possible nor useful here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code for ${store.name}${tableLabel ? ` table ${tableLabel}` : ""}`}
            width={240}
            height={240}
            className="rounded-lg"
          />
          <p className="break-all font-mono text-xs text-neutral-500">{tipUrl}</p>
          <a
            href={qrDataUrl}
            download={downloadName}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Download PNG
          </a>
        </div>
      </section>
    </div>
  );
}
