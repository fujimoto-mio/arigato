import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { PushToggle } from "@/components/admin/PushToggle";
import { StoreSettings } from "@/components/admin/StoreSettings";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAppOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { store } = await requireAdmin();
  const origin = await resolveAppOrigin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">設定</h1>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗情報</h2>
        <p className="mb-4 text-sm text-neutral-500">お客様の画面に表示されます。</p>
        <StoreSettings
          origin={origin}
          store={{
            name: store.name,
            slug: store.slug,
            googlePlaceId: store.googlePlaceId,
            logoUrl: store.logoUrl,
            instagramUrl: store.instagramUrl,
            facebookUrl: store.facebookUrl,
          }}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">通知設定</h2>
        <p className="mb-4 text-sm text-neutral-500">
          新しいチップ・口コミが届いたときに、この端末へプッシュ通知を送ります。端末ごとに設定が必要です。
        </p>
        <PushToggle variant="switch" />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">パスワード変更</h2>
        <p className="mb-4 text-sm text-neutral-500">ログインに使用するパスワードを変更します。</p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
