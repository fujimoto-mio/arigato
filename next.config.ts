import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// New store media is served from Cloudflare R2's public URL; images uploaded
// before the R2 switch still carry Supabase Storage URLs, so allow both hosts.
const remotePatterns: RemotePattern[] = [];

if (process.env.R2_PUBLIC_BASE_URL) {
  remotePatterns.push({
    protocol: "https",
    hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname,
    pathname: "/**",
  });
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  remotePatterns.push({
    protocol: "https",
    hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
