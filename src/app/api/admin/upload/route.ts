import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
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

/** Upload a staff photo or store logo. Returns the public URL to persist. */
export async function POST(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const supabase = supabaseServiceClient();
  await ensureBucket(supabase);

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  // Store-scoped path keeps one store's uploads out of another's namespace.
  const path = `${context.store.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Storage upload failed", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
