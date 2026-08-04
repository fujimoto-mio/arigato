import { BarChart3, Bell, Coins, CreditCard, Globe, HelpCircle, Languages, Star, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { LogoMark, Wordmark } from "@/components/flow/brand";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARIGATO TiPLY | 飲食店向け多言語チップ決済サービス",
  description:
    "QRコードを読み込むだけで、インバウンドのお客様が多言語でお店へチップと応援を届けられるサービス。カード・電子ウォレット・現金に対応し、リアルタイム通知とクチコミ育成までワンストップで。",
};

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const PROBLEMS: { icon: Icon; title: string; body: string }[] = [
  {
    icon: HelpCircle,
    title: "チップ文化がなく、渡し方がわからない",
    body: "日本にはもともとチップの習慣がなく、感謝を伝えたい海外のお客様も「どうやって」渡せばいいのか戸惑ってしまいます。",
  },
  {
    icon: Wallet,
    title: "現金を持たないキャッシュレス世代",
    body: "海外からのお客様は現金をほとんど持ち歩きません。渡したい気持ちがあっても、手元に小銭がなければチップは生まれません。",
  },
  {
    icon: Languages,
    title: "多言語対応とクチコミの育成",
    body: "外国語の案内を用意するのは大変。お客様の声をすぐに集め、良い評価をクチコミへつなげる仕組みも多くの店舗にはありません。",
  },
];

const STEPS = [
  { n: "1", title: "QRコードをスキャン", body: "テーブルのQRコードを読み取り、日本語・English・한국어・中文から言語を選びます。" },
  { n: "2", title: "お店のストーリーを見る", body: "お店の写真とこだわりが表示され、雰囲気を感じながら操作を始められます。" },
  { n: "3", title: "金額を選ぶ", body: "「+$1」をタップして、$0からお好きな金額を気持ちにあわせて選べます。" },
  { n: "4", title: "支払い方法を選ぶ", body: "カード・Apple Pay・Google Payで今すぐ、またはお会計時に現金で。チェックひとつで切替。" },
  { n: "5", title: "レビューを書く", body: "★評価・コメント・写真を送信。お店への応援がそのまま届きます。" },
  { n: "6", title: "感謝を受け取る", body: "★4以上のお客様にはGoogleクチコミ・SNSフォローをご案内します。" },
];

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: Globe,
    title: "4言語対応",
    body: "日本語・英語・韓国語・中国語をワンタップで切替。インバウンドのお客様も迷いません。",
  },
  {
    icon: CreditCard,
    title: "カード・電子ウォレット決済",
    body: "Stripeの決済基盤を採用。カード情報は店舗を経由せず、Apple Pay・Google Payにも対応します。",
  },
  {
    icon: Coins,
    title: "現金にも対応",
    body: "カードを使わないお客様は、金額をお会計に加えてレジで精算。どんなお客様にも寄り添えます。",
  },
  {
    icon: Bell,
    title: "リアルタイム通知",
    body: "チップ・口コミが届くと、管理画面のトースト表示とスマホへのプッシュ通知で即座にお知らせします。",
  },
  {
    icon: Star,
    title: "クチコミ育成",
    body: "★4以上は自動でGoogleクチコミ・SNSへご案内。★3以下は店舗だけに届く非公開フィードバックとして分離します。",
  },
  {
    icon: BarChart3,
    title: "売上・レポート集計",
    body: "本日の実績（前日比つき）・累計・日別の推移をダッシュボードでいつでも確認できます。",
  },
];

const FAQS = [
  {
    q: "導入にはどれくらい時間がかかりますか？",
    a: "テーブルに置くQRコードを発行するだけで準備は完了します。管理画面から店舗情報を設定すればすぐに始められます。",
  },
  {
    q: "対応言語はどこまで増やせますか？",
    a: "現在は日本語・英語・韓国語・中国語の4言語に対応しています。",
  },
  {
    q: "海外発行のクレジットカードでも使えますか？",
    a: "はい。Stripeの国際カード決済に対応しているため、海外発行のカードでも問題なくお使いいただけます。",
  },
  {
    q: "決済手数料や料金体系について知りたいです。",
    a: "カード決済には通常の決済手数料が発生します。詳しい料金体系はデモをご確認のうえ、個別にご相談ください。",
  },
];

