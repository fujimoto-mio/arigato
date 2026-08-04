"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

/** Approve a pending self-registered store → sets it active (publishes the page). */
export function StoreApproveButton({ storeId, variant = "solid" }: { storeId: string; variant?: "solid" | "link" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error("failed");
      setOpen(false);
      router.refresh();
    } catch {
      setError("承認できませんでした。");
      setBusy(false);
    }
  }

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
        >
          <Check className="h-3.5 w-3.5" />
          承認
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            この店舗を承認する
          </button>
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      )}

      <ConfirmModal
        open={open}
        title="この店舗を承認しますか？"
        description={
          <>
            承認すると、お客様用のQRコードの読み取り先ページが公開され、チップの受付が始まります。
            {error ? <span className="mt-2 block font-medium text-red-600">{error}</span> : null}
          </>
        }
        confirmLabel="承認する"
        cancelLabel="キャンセル"
        busy={busy}
        onConfirm={() => void approve()}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
