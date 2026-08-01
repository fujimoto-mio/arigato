"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { NewThreadButton } from "@/components/admin/NewThreadButton";

export type ThreadListItem = {
  id: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  resolved: boolean;
  storeName: string | null;
};

/**
 * Two-column support panel: thread list on the left, conversation (children) on
 * the right, joined by a divider. On mobile it shows one pane at a time.
 */
export function SupportShell({
  threads,
  isPlatformAdmin,
  children,
}: {
  threads: ThreadListItem[];
  isPlatformAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/admin/support/") ? (pathname.split("/").pop() ?? null) : null;
  const onThread = activeId != null;
  const [showResolved, setShowResolved] = useState(false);

  const visible = threads.filter((t) => showResolved || !t.resolved);
  const resolvedCount = threads.filter((t) => t.resolved).length;

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white md:h-[calc(100dvh-8.5rem)]">
      {/* Left: thread list */}
      <aside className={`w-full flex-col md:w-[300px] md:border-r md:border-neutral-100 ${onThread ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-base font-bold text-neutral-900">お問い合わせ</h2>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {!isPlatformAdmin ? <NewThreadButton /> : null}

          {visible.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-neutral-400">お問い合わせはありません。</p>
          ) : (
            visible.map((t) => {
              const active = t.id === activeId;
              return (
                <Link
                  key={t.id}
                  href={`/admin/support/${t.id}`}
                  className={`block rounded-xl border p-3 transition ${
                    active
                      ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
                      : "border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-neutral-900">{t.subject}</p>
                    <span className="shrink-0 text-[11px] text-neutral-400">{t.time}</span>
                  </div>
                  {isPlatformAdmin && t.storeName ? (
                    <p className="truncate text-[11px] font-medium text-[var(--color-accent)]">{t.storeName}</p>
                  ) : null}
                  <div className="mt-0.5 flex items-center gap-2">
                    {/* Admin sees only the store/subject — not the message preview. */}
                    {isPlatformAdmin ? (
                      <span className="min-w-0 flex-1" />
                    ) : (
                      <p className="min-w-0 flex-1 truncate text-xs text-neutral-500">{t.preview}</p>
                    )}
                    {t.unread && !active ? <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" /> : null}
                  </div>
                  {t.resolved ? (
                    <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                      解決済み
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </div>

        {resolvedCount > 0 ? (
          <div className="border-t border-neutral-100 p-3">
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              {showResolved ? "解決済みを隠す" : "解決済みの問い合わせを表示"}
            </button>
          </div>
        ) : null}
      </aside>

      {/* Right: conversation */}
      <div className={`min-w-0 flex-1 flex-col ${onThread ? "flex" : "hidden md:flex"}`}>{children}</div>
    </div>
  );
}
