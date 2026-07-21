import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARIGATO TiP | 飲食店向け多言語チップ決済サービス",
  description:
    "QRコードを読み込むだけで、インバウンドのお客様がスタッフへ多言語でチップを渡せるサービス。カード決済・リアルタイム通知・クチコミ育成までワンストップで。",
};

const PROBLEMS = [
  {
    icon: "😕",
    title: "チップ文化がなく、渡し方がわからない",
    body: "日本にはもともとチップの習慣がなく、感謝を伝えたい海外のお客様も「誰に」「どうやって」渡せばいいのか戸惑ってしまいます。",
  },
  {
    icon: "💴",
    title: "現金を持たないキャッシュレス世代",
    body: "海外からのお客様は現金をほとんど持ち歩きません。渡したい気持ちがあっても、手元に小銭がなければチップは生まれません。",
  },
  {
    icon: "🌐",
    title: "多言語対応とスタッフのやる気の見える化",
    body: "外国語対応の掲示や案内を作るのは大変。スタッフ一人ひとりの頑張りを、お客様の声としてすぐに届ける仕組みも多くの店舗にはありません。",
  },
] as const;

const STEPS = [
  { n: "1", title: "QRコードをスキャン", body: "テーブルのQRコードを読み取り、日本語・English・한국어・中文から言語を選びます。" },
  { n: "2", title: "店舗ページが表示", body: "店舗の写真とウェルカムメッセージが表示され、迷わず操作を始められます。" },
  { n: "3", title: "スタッフを選ぶ", body: "横スクロールのアバターから、お礼を伝えたいスタッフをタップ。" },
  { n: "4", title: "金額を選ぶ", body: "¥1,000〜¥20,000までの6段階から、気持ちに合った金額をタップ。" },
  { n: "5", title: "カードで支払う", body: "Stripeの安全な決済フォームでカード情報を入力するだけ。" },
  { n: "6", title: "感謝を伝える", body: "★評価とコメントを送信。高評価は自動でGoogleクチコミへご案内します。" },
] as const;

const FEATURES = [
  {
    icon: "🌐",
    title: "4言語対応",
    body: "日本語・英語・韓国語・中国語をワンタップで切替。インバウンドのお客様も迷いません。",
  },
  {
    icon: "💳",
    title: "安全なカード決済",
    body: "Stripeの決済基盤を採用。カード情報は店舗を経由せず、PCI準拠のフォームで安全に処理されます。",
  },
  {
    icon: "🔔",
    title: "リアルタイム通知",
    body: "チップが入るとスタッフ・管理画面に即座に通知。お客様が帰る前にお礼を伝えられます。",
  },
  {
    icon: "⭐",
    title: "クチコミ育成",
    body: "★3以上は自動でGoogleクチコミへ誘導。★2以下は店舗だけに届く非公開フィードバックとして分離します。",
  },
  {
    icon: "👥",
    title: "スタッフ管理",
    body: "スタッフの追加・並び替え・写真登録を管理画面からかんたんに行えます。",
  },
  {
    icon: "📊",
    title: "売上・チップの集計",
    body: "本日の合計金額、件数、スタッフ別の内訳をダッシュボードでいつでも確認できます。",
  },
] as const;

const FAQS = [
  {
    q: "導入にはどれくらい時間がかかりますか？",
    a: "テーブルに置くQRコードを発行するだけで準備は完了します。スタッフ登録も管理画面からすぐに行えます。",
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
    q: "低い評価がついた場合、公開されてしまいますか？",
    a: "★2以下の評価はGoogleには送信されず、店舗の管理画面にのみ非公開で届きます。改善のための貴重な声として活用いただけます。",
  },
  {
    q: "決済手数料や料金体系について知りたいです。",
    a: "カード決済には通常の決済手数料が発生します。詳しい料金体系はデモをご確認のうえ、個別にご相談ください。",
  },
] as const;

function DemoPhone() {
  return (
    <div className="mx-auto w-72 overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-2xl">
      <Image
        src="/lp/demo-store.png"
        alt="ARIGATO TiP デモストア画面のスクリーンショット"
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-wide">
            ARIGATO <span className="text-[var(--color-brand)]">TiP</span>
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
            <p className="text-sm font-semibold text-[var(--color-brand)]">飲食店・バー向け チップ決済サービス</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              スマホをかざすだけで、
              <br />
              &ldquo;感謝&rdquo;をチップに。
            </h1>
            <p className="mt-5 text-base leading-relaxed text-neutral-600">
              インバウンドのお客様はチップの習慣に不慣れでも、スマホでの操作ならすぐに理解できます。ARIGATO
              TiPは、テーブルのQRコードを読み込むだけで、多言語対応のチップ決済ができる飲食店向けのおもてなしツールです。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/s/kokoro"
                className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
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
                    <span className="text-2xl">{p.icon}</span>
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
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
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
                  <span className="text-3xl">{f.icon}</span>
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
                className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
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

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-xs text-neutral-400 sm:flex-row sm:justify-between">
          <span>© 2026 ARIGATO TiP</span>
          <div className="flex gap-4">
            <a href="#how" className="hover:text-neutral-600">
              使い方
            </a>
            <a href="#features" className="hover:text-neutral-600">
              特長
            </a>
            <a href="#faq" className="hover:text-neutral-600">
              よくある質問
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
