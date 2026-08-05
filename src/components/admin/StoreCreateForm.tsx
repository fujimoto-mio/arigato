"use client";

import { useFormik } from "formik";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as Yup from "yup";
import { StoreQrCard } from "@/components/admin/StoreQrCard";
import { ConsentCheckboxes } from "@/components/ConsentCheckboxes";
import { storeTipUrl } from "@/lib/qr";
import { nameToSlug } from "@/lib/slug";

type CreatedResult = {
  store: { id: string; slug: string; name: string };
  operator: { email: string; tempPassword: string };
};

const schema = Yup.object({
  name: Yup.string().trim().max(80, "80文字以内で入力してください").required("店舗名を入力してください"),
  slug: Yup.string()
    .trim()
    .max(50, "50文字以内で入力してください")
    .matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）")
    .required("店舗URLを入力してください"),
  companyName: Yup.string().trim().max(120, "120文字以内で入力してください"),
  contactName: Yup.string().trim().max(80, "80文字以内で入力してください").required("担当者名を入力してください"),
  phone: Yup.string().trim().max(40, "40文字以内で入力してください").required("電話番号を入力してください"),
  email: Yup.string()
    .trim()
    .max(200, "200文字以内で入力してください")
    .email("メールアドレスの形式が正しくありません")
    .required("メールアドレスを入力してください"),
  address: Yup.string().trim().max(300, "300文字以内で入力してください").required("店舗住所を入力してください"),
  terms: Yup.boolean().oneOf([true], "利用規約への同意が必要です"),
  billing: Yup.boolean().oneOf([true], "自動課金への同意が必要です"),
  cancellation: Yup.boolean().oneOf([true], "解約方法への同意が必要です"),
});

