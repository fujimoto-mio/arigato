import type { Prisma } from "@prisma/client";
import type { AdminContext } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

/**
 * Visibility scope:
 *  - operator: published announcements addressed to them (all-stores or their store)
 *  - admin: everything except deleted (draft + published)
 */
function visibleWhere(ctx: AdminContext): Prisma.AnnouncementWhereInput {
  // Admin manages every announcement including deleted (soft delete is reversible).
  if (ctx.isPlatformAdmin) return {};
  return { status: "published", OR: [{ storeId: null }, { storeId: ctx.storeId ?? "__none__" }] };
}

export async function listAnnouncements(ctx: AdminContext) {
  return prisma.announcement.findMany({
    where: visibleWhere(ctx),
    include: {
      store: { select: { name: true } },
      reads: { where: { adminUserId: ctx.adminUserId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Unread published-announcement count for the operator's sidebar dot. */
export async function unreadAnnouncementCount(ctx: AdminContext): Promise<number> {
  if (ctx.isPlatformAdmin) return 0;
  const items = await prisma.announcement.findMany({
    where: visibleWhere(ctx),
    select: { reads: { where: { adminUserId: ctx.adminUserId }, select: { id: true } } },
  });
  return items.filter((a) => a.reads.length === 0).length;
}
