"use client";

import type { SubscriptionStatus } from "@prisma/client";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConsentCheckboxes, type Consents, EMPTY_CONSENTS } from "@/components/ConsentCheckboxes";
import { PLAN, subscriptionBadge } from "@/lib/subscription";

const TONE: Record<ReturnType<typeof subscriptionBadge>["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-500/20",
  rose: "bg-rose-50 text-rose-600 ring-rose-500/20",
  neutral: "bg-neutral-100 text-neutral-500 ring-neutral-300",
};

function formatJst(value: string | null): string | null {
  if (!value) return null;
  // A real Stripe instant — display in Asia/Tokyo.
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * The operator's 購読登録 page body. Not subscribed → consent + Stripe Checkout.
 * Subscribed → status, trial/renewal date, and how to cancel (お問い合わせ).
 */
export function SubscriptionPanel({
  status,
  currentPeriodEnd,
}: {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  // Per-field so touching one box never reveals another box's error.
  const [touched, setTouched] = useState<Record<keyof Consents, boolean>>({
    terms: false,
    billing: false,
    cancellation: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const live = status === "trialing" || status === "active";
  const badge = subscriptionBadge(status);
  const periodLabel = formatJst(currentPeriodEnd);

  async function subscribe() {
    setTouched({ terms: true, billing: true, cancellation: true });
    if (!consents.terms || !consents.billing || !consents.cancellation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAgreed: consents.terms,
          billingAgreed: consents.billing,
          cancellationAgreed: consents.cancellation,
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        if (data?.error === "already_subscribed") {
          router.refresh();
          return;
        }
        throw new Error(
          data?.error === "price_not_configured"
            ? "購読プランが未設定です。管理者にお問い合わせください。"
            : "購読手続きを開始できませんでした。時間をおいて再度お試しください。",
        );
      }
      // Hand off to Stripe Checkout.
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {search.get("status") === "cancel" && !live ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          購読手続きはキャンセルされました。下のボタンからいつでも再開できます。
        </p>
      ) : null}
      {search.get("status") === "success" && !live ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          お手続きありがとうございます。反映まで数十秒かかる場合があります。画面を更新してご確認ください。
        </p>
      ) : null}

      {/* Plan card */}
      <section className="rounded-2xl border border-[var(--color-accent)]/25 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">ARIGATO TiPLY 月額プラン</h2>
            <p className="mt-1 text-sm text-neutral-500">お客様ページ（QRの遷移先）を公開・運用するための購読です。</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${TONE[badge.tone]}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight">{PLAN.monthlyLabel}</span>
          <span className="pb-1 text-sm text-neutral-500">/ 月（{PLAN.taxNote}）</span>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-neutral-600">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" /> 初月無料（{PLAN.trialDays}日間トライアル）
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" /> 2か月目以降 月額 {PLAN.monthlyLabel}（{PLAN.taxNote}）自動課金
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" /> 購読開始でお客様ページが公開されます
          </li>
        </ul>
      </section>

      {live ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-bold">購読状況</h3>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <dt className="text-neutral-500">ステータス</dt>
              <dd className="font-semibold text-neutral-800">{badge.label}</dd>
            </div>
            {periodLabel ? (
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">
                  {status === "trialing" ? "トライアル終了日（初回課金日）" : "次回更新日"}
                </dt>
                <dd className="font-semibold tabular-nums text-neutral-800">{periodLabel}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500">
            解約をご希望の場合は、
            <Link href="/admin/support" className="font-medium text-[var(--color-accent)] hover:underline">
              お問い合わせ
            </Link>
            よりご連絡ください。
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-bold">購読手続き</h3>
          {status === "past_due" ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              お支払いが確認できませんでした。再度お手続きください。
            </p>
          ) : null}
          <div className="mt-4">
            <ConsentCheckboxes
              value={consents}
              onChange={setConsents}
              onBlur={(field) => setTouched((t) => ({ ...t, [field]: true }))}
              errors={{
                terms: touched.terms && !consents.terms ? "利用規約への同意が必要です" : undefined,
                billing: touched.billing && !consents.billing ? "自動課金への同意が必要です" : undefined,
                cancellation:
                  touched.cancellation && !consents.cancellation ? "解約方法への同意が必要です" : undefined,
              }}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={busy}
            className="mt-5 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "手続きページへ移動中…" : "購読する（初月無料）"}
          </button>
          <p className="mt-3 text-xs text-neutral-400">
            決済はStripeの安全なページで行われます。カード情報が当社に保存されることはありません。
          </p>
        </section>
      )}
    </div>
  );
}
