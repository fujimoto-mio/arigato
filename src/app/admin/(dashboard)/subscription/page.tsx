import { redirect } from "next/navigation";
import { SubscriptionPanel } from "@/components/admin/SubscriptionPanel";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * 購読登録 — the store operator's subscription page. Bound to their own store, so
 * the subscription links directly to it (no matching against the Google Form).
 * The platform admin has no store to subscribe, so they're sent to the dashboard.
 */
export default async function SubscriptionPage() {
  const ctx = await requireAdmin();
  if (ctx.isPlatformAdmin || !ctx.storeId) redirect("/admin");

  const store = await prisma.store.findUnique({
    where: { id: ctx.storeId },
    select: { subscriptionStatus: true, subscriptionCurrentPeriodEnd: true },
  });
  if (!store) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">購読</h1>
        <p className="mt-1 text-sm text-neutral-500">
          店舗の月額購読です。初月は無料トライアル、2か月目から自動課金されます。お客様ページの公開は管理者によるログイン発行で行います。
        </p>
      </div>

      <SubscriptionPanel
        status={store.subscriptionStatus}
        currentPeriodEnd={store.subscriptionCurrentPeriodEnd?.toISOString() ?? null}
      />
    </div>
  );
}
