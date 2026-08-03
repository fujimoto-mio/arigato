import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadPublicObject } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Guest-facing upload for a review photo. No admin auth: the guest is anonymous.
 * Gated by a valid tipId that has no review yet, so uploads are tied to a real,
 * un-reviewed tip and scoped to that store's namespace.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const tipId = form.get("tipId");

  if (typeof tipId !== "string" || !tipId) {
    return NextResponse.json({ error: "missing_tip" }, { status: 400 });
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

  const tip = await prisma.tip.findUnique({ where: { id: tipId }, include: { review: true } });
  if (!tip) {
    return NextResponse.json({ error: "tip_not_found" }, { status: 404 });
  }
  if (tip.review) {
    return NextResponse.json({ error: "review_already_submitted" }, { status: 409 });
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `reviews/${tip.storeId}/${crypto.randomUUID()}.${extension}`;

  try {
    const url = await uploadPublicObject(path, await file.arrayBuffer(), file.type);
    return NextResponse.json({ url });
  } catch (uploadError) {
    console.error("Review photo upload failed", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
