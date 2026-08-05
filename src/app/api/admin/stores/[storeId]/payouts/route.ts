import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

// A calendar date (YYYY-MM-DD) anchored to JST midnight, or null when omitted.
const jstDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable()
  .transform((value) => (value ? new Date(`${value}T00:00:00+09:00`) : null));

const schema = z.object({
  // USD cents (same unit as Tip.amount). Positive integer.
  amount: z.number().int().positive().max(1_000_000_00),
  periodStart: jstDate,
  periodEnd: jstDate,
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
});

/** Record a manual month-end payout to a store — platform admin only. */
export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { context, error } = await requirePlatformAdminApi();
  if (error) return error;

  const { storeId } = await params;
  const store = await prisma.store.findFirst({ where: { id: storeId, deletedAt: null } });
  if (!store) return NextResponse.json({ error: "store_not_found" }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const payout = await prisma.payout.create({
    data: {
      storeId,
      amount: parsed.data.amount,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      note: parsed.data.note,
      createdByAdminId: context.adminUserId,
    },
  });

  return NextResponse.json({ payout: { id: payout.id } });
}
