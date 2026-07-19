"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StaffPicker } from "@/components/StaffPicker";
import { TipAmountGrid } from "@/components/TipAmountGrid";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";

type StaffOption = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export function StoreLandingClient({
  slug,
  storeName,
  staff,
}: {
  slug: string;
  storeName: string;
  staff: StaffOption[];
}) {
  const t = useTranslations("landing");
  const { locale } = useLocaleSwitcher();
  const router = useRouter();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(selectedStaffId) && Boolean(selectedAmount) && !isSubmitting;

  async function handleComplete() {
    if (!selectedStaffId || !selectedAmount) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, staffId: selectedStaffId, amount: selectedAmount, locale }),
      });

      if (!res.ok) {
        throw new Error("checkout_failed");
      }

      const { tipId } = (await res.json()) as { tipId: string };
      router.push(`/s/${slug}/checkout?tipId=${tipId}`);
    } catch {
      setError(t("errorGeneric"));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white pb-28">
      <LanguageSwitcher />

      <div className="flex flex-col items-center gap-2 bg-neutral-100 px-6 py-10 text-center">
        <span className="text-5xl">🙇</span>
        <span className="rounded-md bg-white px-4 py-1 text-xl font-bold tracking-wide">{storeName}</span>
        <p className="text-sm text-neutral-600">{t("welcome")}</p>
      </div>

      <section className="mt-6">
        <h2 className="px-4 text-lg font-bold">{t("staffHeading")}</h2>
        <p className="px-4 pb-2 text-sm text-neutral-500">{t("staffSubheading")}</p>
        <StaffPicker staff={staff} selectedId={selectedStaffId} onSelect={setSelectedStaffId} />
      </section>

      <hr className="my-6 border-neutral-200" />

      <section>
        <h2 className="px-4 text-lg font-bold">{t("tipHeading")}</h2>
        <p className="px-4 pb-2 text-sm text-neutral-500">{t("tipSubheading")}</p>
        <TipAmountGrid selectedAmount={selectedAmount} onSelect={setSelectedAmount} />
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-neutral-200 bg-white px-4 py-4">
        {error ? <p className="mb-2 text-center text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleComplete}
          className="w-full rounded-full bg-neutral-900 py-3 text-center font-semibold text-white disabled:opacity-40"
        >
          {t("completeButton")}
        </button>
        <p className="mt-2 text-center text-xs text-neutral-400">{t("completeNote")}</p>
      </div>
    </div>
  );
}
