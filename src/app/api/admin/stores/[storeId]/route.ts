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

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "invalid_slug")
    .optional(),
  googlePlaceId: emptyToNull(200),
  instagramUrl: urlOrEmpty,
  facebookUrl: urlOrEmpty,
  coverImageUrl: z.string().url().nullable().optional(),
});

/** Update one store's info (name, slug, Place ID, socials, cover image). */
export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { storeId } = await params;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    const isSlug = parsed.error.issues.some((issue) => issue.path[0] === "slug");
    return NextResponse.json({ error: isSlug ? "invalid_slug" : "invalid_request" }, { status: 400 });
  }

  // A slug is globally unique, so reject one already taken by another store.
  if (parsed.data.slug && parsed.data.slug !== store.slug) {
    const taken = await prisma.store.findUnique({ where: { slug: parsed.data.slug } });
    if (taken) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
  }

  const updated = await prisma.store.update({ where: { id: storeId }, data: parsed.data });

  return NextResponse.json({
    store: {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      coverImageUrl: updated.coverImageUrl,
      googlePlaceId: updated.googlePlaceId,
      instagramUrl: updated.instagramUrl,
      facebookUrl: updated.facebookUrl,
    },
  });
}

/**
 * Delete a store and everything under it (tips, reviews, story slides cascade;
 * push subscriptions detach). Irreversible — the UI confirms first.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { storeId } = await params;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  await prisma.store.delete({ where: { id: storeId } });
  return NextResponse.json({ ok: true });
}
