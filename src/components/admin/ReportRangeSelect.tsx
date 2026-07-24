"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const OPTIONS = [
  { value: "today", label: "今日" },
  { value: "7", label: "過去7日間" },
  { value: "14", label: "過去14日間" },
  { value: "30", label: "過去1ヶ月" },
  { value: "60", label: "過去2ヶ月" },
  { value: "custom", label: "カスタム期間" },
];

/** Single period dropdown for the reports chart; reveals date inputs for custom. */
export function ReportRangeSelect({
  selection,
  fromISO,
  toISO,
  todayISO,
}: {
  selection: string;
  fromISO: string;
  toISO: string;
  todayISO: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(selection);
  const [from, setFrom] = useState(fromISO);
  const [to, setTo] = useState(toISO);

  // Keep the dropdown in sync when the URL (and thus the server selection) changes.
  const [lastSelection, setLastSelection] = useState(selection);
  if (selection !== lastSelection) {
    setLastSelection(selection);
    setValue(selection);
  }

  function onSelect(next: string) {
    setValue(next);
    if (next !== "custom") router.push(`/admin/reports?range=${next}`);
  }

  function applyCustom() {
    if (from && to) router.push(`/admin/reports?from=${from}&to=${to}`);
  }

  const inputClass =
    "mt-1 block rounded-lg border border-neutral-300 p-2 text-sm focus:border-[var(--color-accent)] focus:outline-none";
  const rangeLabel = fromISO === toISO ? fromISO : `${fromISO} 〜 ${toISO}`;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <select
            value={value}
            onChange={(event) => onSelect(event.target.value)}
            aria-label="期間"
            className="block appearance-none rounded-full border border-neutral-300 py-2 pl-4 pr-9 text-sm font-medium focus:border-[var(--color-accent)] focus:outline-none"
          >
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {value === "custom" ? (
          <>
            <label className="text-xs font-medium text-neutral-600">
              開始日
              <input type="date" value={from} max={todayISO} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </label>
            <label className="text-xs font-medium text-neutral-600">
              終了日
              <input type="date" value={to} max={todayISO} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </label>
            <button
              type="button"
              onClick={applyCustom}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              適用
            </button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-neutral-400">{rangeLabel}</p>
    </div>
  );
}
