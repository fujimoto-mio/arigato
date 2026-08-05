"use client";

import { useFormik } from "formik";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as Yup from "yup";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { uploadStoreImage } from "@/components/admin/StorySlidesField";
import { nameToSlug } from "@/lib/slug";

const urlTest = (v: string | undefined) => !v || /^https?:\/\//.test(v);

const schema = Yup.object({
  name: Yup.string().trim().max(80, "80文字以内で入力してください").required("店舗名を入力してください"),
  slug: Yup.string()
    .trim()
    .max(50, "50文字以内で入力してください")
    .matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）")
    .required("店舗URLを入力してください"),
  googlePlaceId: Yup.string().trim().max(200, "200文字以内で入力してください"),
  instagramUrl: Yup.string().trim().max(300).test("url", "URLの形式が正しくありません（https://…）", urlTest),
  facebookUrl: Yup.string().trim().max(300).test("url", "URLの形式が正しくありません（https://…）", urlTest),
  companyName: Yup.string().trim().max(120, "120文字以内で入力してください"),
  contactName: Yup.string().trim().max(80, "80文字以内で入力してください"),
  phone: Yup.string().trim().max(40, "40文字以内で入力してください"),
  email: Yup.string().trim().max(200).email("メールアドレスの形式が正しくありません"),
  address: Yup.string().trim().max(300, "300文字以内で入力してください"),
});

type Values = Yup.InferType<typeof schema>;

