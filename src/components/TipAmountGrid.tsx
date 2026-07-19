"use client";

import { useTranslations } from "next-intl";
import { TIP_TIERS } from "@/lib/tipTiers";

export function TipAmountGrid({
  selectedAmount,
  onSelect,
}: {
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
}) {
  const t = useTranslations("landing.tier");

  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2">
      {TIP_TIERS.map((tier) => {
        const isSelected = tier.amount === selectedAmount;
        return (
          <button
            key={tier.amount}
            type="button"
            onClick={() => onSelect(tier.amount)}
            aria-pressed={isSelected}
            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-4 transition-colors ${
              isSelected
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
            }`}
          >
            <span className="text-lg font-bold">¥{tier.amount.toLocaleString()}</span>
            <span className={`text-xs ${isSelected ? "text-white/90" : "text-neutral-500"}`}>{t(tier.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
