import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToAdminIds } from "@/lib/push";

const schema = z
  .object({
    status: z.enum(["draft", "published", "deleted"]),
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
    storeId: z.string().min(1).nullable(),
  })
  .partial();

/** Update an announcement — change status (公開/下書き/削除) or edit. Platform admin only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const before = await prisma.announcement.findUnique({ where: { id }, select: { status: true } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.announcement.update({ where: { id }, data: parsed.data });

  // Notify operators when an announcement transitions into published.
  if (parsed.data.status === "published" && before.status !== "published") {
    try {
      const operators = await prisma.adminUser.findMany({
        where: { role: "store_operator", ...(updated.storeId ? { storeId: updated.storeId } : {}) },
        select: { id: true },
      });
      await sendPushToAdminIds(
        operators.map((o) => o.id),
        {
          title: `お知らせ: ${updated.title}`,
          body: updated.body.slice(0, 80),
          url: "/admin/announcements",
          tag: `announcement-${updated.id}`,
        },
      );
    } catch (e) {
      console.error("announcement notify failed", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
