"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { email: string; tempPassword: string };

/**
 * Issue the store-operator login for a store that doesn't have one yet (created
 * via the public /subscribe flow). Shows the temporary password once so the admin
 * can send it with the QR (③). Issuing also activates the store (pending→active).
 */
export function IssueLoginButton({ storeId, defaultEmail }: { storeId: string; defaultEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function issue() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/operator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { operator?: { email: string }; tempPassword?: string; error?: string }
        | null;
      if (!res.ok || !data?.tempPassword) {
        if (data?.error === "email_taken") throw new Error("このメールアドレスは既に別のアカウントで使われています。");
        if (data?.error === "operator_exists") throw new Error("この店舗には既にログインアカウントがあります。");
        if (data?.error === "invalid_email") throw new Error("メールアドレスの形式が正しくありません。");
        throw new Error("ログインアカウントを発行できませんでした。");
      }
      setResult({ email: data.operator?.email ?? email, tempPassword: data.tempPassword });
    } catch (err) {
      setError(err instanceof Error ? err.message : "発行できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function copyPassword() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the password is still visible.
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-green-800">
          <Check className="h-4 w-4" />
          ログインアカウントを発行しました
        </p>
        <p className="mt-1 text-xs text-green-700">
          以下のログイン情報を店舗にお渡しください。<span className="font-semibold">パスワードはこの画面でのみ表示されます。</span>
        </p>
        <dl className="mt-3 space-y-2">
          <div className="rounded-lg border border-green-200 bg-white p-3">
            <dt className="text-xs font-medium text-neutral-500">メールアドレス（ログインID）</dt>
            <dd className="mt-0.5 break-all font-mono text-sm">{result.email}</dd>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-3">
            <dt className="text-xs font-medium text-neutral-500">仮パスワード</dt>
            <dd className="mt-1 flex items-center justify-between gap-3">
              <span className="break-all font-mono text-sm">{result.tempPassword}</span>
              <button
                type="button"
                onClick={copyPassword}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "コピーしました" : "コピー"}
              </button>
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-3 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          完了
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-medium text-neutral-700">
        ログインID（メールアドレス）
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          placeholder="例：owner@example.com"
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div>
        <button
          type="button"
          onClick={() => void issue()}
          disabled={busy || !email.trim()}
          className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "発行中…" : "ログインアカウントを発行して有効化"}
        </button>
      </div>
    </div>
  );
}
