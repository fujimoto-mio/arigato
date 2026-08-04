import { Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { StoreApproveButton } from "@/components/admin/StoreApproveButton";
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
  if (status === "deleted")
    return { cls: "bg-neutral-50 text-neutral-500 ring-neutral-200", dot: "bg-neutral-400", label: "削除済み" };
  if (status === "suspended")
    return { cls: "bg-rose-50 text-rose-600 ring-rose-500/20", dot: "bg-rose-500", label: "停止中" };
  if (status === "pending")
    return { cls: "bg-amber-50 text-amber-700 ring-amber-500/20", dot: "bg-amber-500", label: "承認待ち" };
  return { cls: "bg-emerald-50 text-emerald-700 ring-emerald-500/20", dot: "bg-emerald-500", label: "受付中" };
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
    statusParam === "pending" ||
    statusParam === "active" ||
    statusParam === "suspended" ||
    statusParam === "deleted"
      ? statusParam
      : undefined;

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
    select: {
      id: true,
      slug: true,
      name: true,
      coverImageUrl: true,
      status: true,
      companyName: true,
      contactName: true,
      phone: true,
      address: true,
    },
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

  const textOrDash = (value: string | null) =>
    value ? <span className="text-neutral-700">{value}</span> : <span className="text-neutral-400">—</span>;

  const columns: Column<StoreRow>[] = [
    {
      key: "store",
      header: "店舗 / 会社名",
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
          <div className="min-w-0">
            {store.status === "deleted" ? (
              <span className="block truncate font-bold text-neutral-500">{store.name}</span>
            ) : (
              <Link
                href={`/admin/stores/${store.id}`}
                className="block truncate font-bold text-neutral-900 hover:text-[var(--color-accent)] hover:underline"
              >
                {store.name}
              </Link>
            )}
            <span className="block truncate text-xs text-neutral-400">{store.companyName ?? "—"}</span>
          </div>
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
      key: "contact",
      header: "担当者名 / 運営者メール",
      className: "min-w-[190px]",
      render: (store) => {
        const emails = emailsByStore.get(store.id) ?? [];
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-neutral-700">{store.contactName ?? "—"}</span>
            {emails.length === 0 ? (
              <span className="text-xs text-neutral-400">—</span>
            ) : (
              emails.map((email) => (
                <span key={email} className="truncate text-xs text-neutral-400">
                  {email}
                </span>
              ))
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "電話番号",
      className: "min-w-[130px] whitespace-nowrap tabular-nums",
      render: (store) => textOrDash(store.phone),
    },
    {
      key: "address",
      header: "店舗住所",
      className: "min-w-[200px] max-w-[280px]",
      render: (store) =>
        store.address ? (
          // Wrap to the column width, growing to as many lines as needed.
          <span className="block whitespace-normal break-words text-neutral-700">{store.address}</span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
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
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${badge.cls}`}
          >
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
      render: (store) => {
        if (store.status === "deleted") return <span className="text-xs text-neutral-300">—</span>;
        return (
          <div className="flex items-center justify-end gap-3">
            {store.status === "pending" ? <StoreApproveButton storeId={store.id} variant="link" /> : null}
            <Link
              href={`/admin/stores/${store.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              編集
            </Link>
          </div>
        );
      },
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
                { value: "pending", label: "承認待ち" },
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
          minWidthClass="min-w-[1200px]"
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
