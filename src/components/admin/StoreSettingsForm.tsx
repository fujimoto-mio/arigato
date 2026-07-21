"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function StoreSettingsForm({
  initialName,
  initialGooglePlaceId,
  initialLogoUrl,
}: {
  initialName: string;
  initialGooglePlaceId: string | null;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [googlePlaceId, setGooglePlaceId] = useState(initialGooglePlaceId ?? "");
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
        body: JSON.stringify({ name: name.trim(), googlePlaceId: googlePlaceId.trim() }),
      });
      if (!res.ok) throw new Error("save_failed");
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setError("Could not save. Please try again.");
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
      setError("Could not upload the logo. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="block text-sm font-medium text-neutral-700">
        Store name
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
          Guests who rate 3★ or higher are sent to your Google review page. Leave this blank and every
          rating stays private instead.
        </span>
      </label>

      <div className="text-sm font-medium text-neutral-700">
        Store logo
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
            {logoUrl ? (
              <Image src={logoUrl} alt="Store logo" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl">🏠</span>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
            Upload
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
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">Saved</span> : null}
      </div>
    </form>
  );
}
