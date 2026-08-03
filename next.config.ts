import type { NextConfig } from "next";

// Store media (covers, story slides, review photos) is served from Cloudflare R2's
// public URL, so next/image needs that host allow-listed.
const r2Host = process.env.R2_PUBLIC_BASE_URL
  ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host, pathname: "/**" }] : [],
  },
};

export default nextConfig;
