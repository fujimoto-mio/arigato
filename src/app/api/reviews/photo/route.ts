import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "store-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function ensureBucket(supabase: ReturnType<typeof supabaseServiceClient>) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ALLOWED_TYPES,
  });
}

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

  const supabase = supabaseServiceClient();
  await ensureBucket(supabase);

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `reviews/${tip.storeId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Review photo upload failed", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
