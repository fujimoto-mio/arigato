"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PayoutRow = {
  id: string;
  amount: number;
  periodStart: string | null;
  periodEnd: string | null;
  note: string | null;
  createdAt: string;
};

// USD cents → "$1,234.00". Unlike admin/period's formatUsd, a $0 shows as "$0".
function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Platform-admin payout ledger for one store: shows 累計チップ / 振込済み /
 * 未振込残高 and records a manual month-end payout (振込を記録). Balance =
 * Σ(succeeded tips) − Σ(payouts), all in USD cents.
 */
export function StorePayouts({
  storeId,
  tipTotal,
  paidTotal,
  payouts,
}: {
  storeId: string;
  tipTotal: number;
  paidTotal: number;
  payouts: PayoutRow[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = tipTotal - paidTotal;

  async function submit() {
    setError(null);
    const dollars = Number.parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("振込金額を正しく入力してください。");
      return;
    }
    const cents = Math.round(dollars * 100);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cents,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setAmount("");
      setPeriodStart("");
      setPeriodEnd("");
      setNote("");
      router.refresh();
    } catch {
      setError("振込を記録できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-lg border border-neutral-300 p-2.5 text-sm";

  return (
    <div className="flex flex-col gap-5">
      {/* Balance summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">累計チップ</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">{usd(tipTotal)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">振込済み</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">{usd(paidTotal)}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
          <p className="text-xs font-medium text-neutral-500">未振込残高</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-accent)]">{usd(balance)}</p>
        </div>
      </div>

      {/* Record a payout */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <p className="text-sm font-bold text-neutral-800">振込を記録</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-neutral-600">
            振込金額（USD）
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例：120.00"
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            メモ<span className="ml-1 font-normal text-neutral-400">（任意）</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="例：7月分 銀行振込"
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            対象期間（開始）<span className="ml-1 font-normal text-neutral-400">（任意）</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            対象期間（終了）<span className="ml-1 font-normal text-neutral-400">（任意）</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} />
          </label>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="mt-3 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
        >
          {busy ? "記録中…" : "振込を記録する"}
        </button>
      </div>

      {/* History */}
      <div>
        <p className="mb-2 text-sm font-bold text-neutral-800">振込履歴</p>
        {payouts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-sm text-neutral-400">
            まだ振込の記録はありません。
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">記録日</th>
                  <th className="px-3 py-2 text-right font-medium">金額</th>
                  <th className="px-3 py-2 text-left font-medium">対象期間</th>
                  <th className="px-3 py-2 text-left font-medium">メモ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-neutral-600">{dateLabel(p.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-neutral-900">
                      {usd(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                      {p.periodStart || p.periodEnd
                        ? `${dateLabel(p.periodStart)} 〜 ${dateLabel(p.periodEnd)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
