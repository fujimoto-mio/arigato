# ARIGATO TiP — Requirements

_Last updated: 2026-07-23 (rev. 2). Supersedes the earlier "tip a staff member by card" concept
and rev. 1's "no payment at all" reading._

**Sources of truth (Slack, client + LF_藤本):**
- `#proj-jobswipe-外部パートナー` — 山本類, 2026-07-22, [User Flow frames + Q&A](https://level-frontier-hq.slack.com/archives/C0BD3UQ138C/p1784702079661999)
- `#proj-arigato-tip-外部パートナー` — 2026-07-23:
  [dev questions → 藤本 answers](https://level-frontier-hq.slack.com/archives/C0BJS2090ET/p1784778736422269) ·
  [Apple Pay / Google Pay + Stripe](https://level-frontier-hq.slack.com/archives/C0BJS2090ET/p1784783547500689) ·
  admin-dashboard reference image.

Reference images: `ARIGATO TiP – User Flow` (6 phone screens), QR table-stand mockup, an
Apple-Pay tip screen, and the store **admin dashboard** mockup.

## Concept

A restaurant places an acrylic QR stand on the table. A guest scans it — **no app, no login** —
and lands on a story-first web page. They read the restaurant's story, optionally leave a **tip**,
optionally leave a **review** (rating + comment + photos, linked to the store's Google), and can
**follow** the store on social media. The store gets a **real-time notification** and an admin
dashboard that aggregates tip amounts and reviews.

## Payment model — guest chooses on the tip page

The tip amount is chosen with a **¥0-start, +¥100-per-tap counter** (any amount from ¥0). On that same
tip-amount page there is a **"Pay by credit card" checkbox** that the **guest** toggles:

- **Checkbox checked → online payment via Stripe.** The guest pays the tip immediately by
  **Apple Pay / Google Pay / card**. The client asked specifically for Apple Pay / Google Pay; 霜沢
  confirmed **Stripe** is the best rail and enables all three (Payment Request Button for the wallets +
  card fallback).
- **Checkbox unchecked → manual / cash.** No in-app charge — the tip amount + review are **recorded and
  the register (レジ) / store is notified**, and the guest pays cash at the register with the bill
  (レジ打ちで精算). 藤本: 「チップは Cashless です。レジに通知してレジ打ちで精算します」.

**Stripe uses a single, whole platform account for all stores — NOT per-store and NOT Connect.**
There is no per-store payment setting; the choice is per-guest via the checkbox. Both paths converge on
the same records (Tip + Review), notification, and dashboard aggregation.

## Confirmed scope decisions

| # | Decision | Source |
| --- | --- | --- |
| 1 | **4-language support** (ja/en/ko/zh) — not English-only. | 藤本 2026-07-23: 「４カ国対応で」 |
| 2 | **Payment: guest ticks a "pay by credit card" checkbox on the tip page.** Checked → Stripe online (Apple/Google Pay + card); unchecked → cash at the register. **Stripe = one whole platform account, not per-store.** | 藤本 2026-07-23 + user 2026-07-23 |
| 3 | **No staff / member selection** — the tip is for the store as a whole. | 山本 2026-07-22: 「スタッフ選択は無しで」 |
| 4 | **No customer login** — the QR opens the story page directly. | 山本 2026-07-22 |
| 5 | **Tip amount = ¥0-start, +¥100 counter** (any amount, ¥0 allowed). | User Flow frames |
| 6 | **Reviews** = rating + comment + photos; **linked to the store's Google**. | 山本 2026-07-22 |
| 7 | **Table number** tracked per tip (from the QR) and shown in the dashboard. | admin reference image |
| 8 | **Real-time / push notification** to the store on each new tip+review. | admin reference image |
| 9 | **Admin dashboard** aggregates tip amounts + reviews. | 藤本 2026-07-23; admin image |
| 10 | **Stay Connected**: follow the store on Instagram / Facebook / Google. | 山本 2026-07-22 |
| 11 | Amounts shown with a **≈ USD equivalent** in the dashboard. | admin reference image |

## Customer screen flow (6 screens — matches the User Flow frames)

1. **Landing / QR target** — hero photo, `ARIGATO TiP`, "DISCOVER THE STORY BEHIND OUR RESTAURANT.
   TAKE A LOOK!", **Discover Our Story** CTA, "Powered by ARIGATO TiP". No login. Language selectable
   (4 languages).
2. **Our Story** — image + text carousel (~5 slides, dot pagination), hamburger menu.
3. **Support Us (Tip)** — "SUPPORT US", tip amount **starting at ¥0**, **+¥100** adds ¥100/tap, **–**
   to decrease, free amount, plus a **"Pay by credit card" checkbox**, **Next**. Unchecked → tip is
   recorded and paid in cash at the register (no card fields). Checked → the Next/pay step offers
   Apple Pay / Google Pay / card via Stripe.
4. **Review (optional)** — 5-star rating, "Share your thoughts (Optional)", "Add a photo (Optional)",
   **Submit Review**. Linked to the store's Google.
5. **Thank You** — heart, "THANK YOU!…", **Back to Top**, **View Reviews**.
6. **Stay Connected** — follow on **Instagram / Facebook / Google**, restaurant photos, bottom nav
   (Home / Our Story / Reviews / Support).

## Admin dashboard (from the reference image)

Left nav: **ダッシュボード / 通知 (badge count) / チップ履歴 / 口コミ一覧 / レポート / 設定**.
Brand "ARIGATO TiP JAPAN".

- **New tip+review banner** — highlights the latest arrival with received datetime, plus a matching
  **push notification** to the owner's phone (lock-screen style in the mockup).
- **Detail card** — table number, tip amount (¥ + ≈USD), star rating, short review, full review text
  (English original kept as-is), and **posted photos** (clickable to enlarge).
- **本日のサマリー (Today's summary)** — tip count, total tip amount, review count, average rating.
- **最近のチップ・口コミ一覧 (Recent list)** — datetime, table number, amount (¥ + ≈USD), rating,
  review snippet. ¥0 rows (review-only) are valid.

## Impact on the current build

The shipped MVP was built to the original "tip a staff member by card" spec. Net changes:

- **Remove** the staff picker and all per-staff selection (tip is store-level) — screens + `Staff` usage.
- **Replace** the 6-tier amount grid with the ¥0-start **+¥100 counter**.
- **Keep Stripe** but gate it behind the guest's **"pay by credit card" checkbox** (not a per-store
  setting). Add Apple Pay / Google Pay via Stripe's Payment Request Button; keep card as fallback. Use
  the **single existing platform account** — no per-store account, no Connect. Unchecked → "submit"
  records the `Tip` with no charge (cash at register).
- **Keep the Realtime notification**, but fire it on tip+review submission (not only on a Stripe
  `succeeded` webhook), so cash tips also notify the register/dashboard.
- **Keep i18n** (ja/en/ko/zh).
- **Add** the Our Story carousel and Stay Connected screens.
- **Add** table-number capture (QR `?t=`) persisted on `Tip`, and a ¥→USD display in the dashboard.
- **Add** photo upload on reviews (guest side) shown in the dashboard.
- **Data model** — `Tip.staffId` becomes optional/removed; add `Tip.tableLabel`; add
  `Tip.paymentMethod` (`card` | `cash`); keep `status` + `stripePaymentIntentId` (set only when paid by
  card, null for cash). Drop the unused per-store `stripeAccountId` (single account). Add
  Instagram/Facebook URLs on `Store`. Migrate, don't drop history.

## Open questions

- **"→ Kitchen team"** appears in the Apple-Pay reference image — that image is a third-party example
  the client sent to illustrate the *payment method*, but it implies a team/group tip destination.
  Confirmed spec is **store-level, no selection** (decision #3); confirm whether team destinations are
  wanted before building any selector.
- **"Secure payment" label** on screen 3 when the card checkbox is unchecked (nothing charged) — keep
  the copy or only show it when the checkbox is on?
- **USD conversion** — fixed rate, or live FX? The mockup shows "約 $13.50" for ¥2,000 (~150 JPY/USD).
