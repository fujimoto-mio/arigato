import { notFound } from "next/navigation";
import type { AdminContext } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

/** Thread list for the current admin — operator: own store; platform admin: all. */
export async function listThreads(ctx: AdminContext, status?: "open" | "resolved") {
  return prisma.supportThread.findMany({
    where: {
      // Operator with no store id can never match a real store.
      ...(ctx.isPlatformAdmin ? {} : { storeId: ctx.storeId ?? "__none__" }),
      ...(status ? { status } : {}),
    },
    include: {
      store: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, sender: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** One thread with its messages, enforcing role access (operator → own store only). */
export async function getThreadForCtx(ctx: AdminContext, threadId: string) {
  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    include: {
      store: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) notFound();
  if (!ctx.isPlatformAdmin && thread.storeId !== ctx.storeId) notFound();
  return thread;
}

/** Unread thread count for the sidebar badge (this side's unread flag). */
export async function unreadThreadCount(ctx: AdminContext): Promise<number> {
  if (ctx.isPlatformAdmin) return prisma.supportThread.count({ where: { adminUnread: true } });
  if (!ctx.storeId) return 0;
  return prisma.supportThread.count({ where: { storeId: ctx.storeId, operatorUnread: true } });
}
