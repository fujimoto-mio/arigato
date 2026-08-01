import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { broadcastSupportMessage } from "@/lib/realtime";

const schema = z.object({
  body: z.string().trim().min(1).max(4000),
  // https Supabase URL (upload) or local /path.
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => v == null || /^(https?:\/\/|\/)/.test(v), "invalid_url"),
});

/** Post a message to a thread. Either side; role is derived from the auth context. */
export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    include: { store: { select: { name: true } } },
  });
  if (!thread) return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
  if (!context.isPlatformAdmin && thread.storeId !== context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const sender = context.isPlatformAdmin ? "admin" : "operator";
  await prisma.$transaction([
    prisma.supportMessage.create({
      data: { threadId, sender, body: parsed.data.body, imageUrl: parsed.data.imageUrl ?? null },
    }),
    prisma.supportThread.update({
      where: { id: threadId },
      // A reply reopens the thread and marks it unread for the other side.
      data: { status: "open", ...(sender === "operator" ? { adminUnread: true } : { operatorUnread: true }) },
    }),
  ]);

  // No push for support — deliver the new message live to whoever has the thread open.
  await broadcastSupportMessage(threadId, { sender });

  return NextResponse.json({ ok: true });
}
