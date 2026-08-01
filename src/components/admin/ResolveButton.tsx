"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Toggle a support thread between 対応中 and 解決済み. */
export function ResolveButton({ threadId, resolved }: { threadId: string; resolved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/support/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolved ? "open" : "resolved" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        resolved
          ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {busy ? "変更中…" : resolved ? "対応を再開" : "解決済みにする"}
    </button>
  );
}
