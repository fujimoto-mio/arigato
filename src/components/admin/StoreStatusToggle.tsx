"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

/**
 * Platform-admin control to suspend / reactivate a store. Suspending closes the
 * store's guest tip page (`/s/<slug>`) while keeping all history and stats.
 */
export function StoreStatusToggle({
  storeId,
  initialStatus,
}: {
  storeId: string;
  initialStatus: "active" | "suspended";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const suspended = status === "suspended";

  async function apply(next: "active" | "suspended") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus(next);
      setConfirmSuspend(false);
      router.refresh();
    } catch {
      setError("変更できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  // Resuming is immediate; suspending asks for confirmation first.
  function onToggle() {
    if (suspended) void apply("active");
    else setConfirmSuspend(true);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">現在の状態：</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            suspended ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${suspended ? "bg-red-500" : "bg-emerald-500"}`} />
          {suspended ? "Suspended" : "Active"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${
            suspended
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-red-300 text-red-700 hover:bg-red-50"
          }`}
        >
          {busy ? "変更中…" : suspended ? "受付を再開" : "受付を停止"}
        </button>
      </div>

      <ConfirmModal
        open={confirmSuspend}
        tone="danger"
        title="受付を停止しますか？"
        description="この店舗のお客様用チップ画面（QRの遷移先）が一時的に閉じられます。チップ・口コミの履歴や集計は保持されます。"
        confirmLabel="停止する"
        busy={busy}
        onConfirm={() => void apply("suspended")}
        onClose={() => setConfirmSuspend(false)}
      />
    </div>
  );
}
