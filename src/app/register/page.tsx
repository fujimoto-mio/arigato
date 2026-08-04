import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";
import { Sakura } from "@/components/brand/Cityscape";
import { LogoBadge } from "@/components/flow/brand";

export const metadata: Metadata = { title: "店舗登録 — ARIGATO TiPLY JAPAN" };

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#faf7f1] px-6 pb-40 pt-14">
      <Sakura className="pointer-events-none absolute left-6 top-10 text-[#f4c4cf] opacity-70 sm:left-20" size={34} />
      <Sakura className="pointer-events-none absolute right-8 top-20 text-[#f6d0b0] opacity-60 sm:right-28" size={24} />
      <Sakura className="pointer-events-none absolute right-20 top-8 text-[#f4c4cf] opacity-50" size={18} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <LogoBadge size={72} />
          <h1 className="mt-5 text-2xl font-bold text-neutral-900">店舗登録</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            店舗情報をご登録ください。管理者の承認後に、お客様用のQRコード・ページが有効になります。
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-[var(--color-accent)]/20 bg-white/90 p-6 shadow-[0_10px_40px_-12px_rgba(176,137,90,0.35)] backdrop-blur sm:p-7">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm font-medium text-neutral-700">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/admin/login" className="font-bold text-[var(--color-logo)] hover:underline">
            ログイン
          </Link>
        </p>
      </div>

      <Image
        src="/lp/skyline.png"
        alt=""
        aria-hidden="true"
        width={889}
        height={345}
        className="pointer-events-none fixed inset-x-0 bottom-0 h-auto w-full opacity-80"
      />
    </main>
  );
}
