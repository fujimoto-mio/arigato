import { AnnouncementAdmin } from "@/components/admin/AnnouncementAdmin";
import { AnnouncementList } from "@/components/admin/AnnouncementList";
import { CreateAnnouncementButton } from "@/components/admin/CreateAnnouncementButton";
import { listAnnouncements } from "@/lib/admin/announcements";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime } from "@/lib/admin/period";
import { getAllStores } from "@/lib/admin/store-scope";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const ctx = await requireAdmin();
  const [items, stores] = await Promise.all([
    listAnnouncements(ctx),
    ctx.isPlatformAdmin ? getAllStores() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">お知らせ</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {ctx.isPlatformAdmin ? "店舗へのお知らせを配信します。" : "運営からのお知らせです。"}
          </p>
        </div>
        {ctx.isPlatformAdmin ? (
          <CreateAnnouncementButton stores={stores.map((s) => ({ id: s.id, name: s.name }))} />
        ) : null}
      </div>

      {ctx.isPlatformAdmin ? (
        // Admin management view — status toggle + delete.
        <AnnouncementAdmin
          items={items.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            audience: a.storeId ? (a.store?.name ?? "店舗") : "全店舗",
            createdAt: formatTokyoTime(a.createdAt),
            status: a.status,
          }))}
        />
      ) : (
        // Operator view: click a row → details modal, marks that one read.
        <AnnouncementList
          items={items.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            audience: a.storeId ? (a.store?.name ?? "店舗") : "全店舗",
            createdAt: formatTokyoTime(a.createdAt),
            read: a.reads.length > 0,
          }))}
        />
      )}
    </div>
  );
}
