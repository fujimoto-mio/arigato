-- Help / FAQ managed by the platform admin.
CREATE TABLE "Faq" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- Seed the initial FAQ content.
INSERT INTO "Faq" ("id","category","question","answer","sortOrder") VALUES
 (gen_random_uuid()::text, 'チップ・口コミ', 'お客様はどうやってチップを送りますか？', '店舗のQRコードを読み取ると、お客様のチップ画面が開きます。金額を選び、カード（Apple Pay / Google Pay 対応）またはレジでの現金からお支払いいただけます。', 10),
 (gen_random_uuid()::text, 'チップ・口コミ', 'チップや口コミが届くと通知はありますか？', '新しいチップ・口コミが届くと、管理画面に通知が表示されます。通知をオンにすると、端末へのプッシュ通知も受け取れます。', 20),
 (gen_random_uuid()::text, '売上・振込', '振込はいつ行われますか？', '振込予定については運営からご案内します。ご不明な点は「運営へのお問い合わせ」からご連絡ください。', 30),
 (gen_random_uuid()::text, 'QRコード・店舗情報', 'QRコードはどこで取得できますか？', '「店舗設定」ページで店舗のQRコードを表示・ダウンロードできます。印刷して店内に設置してください。', 40),
 (gen_random_uuid()::text, 'QRコード・店舗情報', '店舗情報やストーリーは編集できますか？', '「店舗設定」から、店舗名・紹介画像・Our Story・SNSリンクなどを編集できます。', 50),
 (gen_random_uuid()::text, 'アカウント', 'パスワードを変更したい', '運営へのお問い合わせからご連絡ください。折り返しご案内します。', 60);
