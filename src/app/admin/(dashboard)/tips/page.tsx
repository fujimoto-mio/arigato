import { Coins, CreditCard } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { DetailRow } from "@/components/admin/RowModal";
import { Stars } from "@/components/admin/Stars";
import { TableNavProvider } from "@/components/admin/TableNav";
import { TableToolbar } from "@/components/admin/TableToolbar";
import { formatTokyoTime, formatUsdApprox, formatYen } from "@/lib/admin/period";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type TipRow = {
  id: string;
  createdAt: Date;
  storeName: string;
  paymentMethod: "cash" | "card";
  amount: number;
  rating: number | null;
  comment: string | null;
};

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; method?: string }>;
}) {
  const { activeStoreId } = await getActiveStore();
  const { page: pageParam, q, method } = await searchParams;

  const where: Prisma.TipWhereInput = { ...storeScope(activeStoreId), status: "succeeded" };
  if (method === "card" || method === "cash") where.paymentMethod = method;

  const term = q?.trim();
  if (term) {
    where.OR = [
      { store: { name: { contains: term, mode: "insensitive" } } },
      { review: { comment: { contains: term, mode: "insensitive" } } },
    ];
  }

  // Count first so we can clamp an out-of-range page before fetching rows.
  const total = await prisma.tip.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parsePage(pageParam), pageCount);

  const [tips, agg] = await Promise.all([
    prisma.tip.findMany({
      where,
      include: { review: true, store: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tip.aggregate({ where, _sum: { amount: true } }),
  ]);

  const rows: TipRow[] = tips.map((tip) => ({
    id: tip.id,
    createdAt: tip.createdAt,
    storeName: tip.store.name,
    paymentMethod: tip.paymentMethod,
    amount: tip.amount,
    rating: tip.review?.rating ?? null,
    comment: tip.review?.comment ?? null,
  }));

  const columns: Column<TipRow>[] = [
    {
      key: "createdAt",
      header: "受信日時",
      className: "whitespace-nowrap text-neutral-600",
      render: (row) => formatTokyoTime(row.createdAt),
    },
    {
      key: "store",
      header: "店舗",
      className: "whitespace-nowrap font-medium",
      render: (row) => row.storeName,
    },
    {
      key: "method",
      header: "支払方法",
      className: "whitespace-nowrap text-neutral-600",
      render: (row) =>
        row.paymentMethod === "card" ? (
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.75} /> カード
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-neutral-500" strokeWidth={1.75} /> 現金
          </span>
        ),
    },
    {
      key: "amount",
      header: "チップ金額",
      className: "whitespace-nowrap",
      render: (row) => (
        <>
          <span className="font-bold">{formatYen(row.amount)}</span>
          {row.amount > 0 ? (
            <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(row.amount)}）</span>
          ) : null}
        </>
      ),
    },
    {
      key: "rating",
      header: "評価",
      className: "whitespace-nowrap",
      render: (row) =>
        row.rating !== null ? (
          <span className="flex items-center gap-1">
            <Stars rating={row.rating} /> <span className="text-xs">{row.rating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: "comment",
      header: "口コミ",
      className: "min-w-[200px] max-w-[340px] whitespace-pre-line leading-relaxed text-neutral-700",
      render: (row) => row.comment ?? <span className="text-neutral-400">—</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">チップ履歴</h1>
        <p className="mt-1 text-sm text-neutral-500">
          該当 {total} 件 ・ 合計 {formatYen(agg._sum.amount ?? 0)}
        </p>
      </div>

      {/* Toolbar + table share one navigation transition so search/filter/page
          changes keep the header and pagination on screen with a spinner. */}
      <TableNavProvider>
        <TableToolbar
          searchParam="q"
          searchPlaceholder="店舗名・口コミで検索"
          filters={[
            {
              param: "method",
              label: "支払方法",
              options: [
                { value: "", label: "すべて" },
                { value: "card", label: "カード" },
                { value: "cash", label: "現金" },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyLabel={term || method ? "条件に一致するチップはありません。" : "まだチップはありません。"}
          minWidthClass="min-w-[760px]"
          bodyCellClassName="align-top"
          renderDetail={(row) => ({
            title: "チップ・口コミ詳細",
            body: (
              <>
                <div className="rounded-xl border border-neutral-100 p-5 text-center">
                  <p className="text-4xl font-bold text-[var(--color-accent)]">{formatYen(row.amount)}</p>
                  {row.amount > 0 ? (
                    <p className="mt-1 text-xs text-neutral-400">（{formatUsdApprox(row.amount)}）</p>
                  ) : null}
                </div>
                <dl className="mt-4 divide-y divide-neutral-100 text-sm">
                  <DetailRow label="店舗" value={row.storeName} />
                  <DetailRow label="受信日時" value={formatTokyoTime(row.createdAt)} />
                  <DetailRow label="支払方法" value={row.paymentMethod === "card" ? "カード" : "現金"} />
                  <DetailRow label="評価">
                    {row.rating !== null ? (
                      <span className="flex items-center justify-end gap-1">
                        <Stars rating={row.rating} /> {row.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </DetailRow>
                </dl>
                {row.comment ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-neutral-700">口コミ内容</p>
                    <p className="mt-2 whitespace-pre-line rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800">
                      {row.comment}
                    </p>
                  </div>
                ) : null}
              </>
            ),
          })}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/tips"
          query={{ q: term, method }}
        />
      </TableNavProvider>
    </div>
  );
}
