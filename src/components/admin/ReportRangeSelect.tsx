"use client";

import { useState } from "react";
import { Select } from "@/components/admin/Select";

const OPTIONS = [
  { value: "7", label: "過去7日間" },
  { value: "14", label: "過去14日間" },
  { value: "30", label: "過去1ヶ月" },
  { value: "60", label: "過去2ヶ月" },
  { value: "custom", label: "カスタム期間" },
];

export type RangeParams = { range?: string; from?: string; to?: string };

/**
 * Period picker for the reports chart; reveals date inputs for a custom range.
 * Reports only the chosen range via `onChange` — the parent refetches just the
 * chart, so no page navigation / URL change happens.
 */
export function ReportRangeSelect({
  selection,
  fromISO,
  toISO,
  todayISO,
  onChange,
}: {
  selection: string;
  fromISO: string;
  toISO: string;
  todayISO: string;
  onChange: (params: RangeParams) => void;
}) {
  const [value, setValue] = useState(selection);
  const [from, setFrom] = useState(fromISO);
  const [to, setTo] = useState(toISO);

  // Re-sync when the parent's resolved range changes (e.g. the store switched).
  const [lastSelection, setLastSelection] = useState(selection);
  if (selection !== lastSelection) {
    setLastSelection(selection);
    setValue(selection);
  }
  const [lastFrom, setLastFrom] = useState(fromISO);
  if (fromISO !== lastFrom) {
    setLastFrom(fromISO);
    setFrom(fromISO);
  }
  const [lastTo, setLastTo] = useState(toISO);
  if (toISO !== lastTo) {
    setLastTo(toISO);
    setTo(toISO);
  }

  function onSelect(next: string) {
    setValue(next);
    if (next !== "custom") onChange({ range: next });
  }

  function applyCustom() {
    if (from && to) onChange({ from, to });
  }

  const inputClass =
    "mt-1 block rounded-lg border border-neutral-300 p-2 text-sm focus:border-[var(--color-accent)] focus:outline-none";
  const rangeLabel = fromISO === toISO ? fromISO : `${fromISO} 〜 ${toISO}`;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          value={value}
          onChange={onSelect}
          options={OPTIONS}
          ariaLabel="期間"
          triggerClassName="min-w-[10rem] font-medium"
          align="right"
        />

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
