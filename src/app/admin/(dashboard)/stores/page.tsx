import { ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Pagination } from "@/components/admin/DataTable";
import { PendingSwap, TableNavProvider } from "@/components/admin/TableNav";
import { TableToolbar } from "@/components/admin/TableToolbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const term = q?.trim();

  const where: Prisma.StoreWhereInput = term
    ? {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.store.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parsePage(pageParam), pageCount);

  const stores = await prisma.store.findMany({
    where,
    select: { id: true, slug: true, name: true, coverImageUrl: true },
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">店舗管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            店舗の追加・編集・削除、店舗情報・ストーリー・QRコードの設定を行います。
          </p>
        </div>
        <Link
          href="/admin/stores/new"
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          新規店舗を追加
        </Link>
      </div>

      <TableNavProvider>
        <TableToolbar searchParam="q" searchPlaceholder="店舗名・URLで検索" />

        <PendingSwap>
          {total === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
              {term ? "条件に一致する店舗はありません。" : "まだ店舗がありません。「新規店舗を追加」から作成してください。"}
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
                      {store.coverImageUrl ? (
                        <Image src={store.coverImageUrl} alt="" fill sizes="48px" className="object-cover" />
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
        </PendingSwap>

        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/stores" query={{ q: term }} />
      </TableNavProvider>
    </div>
  );
}
