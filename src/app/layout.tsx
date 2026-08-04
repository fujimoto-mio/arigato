import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIGATO TiPLY",
  description: "Say thank you to the restaurant, in your language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