/** Admin direct-create form (Formik + Yup); creates a pre-approved active store. */
export function StoreCreateForm({ origin }: { origin: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const slugEditedRef = useRef(false);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const formik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      terms: false,
      billing: false,
      cancellation: false,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      setSubmitError(null);
      try {
        const res = await fetch("/api/admin/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            slug: values.slug.trim(),
            companyName: values.companyName.trim(),
            contactName: values.contactName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            address: values.address.trim(),
            termsAgreed: values.terms,
            billingAgreed: values.billing,
            cancellationAgreed: values.cancellation,
          }),
        });
        if (!res.ok) {
          const e = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
          if (e === "slug_taken")
            return setFieldError("slug", "この店舗URLは既に使われています。別のURLを入力してください。");
          if (e === "invalid_slug")
            return setFieldError("slug", "半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）。");
          if (e === "email_taken")
            return setFieldError("email", "このメールアドレスは既に別のアカウントで使われています。");
          if (e === "auth_create_failed")
            return setFieldError("email", "ログインアカウントを作成できませんでした。メールアドレスをご確認ください。");
          throw new Error("店舗を作成できませんでした。もう一度お試しください。");
        }
        setResult((await res.json()) as CreatedResult);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "作成できませんでした。");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting } = formik;

  // Store name → slug: instant romaji, then a debounced uniqueness check. Stops
  // once the URL is edited by hand.
  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    void setFieldValue("name", next);
    if (slugEditedRef.current) return;
    void setFieldValue("slug", nameToSlug(next));
    clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      if (slugEditedRef.current) return;
      try {
        const res = await fetch("/api/admin/slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: next }),
        });
        if (res.ok) {
          const { slug } = (await res.json()) as { slug: string };
          if (!slugEditedRef.current) void setFieldValue("slug", slug);
        }
      } catch {
        // Ignore — the slug is still editable and validated on submit.
      }
    }, 500);
  }

  if (result) {
    async function copyPassword() {
      try {
        await navigator.clipboard.writeText(result!.operator.tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard blocked — the password is still visible.
      }
    }
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-green-800">
            <Check className="h-5 w-5" />
            「{result.store.name}」を登録しました
          </h2>
          <p className="mt-1 text-sm text-green-700">
            店舗運営者のログインアカウントを作成しました。以下のログイン情報を店舗にお渡しください。
            <span className="font-semibold">パスワードはこの画面でのみ表示されます。</span>
          </p>
          <dl className="mt-4 space-y-3">
            <div className="rounded-xl border border-green-200 bg-white p-3">
              <dt className="text-xs font-medium text-neutral-500">メールアドレス（ログインID）</dt>
              <dd className="mt-0.5 break-all font-mono text-sm">{result.operator.email}</dd>
            </div>
            <div className="rounded-xl border border-green-200 bg-white p-3">
              <dt className="text-xs font-medium text-neutral-500">仮パスワード</dt>
              <dd className="mt-1 flex items-center justify-between gap-3">
                <span className="break-all font-mono text-sm">{result.operator.tempPassword}</span>
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
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/stores/${result.store.id}`)}
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
          >
            店舗管理を開く
          </button>
          <Link href="/admin/stores" className="rounded-full px-4 py-3 text-sm font-medium text-neutral-500 hover:text-neutral-800">
            店舗一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const fieldClass = "mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm";
  const err = (k: keyof typeof values) =>
    touched[k] && errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k] as string}</p> : null;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗を追加</h2>
        <p className="mb-4 text-sm text-neutral-500">
          店舗の基本情報とご担当者情報を入力してください。ストーリー・画像などは、作成後に店舗運営者が設定します。
        </p>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-[7]">
            <label className="block text-sm font-medium text-neutral-700">
              店舗名
              <input name="name" value={values.name} onChange={onNameChange} onBlur={handleBlur} maxLength={80} placeholder="例：寿司はな" className={fieldClass} />
              {err("name")}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              店舗URL（slug）
              <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-neutral-300">
                <span className="shrink-0 border-r border-neutral-200 bg-neutral-50 px-3 py-3 font-mono text-xs text-neutral-400">/s/</span>
                <input
                  name="slug"
                  value={values.slug}
                  onChange={(e) => {
                    slugEditedRef.current = true;
                    void setFieldValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  onBlur={handleBlur}
                  maxLength={50}
                  placeholder="sushi-hana"
                  className="w-full px-3 py-3 font-mono text-sm outline-none"
                />
              </div>
              <span className="mt-1 block text-xs font-normal text-neutral-500">
                お客様のQRコードのURLになります。日本語名は英字に自動変換されます。
              </span>
              {err("slug")}
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
              <span className="mt-1 block text-xs font-normal text-neutral-500">店舗運営者のログインID になります。</span>
              {err("email")}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              店舗住所
              <input name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} maxLength={300} placeholder="例：東京都渋谷区〇〇 1-2-3" className={fieldClass} />
              {err("address")}
            </label>
          </div>

          <div className="border-t border-neutral-200 pt-6 lg:min-w-0 lg:flex-[5] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h3 className="text-base font-bold">店舗QRコード</h3>
            <p className="mb-4 text-sm text-neutral-500">読み取るとお客様のチップ画面が開きます。</p>
            <StoreQrCard
              storeName={values.name.trim() || "店舗名"}
              tipUrl={storeTipUrl(origin, values.slug || "")}
              downloadName={`arigato-qr-${values.slug || "store"}.png`}
              loading={isSubmitting}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <ConsentCheckboxes
          value={{ terms: values.terms, billing: values.billing, cancellation: values.cancellation }}
          onChange={(c) => {
            void setFieldValue("terms", c.terms);
            void setFieldValue("billing", c.billing);
            void setFieldValue("cancellation", c.cancellation);
          }}
          onBlur={(field) => void setFieldTouched(field, true)}
          errors={{
            // Derive from the current value so ticking a box clears its error in
            // the same render (Formik's `errors` object updates a tick late).
            terms: touched.terms && !values.terms ? "利用規約への同意が必要です" : undefined,
            billing: touched.billing && !values.billing ? "自動課金への同意が必要です" : undefined,
            cancellation:
              touched.cancellation && !values.cancellation ? "解約方法への同意が必要です" : undefined,
          }}
        />
      </section>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isSubmitting ? "作成中…" : "登録して開く"}
        </button>
        <Link href="/admin/stores" className="rounded-full px-4 py-3 text-sm font-medium text-neutral-500 hover:text-neutral-800">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
