"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    // refresh() so the server layout re-reads the freshly written session cookie.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="block text-sm font-medium text-neutral-700">
        メールアドレス
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        パスワード
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-neutral-900 py-3 font-semibold text-white disabled:opacity-40"
      >
        {isSubmitting ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
