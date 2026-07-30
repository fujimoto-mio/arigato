"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

export type StoreOperator = { id: string; email: string };

/**
 * Platform-admin panel to manage a store's operator accounts (1 account = 1
 * store). Creating one returns a one-time temporary password to hand to the store.
 */
export function StoreOperators({
  storeId,
  initialOperators,
}: {
  storeId: string;
  initialOperators: StoreOperator[];
}) {
  const router = useRouter();
  const [operators, setOperators] = useState<StoreOperator[]>(initialOperators);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoreOperator | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/operator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = (await res.json().catch(() => null)) as
        | { operator?: { email: string }; tempPassword?: string; error?: string }
        | null;
      if (!res.ok || !body?.tempPassword) {
        if (body?.error === "email_taken") throw new Error("このメールアドレスは既に使われています。");
        if (body?.error === "auth_create_failed")
          throw new Error("このメールアドレスは登録済みか、作成に失敗しました。別のアドレスをお試しください。");
        if (body?.error === "invalid_email") throw new Error("メールアドレスの形式が正しくありません。");
        throw new Error("作成できませんでした。もう一度お試しください。");
      }
      setOperators((prev) => [...prev, { id: `tmp-${body.operator!.email}`, email: body.operator!.email }]);
      setCreated({ email: body.operator!.email, tempPassword: body.tempPassword });
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const operator = pendingDelete;
    if (!operator) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/operator`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: operator.id }),
      });
      if (!res.ok) throw new Error("failed");
      setOperators((prev) => prev.filter((o) => o.id !== operator.id));
      setPendingDelete(null);
      router.refresh();
    } catch {
      setError("削除できませんでした。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {operators.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {operators.map((op) => (
            <li
              key={op.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <span className="truncate font-medium text-neutral-800">{op.email}</span>
              {op.id.startsWith("tmp-") ? null : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(op)}
                  className="shrink-0 text-xs font-medium text-neutral-400 transition hover:text-red-600"
                >
                  削除
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-400">まだ店舗運営者アカウントはありません。</p>
      )}

      {created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-800">アカウントを作成しました。</p>
          <p className="mt-1 text-emerald-700">
            この仮パスワードは一度だけ表示されます。店舗にお伝えください。
          </p>
          <dl className="mt-3 space-y-1 font-mono text-xs text-neutral-800">
            <div className="flex gap-2">
              <dt className="text-neutral-500">メール：</dt>
              <dd className="break-all">{created.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-neutral-500">仮パスワード：</dt>
              <dd className="break-all font-bold">{created.tempPassword}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="operator@example.com"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 p-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="shrink-0 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "作成中…" : "運営者を追加"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ConfirmModal
        open={pendingDelete !== null}
        tone="danger"
        title="店舗運営者アカウントを削除しますか？"
        description={
          pendingDelete
            ? `「${pendingDelete.email}」のアカウントを削除します。この操作は取り消せません。`
            : ""
        }
        confirmLabel="削除する"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
