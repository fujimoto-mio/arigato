import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  category: z.string().trim().min(1).max(60),
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(4000),
  sortOrder: z.number().int().optional(),
});

/** Create an FAQ entry. Platform admin only. */
export async function POST(request: Request) {
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const faq = await prisma.faq.create({ data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? 0 } });
  return NextResponse.json({ id: faq.id });
}
