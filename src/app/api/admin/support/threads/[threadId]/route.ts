import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["open", "resolved"]) });

/** Resolve / reopen a thread. Either side (operator on their own store). */
export async function PATCH(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const thread = await prisma.supportThread.findUnique({ where: { id: threadId }, select: { storeId: true } });
  if (!thread) return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
  if (!context.isPlatformAdmin && thread.storeId !== context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  await prisma.supportThread.update({ where: { id: threadId }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
