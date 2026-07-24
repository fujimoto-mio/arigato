import Link from "next/link";
import { AdminMobileLogout, AdminSidebar, type AdminSummary } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin/auth";
import { startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "ダッシュボード — ARIGATO TiP" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { store, email } = await requireAdmin();
  const todayStart = startOfTokyoDay();

  const [tipsAgg, reviewsAgg] = await Promise.all([
    prisma.tip.aggregate({
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.review.aggregate({
      where: { storeId: store.id, createdAt: { gte: todayStart } },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const summary: AdminSummary = {
    tipCount: tipsAgg._count,
    tipTotal: tipsAgg._sum.amount ?? 0,
    reviewCount: reviewsAgg._count,
    avgRating: reviewsAgg._avg.rating,
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar summary={summary} notifCount={summary.tipCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{store.name}</h1>
            <p className="truncate text-xs text-neutral-500">
              /s/{store.slug}
              {email ? ` · ${email}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/admin/notifications"
              aria-label="通知"
              className="relative rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              {summary.tipCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {summary.tipCount > 99 ? "99+" : summary.tipCount}
                </span>
              ) : null}
            </Link>
            <AdminMobileLogout />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
