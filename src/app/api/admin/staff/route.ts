import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  photoUrl: z.string().url().nullable().optional(),
});

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const last = await prisma.staff.findFirst({
    where: { storeId: context.store.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const staff = await prisma.staff.create({
    data: {
      storeId: context.store.id,
      name: parsed.data.name,
      photoUrl: parsed.data.photoUrl ?? null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ staff });
}

/** Persist the roster order shown to guests. Body: `{ ids: [...] }` in display order. */
export async function PATCH(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const parsed = reorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Scope the writes to this store so an admin can't reorder another store's roster.
  const owned = await prisma.staff.findMany({
    where: { id: { in: parsed.data.ids }, storeId: context.store.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((member) => member.id));

  await prisma.$transaction(
    parsed.data.ids
      .filter((id) => ownedIds.has(id))
      .map((id, index) => prisma.staff.update({ where: { id }, data: { sortOrder: index } })),
  );

  return NextResponse.json({ ok: true });
}
