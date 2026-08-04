"use client";

import { useFormik } from "formik";
import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import * as Yup from "yup";
import { ConsentCheckboxes } from "@/components/ConsentCheckboxes";

const schema = Yup.object({
  name: Yup.string().trim().max(80, "80文字以内で入力してください").required("店舗名を入力してください"),
  companyName: Yup.string().trim().max(120, "120文字以内で入力してください"),
  contactName: Yup.string().trim().max(80, "80文字以内で入力してください").required("担当者名を入力してください"),
  phone: Yup.string().trim().max(40, "40文字以内で入力してください").required("電話番号を入力してください"),
  email: Yup.string()
    .trim()
    .max(200, "200文字以内で入力してください")
    .email("メールアドレスの形式が正しくありません")
    .required("メールアドレスを入力してください"),
  password: Yup.string()
    .max(72, "72文字以内で入力してください")
    .min(8, "パスワードは8文字以上で入力してください")
    .required("パスワードを入力してください"),
  address: Yup.string().trim().max(300, "300文字以内で入力してください").required("店舗住所を入力してください"),
  terms: Yup.boolean().oneOf([true], "利用規約への同意が必要です"),
  billing: Yup.boolean().oneOf([true], "自動課金への同意が必要です"),
  cancellation: Yup.boolean().oneOf([true], "解約方法への同意が必要です"),
});

/** Public store self-registration form (Formik + Yup). */
export function RegisterForm() {
  const [showPw, setShowPw] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      password: "",
      address: "",
      terms: false,
      billing: false,
      cancellation: false,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      setSubmitError(null);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            companyName: values.companyName.trim(),
            contactName: values.contactName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            password: values.password,
            address: values.address.trim(),
            termsAgreed: values.terms,
            billingAgreed: values.billing,
            cancellationAgreed: values.cancellation,
          }),
        });
        if (!res.ok) {
          const e = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
          // Field-specific errors show under their input.
          if (e === "email_taken") return setFieldError("email", "このメールアドレスは既に登録されています。");
          if (e === "auth_create_failed")
            return setFieldError("email", "アカウントを作成できませんでした。メールアドレスをご確認ください。");
          if (e === "weak_password") return setFieldError("password", "パスワードは8文字以上で入力してください。");
          throw new Error("登録できませんでした。もう一度お試しください。");
        }
        setDone(true);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "登録できませんでした。");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-neutral-900">登録申請を受け付けました</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          管理者の承認をお待ちください。承認後、店舗のQRコード・お客様ページが有効になります。
          <br />
          承認までの間もログインは可能です。
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting } = formik;
  const fieldClass = "mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm";
  const err = (k: keyof typeof values) =>
    touched[k] && errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k] as string}</p> : null;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
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
        担当者名
        <input name="contactName" value={values.contactName} onChange={handleChange} onBlur={handleBlur} maxLength={80} placeholder="例：山田 太郎" className={fieldClass} />
        {err("contactName")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        電話番号
        <input name="phone" type="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} maxLength={40} placeholder="例：03-1234-5678" className={fieldClass} />
        {err("phone")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        メールアドレス
        <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} maxLength={200} placeholder="例：owner@example.com" className={fieldClass} />
        <span className="mt-1 block text-xs font-normal text-neutral-500">ログインID になります。</span>
        {err("email")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        パスワード
        <div className="relative mt-1">
          <input
            name="password"
            type={showPw ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={72}
            placeholder="8文字以上"
            className="w-full rounded-lg border border-neutral-300 p-3 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {err("password")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        店舗住所
        <input name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} maxLength={300} placeholder="例：東京都渋谷区〇〇 1-2-3" className={fieldClass} />
        {err("address")}
      </label>

      <ConsentCheckboxes
        value={{ terms: values.terms, billing: values.billing, cancellation: values.cancellation }}
        onChange={(c) => {
          void setFieldValue("terms", c.terms);
          void setFieldValue("billing", c.billing);
          void setFieldValue("cancellation", c.cancellation);
        }}
        onBlur={() => {
          void setFieldTouched("terms", true);
          void setFieldTouched("billing", true);
          void setFieldTouched("cancellation", true);
        }}
        errors={{
          terms: touched.terms ? (errors.terms as string) : undefined,
          billing: touched.billing ? (errors.billing as string) : undefined,
          cancellation: touched.cancellation ? (errors.cancellation as string) : undefined,
        }}
      />

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {isSubmitting ? "登録中…" : "登録を申請する"}
      </button>
    </form>
  );
}
