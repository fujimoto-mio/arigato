import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StoreCreateForm } from "@/components/admin/StoreCreateForm";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { resolveAppOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function AdminStoreNewPage() {
  await requirePlatformAdmin(); // creating stores is platform-admin only
  const origin = await resolveAppOrigin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          店舗一覧
        </Link>
        <h1 className="mt-2 text-xl font-bold">新規店舗</h1>
      </div>

      <StoreCreateForm origin={origin} />
    </div>
  );
}
