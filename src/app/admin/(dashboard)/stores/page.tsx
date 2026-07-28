import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StoreCreateForm } from "@/components/admin/StoreCreateForm";
import { getAllStores } from "@/lib/admin/store-scope";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const stores = await getAllStores();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">店舗管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            店舗の追加・編集・削除、店舗情報・ストーリー・QRコードの設定を行います。
          </p>
        </div>
        <StoreCreateForm />
      </div>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
          まだ店舗がありません。「新規店舗を追加」から作成してください。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`/admin/stores/${store.id}`}
                className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-[var(--color-accent)]/40 hover:shadow-md"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {store.logoUrl ? (
                    <Image src={store.logoUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg">🏠</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-neutral-900">{store.name}</p>
                  <p className="truncate font-mono text-xs text-neutral-500">/s/{store.slug}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
