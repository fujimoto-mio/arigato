"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function StoreSettingsForm({
  initialName,
  initialGooglePlaceId,
  initialLogoUrl,
  initialInstagramUrl,
  initialFacebookUrl,
}: {
  initialName: string;
  initialGooglePlaceId: string | null;
  initialLogoUrl: string | null;
  initialInstagramUrl: string | null;
  initialFacebookUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [googlePlaceId, setGooglePlaceId] = useState(initialGooglePlaceId ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(initialFacebookUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          googlePlaceId: googlePlaceId.trim(),
          instagramUrl: instagramUrl.trim(),
          facebookUrl: facebookUrl.trim(),
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setError("保存できませんでした。もう一度お試しください。");
      setStatus("idle");
    }
  }

  async function handleLogo(file: File) {
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("upload_failed");
      const { url } = (await uploadRes.json()) as { url: string };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      });
      if (!res.ok) throw new Error("save_failed");
      setLogoUrl(url);
      router.refresh();
    } catch {
      setError("ロゴをアップロードできませんでした。もう一度お試しください。");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="block text-sm font-medium text-neutral-700">
        店舗名
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Google Place ID
        <input
          value={googlePlaceId}
          onChange={(event) => setGooglePlaceId(event.target.value)}
          placeholder="ChIJ..."
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 font-mono text-sm"
        />
        <span className="mt-1 block text-xs font-normal text-neutral-500">
          3★以上のお客様はGoogleのレビューページに案内されます。空欄の場合は、すべての評価が非公開のままになります。
        </span>
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Instagram URL
        <input
          value={instagramUrl}
          onChange={(event) => setInstagramUrl(event.target.value)}
          placeholder="https://instagram.com/yourstore"
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
        <span className="mt-1 block text-xs font-normal text-neutral-500">
          お客様の「つながる」画面にフォローボタンとして表示されます。空欄にすると非表示になります。
        </span>
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Facebook URL
        <input
          value={facebookUrl}
          onChange={(event) => setFacebookUrl(event.target.value)}
          placeholder="https://facebook.com/yourstore"
          className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        />
      </label>

      <div className="text-sm font-medium text-neutral-700">
        店舗ロゴ
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
            {logoUrl ? (
              <Image src={logoUrl} alt="Store logo" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl">🏠</span>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
            アップロード
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogo(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {status === "saving" ? "保存中…" : "保存"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">保存しました</span> : null}
      </div>
    </form>
  );
}
