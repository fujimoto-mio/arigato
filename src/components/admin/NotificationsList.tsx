"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { markNotificationRead } from "@/app/admin/(dashboard)/notifications/actions";
import { Stars } from "@/components/admin/Stars";
import { GoogleIcon } from "@/components/flow/brand";

export type NotificationItem = {
  id: string;
  amountYen: string;
  amountUsd: string;
  createdAtLabel: string;
  paymentLabel: string;
  isUnread: boolean;
  hasReview: boolean;
  rating: number | null;
  comment: string | null;
  photoUrls: string[];
  redirectedToGoogle: boolean;
};

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function KindIcon({ hasReview }: { hasReview: boolean }) {
  return hasReview ? (
    <svg {...iconProps}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  ) : (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8l3 4 3-4M9 13h6M9 16h6M12 12v4" />
    </svg>
  );
}

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  // Items marked read this session (opened) — clears their badge instantly,
  // on top of whatever the server already reported as read.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  function open(item: NotificationItem) {
    setSelected(item);
    // Opening a notification is what marks it read (per-item, not per-view).
    if (item.isUnread && !readIds.has(item.id)) {
      setReadIds((prev) => new Set(prev).add(item.id));
      void markNotificationRead(item.id).then(() => router.refresh());
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const isUnread = item.isUnread && !readIds.has(item.id);
          return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => open(item)}
              className={`flex w-full gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-[var(--color-accent)] ${
                isUnread ? "border-[var(--color-accent)]/40" : "border-neutral-200"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <KindIcon hasReview={item.hasReview} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-900">
                    {item.hasReview ? "チップと口コミが届きました" : "チップが届きました"}
                  </p>
                  <div className="shrink-0 text-right">
                    <span className="font-bold text-[var(--color-accent)]">{item.amountYen}</span>
                    <span className="block text-[11px] text-neutral-400">（{item.amountUsd}）</span>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  {isUnread ? (
                    <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">未読</span>
                  ) : null}
                  <span>{item.createdAtLabel}</span>
                  {item.rating !== null ? (
                    <span className="flex items-center gap-1">
                      <Stars rating={item.rating} /> {item.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                {item.comment ? (
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-neutral-700">{item.comment}</p>
                ) : null}
              </div>
            </button>
          </li>
          );
        })}
      </ul>

      {selected ? <NotificationModal item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function NotificationModal({ item, onClose }: { item: NotificationItem; onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="閉じる" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h3 className="text-lg font-bold">{item.hasReview ? "チップと口コミ" : "チップ"}</h3>

        <div className="mt-4 rounded-xl border border-neutral-100 p-5 text-center">
          <p className="text-4xl font-bold text-[var(--color-accent)]">{item.amountYen}</p>
          <p className="mt-1 text-xs text-neutral-400">（{item.amountUsd}）</p>
        </div>

        <dl className="mt-4 divide-y divide-neutral-100 text-sm">
          <InfoRow label="受信日時" value={item.createdAtLabel} />
          <InfoRow label="支払方法" value={item.paymentLabel} />
          <InfoRow label="評価">
            {item.rating !== null ? (
              <span className="flex items-center justify-end gap-1">
                <Stars rating={item.rating} /> {item.rating.toFixed(1)}
              </span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </InfoRow>
          <InfoRow label="口コミ誘導">
            {item.redirectedToGoogle ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]">
                <GoogleIcon size={14} /> Googleに誘導
              </span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </InfoRow>
        </dl>

        {item.comment ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">口コミ内容</p>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800">{item.comment}</p>
          </div>
        ) : null}

        {item.photoUrls.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">投稿写真</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {item.photoUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  {/* Guest-uploaded Supabase URLs; plain img avoids remote-loader config. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="投稿写真" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{children ?? value}</dd>
    </div>
  );
}
