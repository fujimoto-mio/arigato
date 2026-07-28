import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  // The slug is the guest URL (`/s/<slug>`); it must stay URL-safe and unique.
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "invalid_slug"),
});

/** Create a new store. Any admin manages every store, so no auth wiring needed. */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    const isSlug = parsed.error.issues.some((issue) => issue.path[0] === "slug");
    return NextResponse.json({ error: isSlug ? "invalid_slug" : "invalid_request" }, { status: 400 });
  }

  const taken = await prisma.store.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }

  const store = await prisma.store.create({
    data: { name: parsed.data.name, slug: parsed.data.slug },
  });

  return NextResponse.json({ store: { id: store.id, slug: store.slug, name: store.name } });
}
