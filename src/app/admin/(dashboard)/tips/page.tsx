import { Stars } from "@/components/admin/Stars";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function tableText(label: string | null) {
  return label ? `${label}番` : "—";
}

export default async function AdminTipsPage() {
  const { store } = await requireAdmin();

  const [tips, agg] = await Promise.all([
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded" },
      include: { review: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.tip.aggregate({
      where: { storeId: store.id, status: "succeeded" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">チップ履歴</h1>
        <p className="mt-1 text-sm text-neutral-500">
          累計 {agg._count} 件 ・ 合計 {formatYen(agg._sum.amount ?? 0)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-neutral-100 text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">受信日時</th>
              <th className="px-4 py-3 font-medium">テーブル番号</th>
              <th className="px-4 py-3 font-medium">支払方法</th>
              <th className="px-4 py-3 font-medium">チップ金額</th>
              <th className="px-4 py-3 font-medium">評価</th>
              <th className="px-4 py-3 font-medium">口コミ</th>
            </tr>
          </thead>
          <tbody>
            {tips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  まだチップはありません。
                </td>
              </tr>
            ) : (
              tips.map((tip) => (
                <tr key={tip.id} className="border-b border-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatTokyoTime(tip.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{tableText(tip.tableLabel)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                    {tip.paymentMethod === "card" ? "カード" : "現金"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-bold">{formatYen(tip.amount)}</span>
                    <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {tip.review ? (
                      <span className="flex items-center gap-1">
                        <Stars rating={tip.review.rating} /> <span className="text-xs">{tip.review.rating.toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-neutral-600">{tip.review?.comment ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
