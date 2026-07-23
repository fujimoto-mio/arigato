import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

// Empty string clears an optional field back to null.
const emptyToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .refine((value) => value == null || /^https?:\/\//.test(value), "invalid_url");

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  // With no Place ID the review flow keeps every rating private instead of
  // deep-linking to Google.
  googlePlaceId: emptyToNull(200),
  instagramUrl: urlOrEmpty,
  facebookUrl: urlOrEmpty,
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
      instagramUrl: store.instagramUrl,
      facebookUrl: store.facebookUrl,
    },
  });
}
