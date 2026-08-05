import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sakura } from "@/components/brand/Cityscape";
import { LogoBadge } from "@/components/flow/brand";
import { SubscribeForm } from "@/components/SubscribeForm";

export const metadata = { title: "購読お申し込み — ARIGATO TiPLY JAPAN" };

export const dynamic = "force-dynamic";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#faf7f1] px-6 py-16">
      <Sakura className="pointer-events-none absolute left-6 top-10 text-[#f4c4cf] opacity-70 sm:left-16" size={34} />
      <Sakura className="pointer-events-none absolute right-8 top-24 text-[#f6d0b0] opacity-60 sm:right-24" size={24} />
      <Sakura className="pointer-events-none absolute right-16 top-8 text-[#f4c4cf] opacity-50" size={18} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoBadge size={72} />
          <h1 className="mt-4 text-lg font-bold text-neutral-800">購読のお申し込み</h1>
        </div>

        <div className="mt-6 rounded-3xl border border-[var(--color-accent)]/20 bg-white/90 p-6 shadow-[0_10px_40px_-12px_rgba(176,137,90,0.35)] backdrop-blur">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.6} />
              <h2 className="text-base font-bold text-neutral-800">お申し込みありがとうございます</h2>
              <p className="text-sm leading-relaxed text-neutral-500">
                購読手続きが完了しました。担当者が内容を確認のうえ、店舗管理画面のログイン情報とQRコードをメールにてお送りします。今しばらくお待ちください。
              </p>
            </div>
          ) : (
            <>
              {status === "cancel" ? (
                <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  お手続きがキャンセルされました。下記より、いつでも再度お申し込みいただけます。
                </p>
              ) : null}
              <SubscribeForm />
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-medium text-neutral-700">
          既にアカウントをお持ちの方は{" "}
          <Link href="/admin/login" className="font-bold text-[var(--color-logo)] hover:underline">
            ログイン
          </Link>
        </p>
        <p className="mt-3 text-center text-xs font-medium tracking-wide text-neutral-500">
          Powered by <span className="font-bold text-neutral-700">ARIGATO TiPLY JAPAN</span>
        </p>
      </div>

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
