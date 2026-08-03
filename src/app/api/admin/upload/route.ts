import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getActiveStore } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";
import { uploadPublicObject } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload a store image (cover / story photo). Returns the public URL to persist. */
export async function POST(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const form = await request.formData();
  const file = form.get("file");

  // The target store is named in the form (Store Management editor); fall back to
  // the top-bar active store for any other caller.
  const storeIdField = form.get("storeId");
  let storeId = typeof storeIdField === "string" && storeIdField ? storeIdField : null;
  if (storeId) {
    const exists = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!exists) storeId = null;
  }
  if (!storeId) {
    const { activeStore } = await getActiveStore();
    storeId = activeStore?.id ?? null;
  }
  if (!storeId) {
    return NextResponse.json({ error: "no_store_selected" }, { status: 400 });
  }
  // Operators may only upload into their own store.
  if (!context.isPlatformAdmin && storeId !== context.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  // Store-scoped path keeps one store's uploads out of another's namespace.
  const path = `${storeId}/${crypto.randomUUID()}.${extension}`;

  try {
    const url = await uploadPublicObject(path, await file.arrayBuffer(), file.type);
    return NextResponse.json({ url });
  } catch (uploadError) {
    console.error("Storage upload failed", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
