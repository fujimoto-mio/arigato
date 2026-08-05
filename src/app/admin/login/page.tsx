import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Sakura } from "@/components/brand/Cityscape";
import { LogoBadge } from "@/components/flow/brand";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata = { title: "ログイン — ARIGATO TiPLY JAPAN" };

// Reads the session cookie to bounce already-signed-in admins, so it must never
// be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminContext()) {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#faf7f1] px-6 py-16">
      {/* Soft sakura accents */}
      <Sakura className="pointer-events-none absolute left-6 top-10 text-[#f4c4cf] opacity-70 sm:left-16" size={34} />
      <Sakura className="pointer-events-none absolute right-8 top-24 text-[#f6d0b0] opacity-60 sm:right-24" size={24} />
      <Sakura className="pointer-events-none absolute right-16 top-8 text-[#f4c4cf] opacity-50" size={18} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoBadge size={78} />
          <p className="mt-4 text-sm font-medium text-neutral-500">店舗管理画面</p>
        </div>

        <div className="mt-8 rounded-3xl border border-[var(--color-accent)]/20 bg-white/90 p-6 shadow-[0_10px_40px_-12px_rgba(176,137,90,0.35)] backdrop-blur">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm font-medium text-neutral-700">
          購読のお申し込みは{" "}
          <Link href="/subscribe" className="font-bold text-[var(--color-logo)] hover:underline">
            こちら
          </Link>
        </p>

        <p className="mt-3 text-center text-xs font-medium tracking-wide text-neutral-500">
          Powered by <span className="font-bold text-neutral-700">ARIGATO TiPLY JAPAN</span>
        </p>
      </div>

      {/* Gold skyline along the bottom */}
      <Image
        src="/lp/skyline.png"
        alt=""
        aria-hidden="true"
        width={889}
        height={345}
        priority
        className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full opacity-80"
      />
    </main>
  );
}
