import type { MetadataRoute } from "next";

/** Web app manifest — makes the admin panel installable to the home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARIGATO TiPLY 管理画面",
    short_name: "ARIGATO 管理",
    description: "チップ・口コミの管理ダッシュボード",
    // Installed app opens straight into the admin dashboard.
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171717",
    theme_color: "#171717",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
