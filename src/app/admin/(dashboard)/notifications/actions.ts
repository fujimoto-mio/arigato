"use server";

import { getAdminContext } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

/** Mark a single notification (tip) as read for the signed-in admin. */
export async function markNotificationRead(tipId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await prisma.notificationRead.upsert({
    where: { adminUserId_tipId: { adminUserId: ctx.adminUserId, tipId } },
    create: { adminUserId: ctx.adminUserId, tipId },
    update: {},
  });
}
