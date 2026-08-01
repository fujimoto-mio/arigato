import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(4000),
});

/** Start a support thread. Only store operators open threads (they contact the platform). */
export async function POST(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;
  if (context.isPlatformAdmin || !context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const thread = await prisma.supportThread.create({
    data: {
      storeId: context.storeId,
      subject: parsed.data.subject,
      adminUnread: true,
      operatorUnread: false,
      messages: { create: { sender: "operator", body: parsed.data.message } },
    },
  });

  return NextResponse.json({ threadId: thread.id });
}
