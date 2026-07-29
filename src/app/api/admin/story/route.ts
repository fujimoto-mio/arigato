import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

// Title/body are locale maps { en, ja, ko, zh } — each language optional.
const localeTextSchema = z.object({
  en: z.string().trim().max(2000).optional(),
  ja: z.string().trim().max(2000).optional(),
  ko: z.string().trim().max(2000).optional(),
  zh: z.string().trim().max(2000).optional(),
});

const slideSchema = z.object({
  title: localeTextSchema,
  body: localeTextSchema,
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    // Uploaded photos are https Supabase URLs; stock/placeholder photos are local
    // paths (e.g. /lp/...). Allow both.
    .refine((value) => value == null || /^(https?:\/\/|\/)/.test(value), "invalid_url"),
});

// Up to 8 slides keeps the guest scroll reasonable; empty clears the story
// (the guest landing then falls back to the stock story text).
const bodySchema = z.object({
  storeId: z.string().min(1),
  slides: z.array(slideSchema).max(8),
});

/**
 * Replace one store's "Our Story" slides in one shot. The store to edit is named
 * in the body (the Store Management editor knows which store it is on).
 */
export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const storeId = parsed.data.storeId;
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  const slides = parsed.data.slides;

  // Replace-all in a transaction: drop the old slides, recreate in order. One
  // createMany keeps it to 2 round-trips (vs one INSERT per slide) — matters when
  // the DB is a region away.
  const ops: Prisma.PrismaPromise<unknown>[] = [prisma.storySlide.deleteMany({ where: { storeId } })];
  if (slides.length > 0) {
    ops.push(
      prisma.storySlide.createMany({
        data: slides.map((slide, index) => ({
          storeId,
          sortOrder: index,
          title: slide.title as Prisma.InputJsonValue,
          body: slide.body as Prisma.InputJsonValue,
          imageUrl: slide.imageUrl ?? null,
        })),
      }),
    );
  }
  await prisma.$transaction(ops);

  return NextResponse.json({ ok: true, count: slides.length });
}
