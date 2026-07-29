"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

/**
 * Delete a store and everything under it. Guarded by a confirm modal — the tips
 * and reviews cascade, so this is irreversible.
 */
export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      router.push("/admin/stores");
      router.refresh();
    } catch {
      setError("店舗を削除できませんでした。もう一度お試しください。");
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        この店舗を削除
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ConfirmModal
        open={open}
        tone="danger"
        title="店舗を削除しますか？"
        description={`「${storeName}」と、そのチップ・口コミ・ストーリーがすべて削除されます。この操作は取り消せません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        busy={busy}
        onConfirm={() => void remove()}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
