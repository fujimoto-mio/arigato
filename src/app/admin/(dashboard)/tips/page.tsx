import type { Prisma } from "@prisma/client";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { Stars } from "@/components/admin/Stars";
import { TableNavProvider } from "@/components/admin/TableNav";
import { TableToolbar } from "@/components/admin/TableToolbar";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type TipRow = {
  id: string;
  createdAt: Date;
  tableLabel: string | null;
  paymentMethod: "cash" | "card";
  amount: number;
  rating: number | null;
  comment: string | null;
};

function tableText(label: string | null) {
  return label ? `${label}番` : "—";
}

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; method?: string }>;
}) {
  const { store } = await requireAdmin();
  const { page: pageParam, q, method } = await searchParams;

  const where: Prisma.TipWhereInput = { storeId: store.id, status: "succeeded" };
  if (method === "card" || method === "cash") where.paymentMethod = method;

  const term = q?.trim();
  if (term) {
    where.OR = [
      { tableLabel: { contains: term, mode: "insensitive" } },
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
      include: { review: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tip.aggregate({ where, _sum: { amount: true } }),
  ]);

  const rows: TipRow[] = tips.map((tip) => ({
    id: tip.id,
    createdAt: tip.createdAt,
    tableLabel: tip.tableLabel,
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
      key: "table",
      header: "テーブル番号",
      className: "whitespace-nowrap",
      render: (row) => tableText(row.tableLabel),
    },
    {
      key: "method",
      header: "支払方法",
      className: "whitespace-nowrap text-neutral-600",
      render: (row) => (row.paymentMethod === "card" ? "カード" : "現金"),
    },
    {
      key: "amount",
      header: "チップ金額",
      className: "whitespace-nowrap",
      render: (row) => (
        <>
          <span className="font-bold">{formatYen(row.amount)}</span>
          <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(row.amount)}）</span>
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
      className: "max-w-[220px] truncate text-neutral-600",
      render: (row) => row.comment ?? "—",
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
          searchPlaceholder="テーブル番号・口コミで検索"
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
          minWidthClass="min-w-[680px]"
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
