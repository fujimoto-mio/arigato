import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { nameToSlug } from "@/lib/slug";

const schema = z.object({ name: z.string().trim().max(80), storeId: z.string().optional() });

/**
 * Suggest a unique, URL-safe slug from a store name (romaji for Japanese names).
 * Appends a short suffix if the base slug is already taken by another store, so
 * the caller always gets an available slug.
 */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const root = (nameToSlug(parsed.data.name) || "store").slice(0, 40);
  let candidate = root;
  // Skip a hit that is this store's own slug (editing keeps its slug available).
  for (let i = 0; i < 50; i += 1) {
    const existing = await prisma.store.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === parsed.data.storeId) break;
    candidate = `${root}-${randomBytes(2).toString("hex")}`.slice(0, 50);
  }

  return NextResponse.json({ slug: candidate });
}
