import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  // Empty string clears the field: with no Place ID the review flow keeps every
  // rating private instead of deep-linking to Google.
  googlePlaceId: z
    .string()
    .trim()
    .max(200)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export async function PATCH(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const store = await prisma.store.update({
    where: { id: context.store.id },
    data: parsed.data,
  });

  return NextResponse.json({
    store: {
      id: store.id,
      slug: store.slug,
      name: store.name,
      logoUrl: store.logoUrl,
      googlePlaceId: store.googlePlaceId,
    },
  });
}
