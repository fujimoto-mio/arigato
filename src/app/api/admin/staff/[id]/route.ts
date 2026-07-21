import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    active: z.boolean().optional(),
    photoUrl: z.string().url().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "empty_update" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { count } = await prisma.staff.updateMany({
    where: { id, storeId: context.store.id },
    data: parsed.data,
  });

  if (count === 0) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const staff = await prisma.staff.findUnique({ where: { id } });
  return NextResponse.json({ staff });
}

/**
 * Deactivate rather than delete: `Tip.staff` cascades on delete, so a hard
 * delete would take the staff member's entire tip history with it. Deactivated
 * staff disappear from the guest picker but stay in the ledger.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const { count } = await prisma.staff.updateMany({
    where: { id, storeId: context.store.id },
    data: { active: false },
  });

  if (count === 0) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deactivated: true });
}
