"use client";

import { Eye, EyeOff } from "lucide-react";
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
  // Password reset per operator: the field value, in-flight id, and last-saved id.
  const [pw, setPw] = useState<Record<string, string>>({});
  const [pwBusy, setPwBusy] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState<string | null>(null);
  const [pwShow, setPwShow] = useState<Record<string, boolean>>({});
  // Email edit per operator.
  const [emailEdit, setEmailEdit] = useState<Record<string, string>>({});
  const [emailBusy, setEmailBusy] = useState<string | null>(null);
  const [emailDone, setEmailDone] = useState<string | null>(null);

  async function updateEmail(op: StoreOperator) {
    const next = (emailEdit[op.id] ?? op.email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next)) {
      setError("メールアドレスの形式が正しくありません。");
      return;
    }
    if (next === op.email) return;
    setEmailBusy(op.id);
    setError(null);
    setEmailDone(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/operator`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: op.id, email: next }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (body?.error === "email_taken") throw new Error("このメールアドレスは既に使われています。");
        if (body?.error === "email_update_failed")
          throw new Error("メールアドレスを更新できませんでした。もう一度お試しください。");
        throw new Error("更新できませんでした。もう一度お試しください。");
      }
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, email: next } : o)));
      setEmailDone(op.id);
      setTimeout(() => setEmailDone((cur) => (cur === op.id ? null : cur)), 2500);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新できませんでした。");
    } finally {
      setEmailBusy(null);
    }
  }

  function generatePassword(): string {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    // URL-safe, ~12 chars, no ambiguous padding.
    return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
  }

  async function setPassword(op: StoreOperator) {
    const password = pw[op.id]?.trim() ?? "";
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    setPwBusy(op.id);
    setError(null);
    setPwDone(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/operator`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: op.id, password }),
      });
      if (!res.ok) throw new Error("failed");
      setPwDone(op.id);
      setTimeout(() => setPwDone((cur) => (cur === op.id ? null : cur)), 2500);
    } catch {
      setError("パスワードを設定できませんでした。");
    } finally {
      setPwBusy(null);
    }
  }

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
        if (body?.error === "operator_exists")
          throw new Error("この店舗には既に運営者アカウントがあります（1店舗につき1つ）。");
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
          {operators.map((op) => {
            const isTmp = op.id.startsWith("tmp-");
            return (
              <li key={op.id} className="rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                {isTmp ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-neutral-800">{op.email}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-medium text-neutral-500">メールアドレス（ログインID）</label>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(op)}
                        className="shrink-0 text-xs font-medium text-neutral-400 transition hover:text-red-600"
                      >
                        削除
                      </button>
                    </div>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="email"
                        value={emailEdit[op.id] ?? op.email}
                        onChange={(e) => setEmailEdit((prev) => ({ ...prev, [op.id]: e.target.value }))}
                        className="min-w-0 flex-1 rounded-lg border border-neutral-300 p-2.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void updateEmail(op)}
                        disabled={emailBusy === op.id || (emailEdit[op.id] ?? op.email).trim().toLowerCase() === op.email}
                        className="shrink-0 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {emailBusy === op.id ? "更新中…" : "更新"}
                      </button>
                    </div>
                    {emailDone === op.id ? (
                      <p className="mt-1.5 text-xs text-green-600">メールアドレスを更新しました。</p>
                    ) : null}
                  </div>
                )}

                {/* Password reset — one field + generate. Saved changes take effect
                    at the operator's next login. */}
                {isTmp ? null : (
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <label className="block text-xs font-medium text-neutral-500">パスワードを設定</label>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 flex-1">
                        <input
                          type={pwShow[op.id] ? "text" : "password"}
                          value={pw[op.id] ?? ""}
                          onChange={(e) => setPw((prev) => ({ ...prev, [op.id]: e.target.value }))}
                          placeholder="8文字以上"
                          className="w-full rounded-lg border border-neutral-300 p-2.5 pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setPwShow((prev) => ({ ...prev, [op.id]: !prev[op.id] }))}
                          aria-label={pwShow[op.id] ? "パスワードを隠す" : "パスワードを表示"}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 transition hover:text-neutral-700"
                        >
                          {pwShow[op.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setPw((prev) => ({ ...prev, [op.id]: generatePassword() }))}
                          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100"
                        >
                          生成
                        </button>
                        <button
                          type="button"
                          onClick={() => void setPassword(op)}
                          disabled={pwBusy === op.id || (pw[op.id]?.trim().length ?? 0) < 8}
                          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          {pwBusy === op.id ? "設定中…" : "設定"}
                        </button>
                      </div>
                    </div>
                    {pwDone === op.id ? (
                      <p className="mt-1.5 text-xs text-green-600">
                        パスワードを設定しました。店舗にお伝えください。
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-neutral-400">
                        設定後、次回ログインから有効になります。
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
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

      {/* One operator account per store (1 account = 1 store): the add form only
          shows when there is none — e.g. after the existing one is deleted. */}
      {operators.length === 0 ? (
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
      ) : null}
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
