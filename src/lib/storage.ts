import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 object storage (S3-compatible). Uploads go through the S3 API
 * signed with SigV4; objects are served from the bucket's public base URL
 * (r2.dev dev URL or a custom domain — the bucket must have public access on).
 *
 * Env:
 *   R2_ACCOUNT_ID         Cloudflare account id → S3 endpoint host
 *   R2_ACCESS_KEY_ID      R2 API token key
 *   R2_SECRET_ACCESS_KEY  R2 API token secret
 *   R2_BUCKET             bucket name (arigato-tip)
 *   R2_PUBLIC_BASE_URL    public base for serving, e.g. https://pub-xxxx.r2.dev
 */
function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    throw new Error(
      "R2 storage env is not set (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_BASE_URL)",
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    // Trim any trailing slash so join is exactly one separator.
    publicBase: publicBase.replace(/\/+$/, ""),
  };
}

/**
 * Upload bytes to R2 under `key` and return the public URL to persist.
 * `key` is a bucket-relative path like `<storeId>/<uuid>.jpg`.
 */
export async function uploadPublicObject(
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const { accessKeyId, secretAccessKey, bucket, endpoint, publicBase } = r2Config();

  const client = new AwsClient({ accessKeyId, secretAccessKey, region: "auto", service: "s3" });
  const res = await client.fetch(`${endpoint}/${bucket}/${key}`, {
    method: "PUT",
    body,
    // R2's PutObject rejects chunked transfer encoding — send an explicit length.
    headers: { "Content-Type": contentType, "Content-Length": String(body.byteLength) },
  });

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  return `${publicBase}/${key}`;
}
