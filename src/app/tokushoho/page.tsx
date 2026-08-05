import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "特定商取引法に基づく表記 — ARIGATO TiPLY" };

// Placeholder: the final 特定商取引法に基づく表記 is supplied by the client (LF).
export default function TokushohoPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-800">
        ← ARIGATO TiPLY
      </Link>
      <h1 className="mt-4 text-2xl font-bold">特定商取引法に基づく表記</h1>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        本ページは準備中です。正式な表記内容は追ってこちらに掲載します。
      </div>

      <dl className="mt-8 divide-y divide-neutral-100 text-sm">
        {[
          ["販売事業者", "準備中"],
          ["運営責任者", "準備中"],
          ["所在地", "準備中"],
          ["お問い合わせ", "アプリ内のお問い合わせフォームより承ります"],
          ["販売価格", "月額5,000円（税抜）／初月無料"],
          ["支払方法", "クレジットカード（Stripe）"],
          ["支払時期", "毎月自動課金"],
          ["解約について", "お問い合わせフォームより承ります"],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <dt className="w-full font-medium text-neutral-500 sm:w-48 sm:shrink-0">{label}</dt>
            <dd className="text-neutral-800">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
