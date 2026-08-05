"use client";

import Link from "next/link";

export type Consents = { terms: boolean; billing: boolean; cancellation: boolean };

export const EMPTY_CONSENTS: Consents = { terms: false, billing: false, cancellation: false };
export const allConsented = (c: Consents) => c.terms && c.billing && c.cancellation;

function Row({
  field,
  checked,
  onToggle,
  onBlur,
  children,
}: {
  field: keyof Consents;
  checked: boolean;
  onToggle: (v: boolean) => void;
  // Reports which row blurred so callers mark only that field touched — touching
  // one box must not reveal another box's error.
  onBlur?: (field: keyof Consents) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        onBlur={() => onBlur?.(field)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 accent-[var(--color-accent)]"
      />
      <span>{children}</span>
    </label>
  );
}

/**
 * Store-registration consent checkboxes (利用規約 / 自動課金 / 解約方法). All three
 * are required to register. The legal wording lives on /terms and /tokushoho
 * (provided by the client).
 */
export function ConsentCheckboxes({
  value,
  onChange,
  onBlur,
  errors,
}: {
  value: Consents;
  onChange: (next: Consents) => void;
  // Called with the field that just blurred (so only its error can surface).
  onBlur?: (field: keyof Consents) => void;
  // Per-row validation messages (shown only when present).
  errors?: Partial<Record<keyof Consents, string>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Row field="terms" checked={value.terms} onToggle={(terms) => onChange({ ...value, terms })} onBlur={onBlur}>
          <Link href="/terms" target="_blank" className="font-medium text-[var(--color-accent)] underline">
            利用規約
          </Link>
          に同意します。
        </Row>
        {errors?.terms ? <p className="mt-1 text-xs text-red-600">{errors.terms}</p> : null}
      </div>
      <div>
        <Row field="billing" checked={value.billing} onToggle={(billing) => onChange({ ...value, billing })} onBlur={onBlur}>
          初月無料・2か月目以降 月額5,000円（税抜）の自動課金に同意します。
        </Row>
        {errors?.billing ? <p className="mt-1 text-xs text-red-600">{errors.billing}</p> : null}
      </div>
      <div>
        <Row
          field="cancellation"
          checked={value.cancellation}
          onToggle={(cancellation) => onChange({ ...value, cancellation })}
          onBlur={onBlur}
        >
          解約はお問い合わせフォームから行うことに同意します。
        </Row>
        {errors?.cancellation ? <p className="mt-1 text-xs text-red-600">{errors.cancellation}</p> : null}
      </div>
    </div>
  );
}