function DemoPhone() {
  return (
    <div className="mx-auto w-72 overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-2xl">
      <Image
        src="/lp/demo-store.png"
        alt="ARIGATO TiPLY デモストア画面のスクリーンショット"
        width={390}
        height={844}
        className="h-auto w-full"
        priority
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={`${notoSansJP.className} min-h-screen bg-white text-neutral-900`}>
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="flex items-center gap-2">
            <LogoMark size={32} />
            <Wordmark className="text-lg tracking-tight" />
          </span>
          <nav className="hidden gap-6 text-sm font-medium text-neutral-600 sm:flex">
            <a href="#how" className="hover:text-neutral-900">
              使い方
            </a>
            <a href="#features" className="hover:text-neutral-900">
              特長
            </a>
            <a href="#faq" className="hover:text-neutral-900">
              よくある質問
            </a>
          </nav>
          <Link
            href="/s/kokoro"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            デモを見る
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-accent)]">飲食店・バー向け チップ決済サービス</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              スマホをかざすだけで、
              <br />
              &ldquo;感謝&rdquo;をチップに。
            </h1>
            <p className="mt-5 text-base leading-relaxed text-neutral-600">
              インバウンドのお客様はチップの習慣に不慣れでも、スマホでの操作ならすぐに理解できます。ARIGATO
              TiPLYは、テーブルのQRコードを読み込むだけで、多言語対応のチップ決済ができる飲食店向けのおもてなしツールです。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/s/kokoro"
                className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)]"
              >
                デモストアを体験する
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full border border-neutral-300 px-6 py-3 text-center font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
              >
                管理画面ログイン
              </Link>
            </div>
            <p className="mt-3 text-xs text-neutral-400">対応言語：日本語 / English / 한국어 / 中文</p>
          </div>
          <DemoPhone />
        </section>

        <section className="relative h-72 overflow-hidden sm:h-96">
          <Image
            src="/lp/restaurant-lanterns.jpg"
            alt="提灯の灯りに包まれた日本の飲食店の入り口"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 px-6 pb-10 text-center text-white">
            <p className="text-lg font-bold sm:text-2xl">日本の&ldquo;おもてなし&rdquo;を、そのまま世界のお客様へ。</p>
            <p className="text-xs text-white/80 sm:text-sm">スマホひとつで、言葉の壁を越えた感謝が伝わります。</p>
          </div>
        </section>

        <section className="bg-neutral-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">こんなお悩み、ありませんか？</h2>
            <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-sm sm:h-80">
                <Image
                  src="/lp/phone-payment.jpg"
                  alt="レストランのテーブルでスマートフォンをかざして支払う様子"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-6">
                {PROBLEMS.map((p) => (
                  <div key={p.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      <p.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-3 font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">使い方はとてもシンプル</h2>
            <p className="mt-2 text-center text-sm text-neutral-500">お客様の操作はすべてスマホひとつで完結します</p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-neutral-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">主な特長</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    <f.icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">よくある質問</h2>
            <div className="mt-10 divide-y divide-neutral-200 rounded-2xl ring-1 ring-neutral-100">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group p-5">
                  <summary className="cursor-pointer list-none font-medium marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {faq.q}
                      <span className="text-neutral-400 transition-transform group-open:rotate-45">＋</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 text-center text-white sm:py-20">
          <Image
            src="/lp/izakaya-interior.jpg"
            alt="賑わう日本の居酒屋のカウンター席"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative mx-auto max-w-2xl px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">今日から、感謝をカタチにする体験を。</h2>
            <p className="mt-3 text-sm text-neutral-200">まずはデモストアで、実際のお客様の画面をお試しください。</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/s/kokoro"
                className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)]"
              >
                デモストアを体験する
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full border border-white/30 px-6 py-3 text-center font-semibold text-white transition-colors hover:border-white"
              >
                管理画面ログイン
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-neutral-900 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-xs text-neutral-400 sm:flex-row sm:justify-between">
          <span>© 2026 ARIGATO TiPLY</span>
          <div className="flex gap-4">
            <a href="#how" className="hover:text-white">
              使い方
            </a>
            <a href="#features" className="hover:text-white">
              特長
            </a>
            <a href="#faq" className="hover:text-white">
              よくある質問
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
