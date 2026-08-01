import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToAdminIds } from "@/lib/push";

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  // Omitted / null = all stores; a store id targets one store's operator.
  storeId: z.string().min(1).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

/** Create an announcement (draft or published). Platform admin only. */
export async function POST(request: Request) {
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const storeId = parsed.data.storeId ?? null;
  if (storeId) {
    const exists = await prisma.store.findFirst({ where: { id: storeId, deletedAt: null }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  const status = parsed.data.status ?? "published";
  const announcement = await prisma.announcement.create({
    data: { title: parsed.data.title, body: parsed.data.body, storeId, status },
  });

  // Only a published announcement notifies operators.
  if (status !== "published") return NextResponse.json({ id: announcement.id });
  try {
    const operators = await prisma.adminUser.findMany({
      where: { role: "store_operator", ...(storeId ? { storeId } : {}) },
      select: { id: true },
    });
    await sendPushToAdminIds(
      operators.map((o) => o.id),
      {
        title: `お知らせ: ${parsed.data.title}`,
        body: parsed.data.body.slice(0, 80),
        url: "/admin/announcements",
        tag: `announcement-${announcement.id}`,
      },
    );
  } catch (e) {
    console.error("announcement notify failed", (e as Error).message);
  }

  return NextResponse.json({ id: announcement.id });
}
