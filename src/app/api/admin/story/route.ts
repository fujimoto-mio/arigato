import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { getActiveStore } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";

const slideSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .refine((value) => value == null || /^https?:\/\//.test(value), "invalid_url"),
});

// Up to 8 slides keeps the guest scroll reasonable; empty clears the story
// (the guest landing then falls back to the stock story text).
const bodySchema = z.object({ slides: z.array(slideSchema).max(8) });

/**
 * Replace the active store's "Our Story" slides in one shot. Which store this
 * targets comes from the top-bar switcher (cookie); the all-stores view can't
 * edit a single store's story, so a concrete selection is required.
 */
export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { activeStore } = await getActiveStore();
  if (!activeStore) {
    return NextResponse.json({ error: "no_store_selected" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const storeId = activeStore.id;
  const slides = parsed.data.slides;

  // Replace-all in a transaction: drop the old slides, recreate in order. Simpler
  // and race-free versus diffing, and slide counts are tiny.
  await prisma.$transaction([
    prisma.storySlide.deleteMany({ where: { storeId } }),
    ...slides.map((slide, index) =>
      prisma.storySlide.create({
        data: {
          storeId,
          sortOrder: index,
          title: slide.title,
          body: slide.body,
          imageUrl: slide.imageUrl ?? null,
        },
      }),
    ),
  ]);

  return NextResponse.json({ ok: true, count: slides.length });
}
