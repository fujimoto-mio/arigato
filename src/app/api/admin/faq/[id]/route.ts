import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    category: z.string().trim().min(1).max(60),
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(4000),
    sortOrder: z.number().int(),
  })
  .partial();

/** Update an FAQ entry. Platform admin only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  await prisma.faq.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

/** Delete an FAQ entry. Platform admin only. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  await prisma.faq.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
