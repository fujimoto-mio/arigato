"use client";

import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { ConsentCheckboxes } from "@/components/ConsentCheckboxes";
import { Spinner } from "@/components/flow/Spinner";
import { PLAN } from "@/lib/subscription";

const schema = Yup.object({
  name: Yup.string().trim().max(80, "80文字以内で入力してください").required("店舗名を入力してください"),
  companyName: Yup.string().trim().max(120, "120文字以内で入力してください"),
  phone: Yup.string().trim().max(40, "40文字以内で入力してください").required("電話番号を入力してください"),
  email: Yup.string()
    .trim()
    .max(200, "200文字以内で入力してください")
    .email("メールアドレスの形式が正しくありません")
    .required("メールアドレスを入力してください"),
  terms: Yup.boolean().oneOf([true], "利用規約への同意が必要です"),
  billing: Yup.boolean().oneOf([true], "自動課金への同意が必要です"),
  cancellation: Yup.boolean().oneOf([true], "解約方法への同意が必要です"),
});

/**
 * Public subscription sign-up form (the link from the Google Form). Collects the
 * store's identity + consent, then hands off to Stripe Checkout. The email should
 * match the Google Form so the admin can cross-reference before issuing a login.
 */
export function SubscribeForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { name: "", companyName: "", phone: "", email: "", terms: false, billing: false, cancellation: false },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitError(null);
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            companyName: values.companyName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            termsAgreed: values.terms,
            billingAgreed: values.billing,
            cancellationAgreed: values.cancellation,
          }),
        });
        const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!res.ok || !data?.url) {
          if (data?.error === "already_subscribed") {
            throw new Error("このメールアドレスは既に購読済みです。ログイン情報が届いていない場合はお問い合わせください。");
          }
          if (data?.error === "price_not_configured") {
            throw new Error("購読プランが未設定です。お手数ですがお問い合わせください。");
          }
          throw new Error("購読手続きを開始できませんでした。時間をおいて再度お試しください。");
        }
        // Hand off to Stripe Checkout (leaves setSubmitting true during redirect).
        window.location.href = data.url;
        return;
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "エラーが発生しました。");
        setSubmitting(false);
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting } = formik;
  const fieldClass =
    "mt-1 w-full rounded-lg border border-[var(--color-accent)]/25 bg-white/80 p-3 text-sm outline-none focus:border-[var(--color-accent)]";
  const err = (k: keyof typeof values) =>
    touched[k] && errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k] as string}</p> : null;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Plan summary */}
      <div className="rounded-2xl border border-[var(--color-accent)]/25 bg-white/70 p-4 text-center">
        <p className="text-sm text-neutral-500">月額プラン</p>
        <p className="mt-1">
          <span className="text-2xl font-bold">{PLAN.monthlyLabel}</span>
          <span className="ml-1 text-sm text-neutral-500">/ 月（{PLAN.taxNote}）</span>
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--color-accent)]">
          初月無料（{PLAN.trialDays}日間トライアル）
        </p>
      </div>

      <label className="block text-sm font-medium text-neutral-700">
        店舗名
        <input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} maxLength={80} placeholder="例：寿司はな" className={fieldClass} />
        {err("name")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        会社名<span className="ml-1 text-xs font-normal text-neutral-400">（任意）</span>
        <input name="companyName" value={values.companyName} onChange={handleChange} onBlur={handleBlur} maxLength={120} placeholder="例：株式会社はな" className={fieldClass} />
        {err("companyName")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        電話番号
        <input name="phone" type="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} maxLength={40} placeholder="例：03-1234-5678" className={fieldClass} />
        {err("phone")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        メールアドレス
        <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} maxLength={200} placeholder="例：owner@example.com" className={fieldClass} />
        <span className="mt-1 block text-xs font-normal text-neutral-500">お申込みのGoogleフォームと同じメールアドレスをご入力ください。</span>
        {err("email")}
      </label>

      <ConsentCheckboxes
        value={{ terms: values.terms, billing: values.billing, cancellation: values.cancellation }}
        onChange={(c) => {
          void setFieldValue("terms", c.terms);
          void setFieldValue("billing", c.billing);
          void setFieldValue("cancellation", c.cancellation);
        }}
        onBlur={(field) => void setFieldTouched(field, true)}
        errors={{
          // Derive from the current value so ticking a box clears its error in the
          // same render (Formik's `errors` object updates a tick late).
          terms: touched.terms && !values.terms ? "利用規約への同意が必要です" : undefined,
          billing: touched.billing && !values.billing ? "自動課金への同意が必要です" : undefined,
          cancellation:
            touched.cancellation && !values.cancellation ? "解約方法への同意が必要です" : undefined,
        }}
      />

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? "手続きページへ移動中…" : "購読を申し込む（初月無料）"}
      </button>
      <p className="text-center text-xs text-neutral-400">
        決済はStripeの安全なページで行われます。カード情報が当社に保存されることはありません。
      </p>
    </form>
  );
}
