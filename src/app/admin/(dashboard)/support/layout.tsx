import { SupportShell } from "@/components/admin/SupportShell";
import { requireAdmin } from "@/lib/admin/auth";
import { listThreads } from "@/lib/admin/support";

export const dynamic = "force-dynamic";

function shortTime(value: Date): string {
  // Dates carry the JST wall-clock in their UTC components (see @/lib/prisma).
  return new Date(value).toLocaleString("ja-JP", { timeZone: "UTC", month: "2-digit", day: "2-digit" });
}

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();
  const threads = await listThreads(ctx);

  const items = threads.map((t) => ({
    id: t.id,
    subject: t.subject,
    preview: t.messages[0]?.body ?? "",
    time: shortTime(t.updatedAt),
    unread: ctx.isPlatformAdmin ? t.adminUnread : t.operatorUnread,
    resolved: t.status === "resolved",
    storeName: t.store.name ?? null,
  }));

  return (
    <SupportShell threads={items} isPlatformAdmin={ctx.isPlatformAdmin}>
      {children}
    </SupportShell>
  );
}
