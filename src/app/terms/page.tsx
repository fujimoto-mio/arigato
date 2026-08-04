import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "利用規約 — ARIGATO TiPLY" };

// Placeholder: the final 利用規約 wording is supplied by the client (LF). The
// structure/route is in place so the registration consent link works today.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-800">
        ← ARIGATO TiPLY
      </Link>
      <h1 className="mt-4 text-2xl font-bold">利用規約</h1>
      <p className="mt-2 text-sm text-neutral-500">最終更新日：準備中</p>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        本ページは準備中です。正式な利用規約の文言は追ってこちらに掲載します。
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="text-base font-bold text-neutral-900">第1条（適用）</h2>
          <p className="mt-2">本規約は、ARIGATO TiPLY（以下「本サービス」）の利用に関わる一切の関係に適用されます。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-neutral-900">第2条（料金・サブスクリプション）</h2>
          <p className="mt-2">
            初月無料、2か月目以降は月額5,000円（税抜）の自動課金となります。詳細は正式版にて定めます。
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-neutral-900">第3条（解約）</h2>
          <p className="mt-2">解約はお問い合わせフォームより承ります。詳細は正式版にて定めます。</p>
        </section>
      </div>
    </main>
  );
}
