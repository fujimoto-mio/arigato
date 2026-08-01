import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { broadcastSupportMessage } from "@/lib/realtime";

/**
 * Mark a thread read for the caller's side. Called once when the thread is
 * genuinely opened (client mount) — never on a background realtime refresh — so
 * read receipts only flip when someone actually looks at the conversation.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    select: { id: true, storeId: true, adminUnread: true, operatorUnread: true },
  });
  if (!thread) return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
  if (!context.isPlatformAdmin && thread.storeId !== context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const wasUnread = context.isPlatformAdmin ? thread.adminUnread : thread.operatorUnread;
  if (wasUnread) {
    await prisma.supportThread.update({
      where: { id: threadId },
      data: context.isPlatformAdmin ? { adminUnread: false } : { operatorUnread: false },
    });
    // Tell the other party so their sent messages flip to 既読 (the check icon).
    await broadcastSupportMessage(threadId, { sender: context.isPlatformAdmin ? "admin" : "operator" });
  }

  return NextResponse.json({ ok: true });
}
