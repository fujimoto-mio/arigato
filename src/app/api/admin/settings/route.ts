import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { getActiveStore } from "@/lib/admin/store-scope";
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
  // The slug is the guest URL (`/s/<slug>`) that this store's QR points at, so
  // it must stay URL-safe. Changing it re-points the QR (the form warns that
  // codes already printed with the old slug stop working).
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "invalid_slug")
    .optional(),
  // With no Place ID the review flow keeps every rating private instead of
  // deep-linking to Google.
  googlePlaceId: emptyToNull(200),
  instagramUrl: urlOrEmpty,
  facebookUrl: urlOrEmpty,
  logoUrl: z.string().url().nullable().optional(),
});

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  // Which store this edits comes from the top-bar switcher (cookie). The all-
  // stores view can't edit a single store, so require a concrete selection.
  const { activeStore } = await getActiveStore();
  if (!activeStore) {
    return NextResponse.json({ error: "no_store_selected" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    const isSlug = parsed.error.issues.some((issue) => issue.path[0] === "slug");
    return NextResponse.json({ error: isSlug ? "invalid_slug" : "invalid_request" }, { status: 400 });
  }

  // A slug is globally unique, so reject one already taken by another store
  // before the DB does (clearer error than the unique-constraint violation).
  if (parsed.data.slug && parsed.data.slug !== activeStore.slug) {
    const taken = await prisma.store.findUnique({ where: { slug: parsed.data.slug } });
    if (taken) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
  }

  const store = await prisma.store.update({
    where: { id: activeStore.id },
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
