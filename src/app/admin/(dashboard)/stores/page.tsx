import { Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { TableNavProvider } from "@/components/admin/TableNav";
import { TableToolbar } from "@/components/admin/TableToolbar";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { formatUsd } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function statusBadge(status: string) {
  if (status === "deleted") return { cls: "bg-neutral-200 text-neutral-600", dot: "bg-neutral-400", label: "削除済み" };
  if (status === "suspended") return { cls: "bg-red-100 text-red-700", dot: "bg-red-500", label: "停止中" };
  return { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: "受付中" };
}

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requirePlatformAdmin(); // store management is platform-admin only
  const { page: pageParam, q, status: statusParam } = await searchParams;
  const term = q?.trim();
  const status =
    statusParam === "active" || statusParam === "suspended" || statusParam === "deleted" ? statusParam : undefined;

  // Deleted stores are hidden by default; the "Deleted" filter surfaces them.
  const base: Prisma.StoreWhereInput =
    status === "deleted" ? { status: "deleted" } : { deletedAt: null, ...(status ? { status } : {}) };
  const where: Prisma.StoreWhereInput = {
    ...base,
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.store.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parsePage(pageParam), pageCount);

  const stores = await prisma.store.findMany({
    where,
    select: { id: true, slug: true, name: true, coverImageUrl: true, status: true },
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Per-store details: operator emails, received-tip totals, review stats.
  const storeIds = stores.map((s) => s.id);
  const [operatorRows, tipStats, reviewStats] = await Promise.all([
    prisma.adminUser.findMany({
      where: { storeId: { in: storeIds }, role: "store_operator" },
      select: { storeId: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tip.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds }, status: "succeeded" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.review.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _count: true,
      _avg: { rating: true },
    }),
  ]);
  const emailsByStore = new Map<string, string[]>();
  for (const o of operatorRows) {
    if (!o.storeId) continue;
    const list = emailsByStore.get(o.storeId) ?? [];
    list.push(o.email);
    emailsByStore.set(o.storeId, list);
  }
  const tipByStore = new Map(tipStats.map((t) => [t.storeId, { count: t._count, total: t._sum.amount ?? 0 }]));
  const reviewByStore = new Map(reviewStats.map((r) => [r.storeId, { count: r._count, avg: r._avg.rating ?? 0 }]));

  type StoreRow = (typeof stores)[number];

  const columns: Column<StoreRow>[] = [
    {
      key: "store",
      header: "店舗",
      className: "min-w-[200px]",
      render: (store) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            {store.coverImageUrl ? (
              <Image src={store.coverImageUrl} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">🏠</span>
            )}
          </div>
          {store.status === "deleted" ? (
            <span className="truncate font-bold text-neutral-500">{store.name}</span>
          ) : (
            <Link
              href={`/admin/stores/${store.id}`}
              className="truncate font-bold text-neutral-900 hover:text-[var(--color-accent)] hover:underline"
            >
              {store.name}
            </Link>
          )}
        </div>
      ),
    },
    {
      key: "url",
      header: "URL",
      className: "whitespace-nowrap",
      render: (store) => (
        <a
          href={`/s/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[var(--color-accent)] hover:underline"
        >
          /s/{store.slug}
        </a>
      ),
    },
    {
      key: "email",
      header: "運営者メール",
      className: "min-w-[180px]",
      render: (store) => {
        const emails = emailsByStore.get(store.id) ?? [];
        if (emails.length === 0) return <span className="text-neutral-400">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {emails.map((email) => (
              <span key={email} className="truncate text-neutral-700">
                {email}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "tipCount",
      header: "チップ件数",
      className: "whitespace-nowrap tabular-nums text-neutral-700",
      render: (store) => {
        const count = tipByStore.get(store.id)?.count ?? 0;
        return count > 0 ? `${count.toLocaleString("ja-JP")} 件` : <span className="text-neutral-400">—</span>;
      },
    },
    {
      key: "amount",
      header: "金額",
      className: "whitespace-nowrap font-semibold tabular-nums text-neutral-800",
      render: (store) => formatUsd(tipByStore.get(store.id)?.total ?? 0),
    },
    {
      key: "rating",
      header: "平均評価",
      className: "whitespace-nowrap",
      render: (store) => {
        const r = reviewByStore.get(store.id);
        if (!r || r.count === 0) return <span className="text-neutral-400">—</span>;
        return (
          <span className="inline-flex items-center gap-1 tabular-nums text-neutral-700">
            <span className="text-[var(--color-accent)]">★</span>
            {r.avg.toFixed(1)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "状態",
      className: "whitespace-nowrap",
      render: (store) => {
        const badge = statusBadge(store.status);
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "",
      className: "whitespace-nowrap text-right",
      render: (store) =>
        store.status === "deleted" ? (
          <span className="text-xs text-neutral-300">—</span>
        ) : (
          <Link
            href={`/admin/stores/${store.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            編集
          </Link>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">店舗管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          店舗の追加・受付の停止/再開・削除、店舗運営者アカウントの管理を行います。店舗情報やストーリーの編集は各店舗の運営者が行います。
        </p>
      </div>

      <TableNavProvider>
        <TableToolbar
          searchParam="q"
          searchPlaceholder="店舗名・URLで検索"
          filters={[
            {
              param: "status",
              label: "状態",
              options: [
                { value: "", label: "すべて" },
                { value: "active", label: "受付中" },
                { value: "suspended", label: "停止中" },
                { value: "deleted", label: "削除済み" },
              ],
            },
          ]}
          actions={
            <Link
              href="/admin/stores/new"
              className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              新規店舗を追加
            </Link>
          }
        />

        <DataTable
          columns={columns}
          rows={stores}
          rowKey={(store) => store.id}
          rowClassName={(store) => (store.status === "deleted" ? "opacity-60" : "")}
          emptyLabel={
            term || status
              ? "条件に一致する店舗はありません。"
              : "まだ店舗がありません。「新規店舗を追加」から作成してください。"
          }
          minWidthClass="min-w-[960px]"
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/stores"
          query={{ q: term, status }}
        />
      </TableNavProvider>
    </div>
  );
}