export function StoreSettingsForm({
  storeId,
  initialName,
  initialSlug,
  initialGooglePlaceId,
  initialCoverImageUrl,
  initialInstagramUrl,
  initialFacebookUrl,
  initialCompanyName,
  initialContactName,
  initialPhone,
  initialEmail,
  initialAddress,
  slugLocked = false,
  onSavingChange,
  onSaved,
}: {
  storeId: string;
  initialName: string;
  initialSlug: string;
  initialGooglePlaceId: string | null;
  initialCoverImageUrl: string | null;
  initialInstagramUrl: string | null;
  initialFacebookUrl: string | null;
  initialCompanyName: string | null;
  initialContactName: string | null;
  initialPhone: string | null;
  initialEmail: string | null;
  initialAddress: string | null;
  // Once approved, the slug can't be changed (its QR may already be printed).
  slugLocked?: boolean;
  onSavingChange?: (saving: boolean) => void;
  onSaved?: (store: { name: string; slug: string; googlePlaceId: string }) => void;
}) {
  const router = useRouter();
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const slugEditedRef = useRef(false);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Intro image: saved URL + a locally-picked file uploaded only on 保存.
  const [savedCover, setSavedCover] = useState(initialCoverImageUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingValues = useRef<Values | null>(null);

  const coverDisplay = coverPreview ?? (coverRemoved ? null : savedCover);

  const formik = useFormik<Values>({
    initialValues: {
      name: initialName,
      slug: initialSlug,
      googlePlaceId: initialGooglePlaceId ?? "",
      instagramUrl: initialInstagramUrl ?? "",
      facebookUrl: initialFacebookUrl ?? "",
      companyName: initialCompanyName ?? "",
      contactName: initialContactName ?? "",
      phone: initialPhone ?? "",
      email: initialEmail ?? "",
      address: initialAddress ?? "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      // 紹介画像 is required.
      if (!coverDisplay) {
        setCoverError("紹介画像を選択してください。");
        return;
      }
      // Changing the slug re-points printed QR codes — confirm first.
      if ((values.slug ?? "").trim() !== savedSlug) {
        pendingValues.current = values;
        setConfirmOpen(true);
        return;
      }
      void doSave(values);
    },
  });

  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;

  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    void setFieldValue("name", next);
    // Locked slug (approved store) never auto-follows the name.
    if (slugLocked || slugEditedRef.current) return;
    void setFieldValue("slug", nameToSlug(next));
    clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      if (slugEditedRef.current) return;
      try {
        const res = await fetch("/api/admin/slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: next, storeId }),
        });
        if (res.ok) {
          const { slug } = (await res.json()) as { slug: string };
          if (!slugEditedRef.current) void setFieldValue("slug", slug);
        }
      } catch {
        // Ignore — slug stays editable and is validated on submit.
      }
    }, 500);
  }

  function selectCover(file: File) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverRemoved(false);
    setError(null);
    setCoverError(null);
  }

  function removeCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    setCoverRemoved(true);
  }

  async function doSave(v: Values) {
    setStatus("saving");
    setError(null);
    onSavingChange?.(true);
    try {
      const coverPatch: { coverImageUrl?: string | null } = {};
      let nextCover: string | null | undefined;
      if (coverFile) {
        try {
          nextCover = await uploadStoreImage(storeId, coverFile);
        } catch {
          throw new Error("紹介画像をアップロードできませんでした。もう一度お試しください。");
        }
        coverPatch.coverImageUrl = nextCover;
      } else if (coverRemoved) {
        nextCover = null;
        coverPatch.coverImageUrl = null;
      }

      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (v.name ?? "").trim(),
          slug: (v.slug ?? "").trim(),
          googlePlaceId: (v.googlePlaceId ?? "").trim(),
          instagramUrl: (v.instagramUrl ?? "").trim(),
          facebookUrl: (v.facebookUrl ?? "").trim(),
          companyName: (v.companyName ?? "").trim(),
          contactName: (v.contactName ?? "").trim(),
          phone: (v.phone ?? "").trim(),
          email: (v.email ?? "").trim(),
          address: (v.address ?? "").trim(),
          ...coverPatch,
        }),
      });
      if (!res.ok) {
        const e = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
        // Field-specific errors show under their input; others are generic.
        const fieldError = (field: keyof Values, msg: string) => {
          setConfirmOpen(false);
          setStatus("idle");
          void formik.setFieldTouched(field, true, false);
          formik.setFieldError(field, msg);
        };
        if (e === "slug_taken")
          return fieldError("slug", "この店舗URLは既に使われています。別のURLを入力してください。");
        if (e === "invalid_slug")
          return fieldError("slug", "半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）。");
        if (e === "invalid_email") return fieldError("email", "メールアドレスの形式が正しくありません。");
        if (e === "email_required") return fieldError("email", "メールアドレスは必須です（ログインIDのため）。");
        if (e === "email_taken")
          return fieldError("email", "このメールアドレスは既に別のアカウントで使われています。");
        if (e === "email_update_failed")
          return fieldError("email", "メールアドレスを更新できませんでした。もう一度お試しください。");
        throw new Error("保存できませんでした。もう一度お試しください。");
      }
      const savedName = (v.name ?? "").trim();
      const newSlug = (v.slug ?? "").trim();
      setSavedSlug(newSlug);
      slugEditedRef.current = false;
      if (nextCover !== undefined) setSavedCover(nextCover);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(null);
      setCoverPreview(null);
      setCoverRemoved(false);
      setConfirmOpen(false);
      setStatus("saved");
      onSaved?.({ name: savedName, slug: newSlug, googlePlaceId: (v.googlePlaceId ?? "").trim() });
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setConfirmOpen(false);
      setError(err instanceof Error ? err.message : "保存できませんでした。もう一度お試しください。");
      setStatus("idle");
    } finally {
      onSavingChange?.(false);
    }
  }

  const slugChanged = (values.slug ?? "").trim() !== savedSlug;
  const err = (k: keyof Values) =>
    touched[k] && errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k] as string}</p> : null;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
      <label className="block text-sm font-medium text-neutral-700">
        店舗名
        <input name="name" value={values.name} onChange={onNameChange} onBlur={handleBlur} maxLength={80} className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
        {err("name")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        店舗URL（slug）
        <div
          className={`mt-1 flex items-center overflow-hidden rounded-lg border border-neutral-300 ${
            slugLocked ? "bg-neutral-50" : ""
          }`}
        >
          <span className="shrink-0 border-r border-neutral-200 bg-neutral-50 px-3 py-3 font-mono text-xs text-neutral-400">/s/</span>
          <input
            name="slug"
            value={values.slug}
            onChange={(e) => {
              slugEditedRef.current = true;
              void setFieldValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            onBlur={handleBlur}
            readOnly={slugLocked}
            maxLength={50}
            placeholder="sushi-hana"
            className={`w-full px-3 py-3 font-mono text-sm outline-none ${
              slugLocked ? "cursor-not-allowed bg-neutral-50 text-neutral-400" : ""
            }`}
          />
        </div>
        <span className="mt-1 block text-xs font-normal text-neutral-500">
          {slugLocked ? (
            "承認後は店舗URLを変更できません（印刷済みQRコードとの整合のため）。"
          ) : (
            <>
              お客様のQRコードのURLになります。日本語名は英字に自動変換されます。
              {slugChanged ? (
                <span className="mt-1 block font-medium text-amber-600">
                  ⚠ 変更すると印刷済みのQRコードは使えなくなります。保存後に新しいQRコードを印刷してください。
                </span>
              ) : null}
            </>
          )}
        </span>
        {err("slug")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Google Place ID
        <input name="googlePlaceId" value={values.googlePlaceId} onChange={handleChange} onBlur={handleBlur} placeholder="ChIJ..." className="mt-1 w-full rounded-lg border border-neutral-300 p-3 font-mono text-sm" />
        {err("googlePlaceId")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Instagram URL
        <input name="instagramUrl" value={values.instagramUrl} onChange={handleChange} onBlur={handleBlur} placeholder="https://instagram.com/yourstore" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
        {err("instagramUrl")}
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Facebook URL
        <input name="facebookUrl" value={values.facebookUrl} onChange={handleChange} onBlur={handleBlur} placeholder="https://facebook.com/yourstore" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
        {err("facebookUrl")}
      </label>

      {/* Registration contact details — editable here after registration. */}
      <div className="border-t border-neutral-100 pt-5">
        <h3 className="text-sm font-bold text-neutral-800">店舗・ご担当者情報</h3>
        <div className="mt-3 flex flex-col gap-4">
          <label className="block text-sm font-medium text-neutral-700">
            会社名<span className="ml-1 text-xs font-normal text-neutral-400">（任意）</span>
            <input name="companyName" value={values.companyName} onChange={handleChange} onBlur={handleBlur} maxLength={120} placeholder="例：株式会社はな" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            {err("companyName")}
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            担当者名
            <input name="contactName" value={values.contactName} onChange={handleChange} onBlur={handleBlur} maxLength={80} placeholder="例：山田 太郎" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            {err("contactName")}
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            電話番号
            <input name="phone" type="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} maxLength={40} placeholder="例：03-1234-5678" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            {err("phone")}
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            メールアドレス
            <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} maxLength={200} placeholder="例：owner@example.com" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            <span className="mt-1 block text-xs font-normal text-neutral-500">
              店舗運営者のログインID を兼ねています。変更するとログインIDも更新されます。
            </span>
            {err("email")}
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            店舗住所
            <input name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} maxLength={300} placeholder="例：東京都渋谷区〇〇 1-2-3" className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            {err("address")}
          </label>
        </div>
      </div>

      <div className="text-sm font-medium text-neutral-700">
        紹介画像
        <p className="mt-0.5 text-xs font-normal text-neutral-500">
          お客様のQR画面のトップに大きく表示されます（横4：縦3）。未設定の場合はストーリー1枚目の画像が使われます。
        </p>
        <div className="mt-2 max-w-xs">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100">
            {coverDisplay ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverDisplay} alt="紹介画像" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-300">
                <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
              {coverDisplay ? "画像を変更" : "アップロード"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) selectCover(file);
                  event.target.value = "";
                }}
              />
            </label>
            {coverDisplay ? (
              <button type="button" onClick={removeCover} className="text-xs font-medium text-neutral-400 hover:text-red-500">
                削除
              </button>
            ) : null}
          </div>
          {coverFile ? <p className="mt-1 text-[11px] text-neutral-400">保存時にアップロードされます</p> : null}
          {coverError ? <p className="mt-1 text-xs text-red-600">{coverError}</p> : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
        >
          {status === "saving" ? "保存中…" : "保存"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">保存しました</span> : null}
      </div>

      <ConfirmModal
        open={confirmOpen}
        tone="danger"
        title="店舗URLを変更しますか？"
        description="変更すると、いま印刷済みのQRコードは読み取れなくなります。変更後は新しいQRコードを印刷し直してください。"
        confirmLabel="変更して保存"
        cancelLabel="キャンセル"
        busy={status === "saving"}
        onConfirm={() => pendingValues.current && void doSave(pendingValues.current)}
        onClose={() => setConfirmOpen(false)}
      />
    </form>
  );
}
