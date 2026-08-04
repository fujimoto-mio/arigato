"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, useState } from "react";
import { LogoMark } from "@/components/flow/brand";
import { formatUsd } from "@/lib/admin/period";
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
function StorefrontIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h16M4 9l1.2-4.2A1 1 0 0 1 6.2 4h11.6a1 1 0 0 1 1 .8L20 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 20v-5h6v5" />
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

function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" />
    </svg>
  );
}
function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a1 1 0 0 0 1 1h2l3 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M9 6l10-3v18L9 18" />
    </svg>
  );
}
function HelpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01" />
    </svg>
  );
}

// Badge counters, keyed so a nav item can show its own unread count.
type BadgeKey = "notifications" | "support" | "announcements";

type NavItem = {
  href: string;
  label: string;
  // Shorter label for the mobile bottom bar, where width per item is tight.
  short: string;
  Icon: ComponentType<IconProps>;
  badgeKey?: BadgeKey;
  exact?: boolean;
  // Kept out of the cramped mobile bottom bar (still on the desktop rail).
  mobileHidden?: boolean;
};

// Platform admin: manages every store.
const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", short: "ホーム", Icon: GridIcon, exact: true },
  { href: "/admin/notifications", label: "通知", short: "通知", Icon: BellIcon, badgeKey: "notifications" },
  { href: "/admin/tips", label: "チップ履歴", short: "チップ", Icon: YenIcon },
  { href: "/admin/reviews", label: "口コミ一覧", short: "口コミ", Icon: StarIcon },
  { href: "/admin/reports", label: "レポート", short: "レポート", Icon: ChartIcon },
  { href: "/admin/stores", label: "店舗管理", short: "店舗", Icon: StorefrontIcon },
  { href: "/admin/announcements", label: "お知らせ", short: "お知らせ", Icon: MegaphoneIcon, badgeKey: "announcements", mobileHidden: true },
  { href: "/admin/support", label: "お問い合わせ", short: "問合せ", Icon: ChatIcon, badgeKey: "support" },
  { href: "/admin/help", label: "ヘルプ", short: "ヘルプ", Icon: HelpIcon, mobileHidden: true },
  { href: "/admin/settings", label: "設定", short: "設定", Icon: GearIcon },
];

// Store operator: scoped to one store — "店舗管理" becomes "店舗設定" for their
// own store; no multi-store list.
function buildNav(isPlatformAdmin: boolean, operatorStoreId: string | null): NavItem[] {
  if (isPlatformAdmin) return ADMIN_NAV;
  return ADMIN_NAV.map((item) =>
    item.href === "/admin/stores"
      ? { ...item, href: operatorStoreId ? `/admin/stores/${operatorStoreId}` : "/admin", label: "店舗設定" }
      : item,
  );
}

function useSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }
  return { signOut, signingOut };
}

/** Icon-only logout for the mobile top bar (desktop uses the sidebar button). */
export function AdminMobileLogout() {
  const { signOut, signingOut } = useSignOut();
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={signingOut}
      aria-label="ログアウト"
      className="shrink-0 rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 md:hidden"
    >
      <LogoutIcon className="h-6 w-6" />
    </button>
  );
}

function SummaryStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-[var(--color-accent)]">
      {"★".repeat(rounded)}
      <span className="text-neutral-600">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export function AdminSidebar({
  summary,
  badges,
  isPlatformAdmin,
  operatorStoreId,
}: {
  summary: AdminSummary;
  badges: Record<BadgeKey, number>;
  isPlatformAdmin: boolean;
  operatorStoreId: string | null;
}) {
  const pathname = usePathname();
  const { signOut, signingOut } = useSignOut();
  const nav = buildNav(isPlatformAdmin, operatorStoreId);
  const badgeFor = (key?: BadgeKey) => (key ? badges[key] : 0);

  return (
    <>
      {/* Desktop rail */}
      <aside
        style={{ backgroundColor: "#171717" }}
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 self-start overflow-y-auto bg-neutral-900 px-4 py-5 text-white md:flex"
      >
        <div className="flex items-center gap-2 px-2">
          <LogoMark size={40} />
          <div className="leading-tight">
            <p className="text-sm font-bold">
              <span className="text-white">ARIGATO </span>
              <span className="text-[var(--color-accent)]">TiPLY</span>
            </p>
            <p className="text-[9px] tracking-[0.3em] text-neutral-400">JAPAN</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, Icon, badgeKey, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            const count = badgeFor(badgeKey);
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
                <span>{label}</span>
                {count > 0 ? (
                  <span className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">本日のサマリー</p>
          <dl className="mt-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <dt className="text-neutral-400">チップ件数</dt>
              <dd className="font-semibold text-white">{summary.tipCount} 件</dd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <dt className="text-neutral-400">チップ合計金額</dt>
              <dd className="font-semibold text-white">{formatUsd(summary.tipTotal)}</dd>
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
          <span>{signingOut ? "ログアウト中…" : "ログアウト"}</span>
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        style={{ backgroundColor: "#171717" }}
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-neutral-900 px-1 pb-[env(safe-area-inset-bottom)] text-white md:hidden"
      >
        {nav
          .filter((item) => !item.mobileHidden)
          .map(({ href, short, Icon, badgeKey, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            const count = badgeFor(badgeKey);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
                  isActive ? "text-[var(--color-accent)]" : "text-neutral-400"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {count > 0 ? (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                </span>
                {short}
              </Link>
            );
          })}
      </nav>
    </>
  );
}
