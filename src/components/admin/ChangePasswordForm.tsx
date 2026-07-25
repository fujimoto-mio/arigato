"use client";

import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MIN_LENGTH = 8;

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (next.length < MIN_LENGTH) {
      setError(`新しいパスワードは${MIN_LENGTH}文字以上で入力してください。`);
      return;
    }
    if (next !== confirm) {
      setError("新しいパスワードが一致しません。");
      return;
    }

    setStatus("saving");
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("セッションが無効です。再度ログインしてください。");
      setStatus("idle");
      return;
    }

    // Verify the current password by re-authenticating before changing it.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInError) {
      setError("現在のパスワードが正しくありません。");
      setStatus("idle");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) {
      setError(updateError.message);
      setStatus("idle");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2500);
  }

  const inputClass = "mt-1 block w-full max-w-md rounded-lg border border-neutral-300 p-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm font-medium text-neutral-700">
        現在のパスワード
        <input
          type="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        新しいパスワード
        <input
          type="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        新しいパスワード（確認）
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
        >
          {status === "saving" ? "変更中…" : "パスワードを変更"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">変更しました</span> : null}
      </div>
    </form>
  );
}
