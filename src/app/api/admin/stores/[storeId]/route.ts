import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi, requireStoreAccessApi } from "@/lib/admin/auth";
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
  // https Supabase URL (uploads) or a local /path (stock placeholders).
  coverImageUrl: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .refine((value) => value == null || /^(https?:\/\/|\/)/.test(value), "invalid_url"),
  // Suspend / reactivate — platform admin only (enforced below).
  status: z.enum(["active", "suspended"]).optional(),
});

/** Update one store's info (name, slug, Place ID, socials, cover image, status). */
export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  // Operators may edit their own store; the platform admin may edit any.
  const { context, error } = await requireStoreAccessApi(storeId);
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    const isSlug = parsed.error.issues.some((issue) => issue.path[0] === "slug");
    return NextResponse.json({ error: isSlug ? "invalid_slug" : "invalid_request" }, { status: 400 });
  }

  // Suspending / reactivating a store is platform-admin only.
  if (parsed.data.status && !context.isPlatformAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
      status: updated.status,
    },
  });
}

/**
 * Soft-delete a store: mark it deleted and hide it everywhere, but keep its tips /
 * reviews / history. The slug is freed (renamed) so a new store can reuse it.
 * Irreversible from the UI — the UI confirms first.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const { storeId } = await params;
  const store = await prisma.store.findFirst({ where: { id: storeId, deletedAt: null } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  // Free the original slug for reuse (kept URL-safe and within the 50-char limit).
  const freedSlug = `${store.slug}-del-${store.id.slice(0, 6)}`.slice(0, 50);
  await prisma.store.update({
    where: { id: storeId },
    data: { status: "deleted", deletedAt: new Date(), slug: freedSlug },
  });
  return NextResponse.json({ ok: true });
}
