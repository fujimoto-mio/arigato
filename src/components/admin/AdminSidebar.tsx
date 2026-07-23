"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AdminSummary = {
  tipCount: number;
  tipTotal: number;
  reviewCount: number;
  avgRating: number | null;
};

type IconProps = { className?: string };

function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function YenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8l3 4 3-4M9 13h6M9 16h6M12 12v4" />
    </svg>
  );
}
function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
    </svg>
  );
}
function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10" />
      <path d="M18 15l3-3-3-3M21 12H9" />
    </svg>
  );
}
function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
  badge?: boolean;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", Icon: GridIcon, exact: true },
  { href: "/admin/notifications", label: "通知", Icon: BellIcon, badge: true },
  { href: "/admin/tips", label: "チップ履歴", Icon: YenIcon },
  { href: "/admin/reviews", label: "口コミ一覧", Icon: StarIcon },
  { href: "/admin/reports", label: "レポート", Icon: ChartIcon },
  { href: "/admin/settings", label: "設定", Icon: GearIcon },
];

function SummaryStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-[var(--color-accent)]">
      {"★".repeat(rounded)}
      <span className="text-neutral-600">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export function AdminSidebar({ summary, notifCount }: { summary: AdminSummary; notifCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside
      style={{ backgroundColor: "#171717" }}
      className="sticky top-0 flex h-screen w-16 shrink-0 flex-col gap-6 self-start overflow-y-auto bg-neutral-900 px-2 py-5 text-white md:w-64 md:px-4"
    >
      <div className="flex items-center gap-2 px-1 md:px-2">
        <Image src="/arigato-logo.png" alt="ARIGATO TiP JAPAN" width={36} height={36} className="object-contain" />
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-bold">
            <span className="text-white">ARIGATO </span>
            <span className="text-[var(--color-accent)]">TiP</span>
          </p>
          <p className="text-[9px] tracking-[0.3em] text-neutral-400">JAPAN</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon, badge, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{label}</span>
              {badge && notifCount > 0 ? (
                <span className="ml-auto hidden min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white md:inline">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 md:block">
        <p className="text-sm font-bold text-white">本日のサマリー</p>
        <dl className="mt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <dt className="text-neutral-400">チップ件数</dt>
            <dd className="font-semibold text-white">{summary.tipCount} 件</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <dt className="text-neutral-400">チップ合計金額</dt>
            <dd className="font-semibold text-white">¥{summary.tipTotal.toLocaleString("ja-JP")}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <dt className="text-neutral-400">口コミ件数</dt>
            <dd className="font-semibold text-white">{summary.reviewCount} 件</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-400">平均評価</dt>
            <dd className="flex items-center gap-1 font-semibold text-white">
              {summary.avgRating ? (
                <>
                  <SummaryStars rating={summary.avgRating} /> {summary.avgRating.toFixed(1)}
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:opacity-50"
      >
        <LogoutIcon className="h-5 w-5 shrink-0" />
        <span className="hidden md:inline">{signingOut ? "ログアウト中…" : "ログアウト"}</span>
      </button>
    </aside>
  );
}
