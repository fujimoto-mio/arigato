import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

/** Mark one announcement as read for the signed-in admin (called when its modal opens). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const announcement = await prisma.announcement.findUnique({ where: { id }, select: { id: true, storeId: true } });
  if (!announcement) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Operators can only read announcements addressed to them (all-stores or their store).
  if (!context.isPlatformAdmin && announcement.storeId != null && announcement.storeId !== context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.announcementRead.upsert({
    where: { announcementId_adminUserId: { announcementId: id, adminUserId: context.adminUserId } },
    create: { announcementId: id, adminUserId: context.adminUserId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
