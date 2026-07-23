# ARIGATO TiP — Implementation TODO

Standalone task list for the 2026-07-23 spec. Full requirements: [REQUIREMENTS.md](REQUIREMENTS.md).
Status: `[ ]` not started · `[~]` partial · `[x]` done. 🔁 = built to the old spec, needs rework.

> **Implemented 2026-07-23** (build + typecheck + lint green; **DB migration applied to Supabase**;
> flow verified end-to-end in the browser): Milestones 1–4 are code-complete and the UI now matches the
> client reference frames — the 6-screen guest flow (story landing → carousel → ¥0/+¥100 counter + card
> checkbox → Stripe Apple/Google Pay/card **or** cash → review with photo → thank you → stay connected),
> gold accent + red "ARIGATO/TIP JAPAN" logo, the tip card, outlined social buttons with real brand
> icons, and the bottom nav. Two-mode checkout on a single Stripe account, schema migration + realtime
> (tip & review events on submit), reworked dashboard/reviews/settings all in.
> **Not yet done:** real-device smoke test, native-speaker copy review, and the open questions below.
> Story-slide content is still generic placeholder copy + stock photos (no per-store story CMS yet).

**Guiding rules**
- Customer flow: story-first, **no login**, **no staff selection**, 6 screens.
- Tip = **¥0-start, +¥100/tap** counter (any amount, ¥0 allowed).
- Payment = guest's **"pay by credit card" checkbox** on the tip page → checked = Stripe (Apple Pay /
  Google Pay / card), unchecked = cash at the register (no in-app charge).
- **Stripe = one whole platform account** for all stores (not per-store, not Connect).
- **4 languages** (ja/en/ko/zh). Notification fires on submit for both payment paths.

---

## Milestone 1 — Customer flow rework (highest priority)

- [ ] 🔁 Remove the staff picker; tips are store-level — `src/app/s/[slug]`, staff components
- [ ] 🔁 Replace the 6-tier amount grid with the **¥0-start +¥100 counter** (+ / – buttons, free amount)
- [ ] Add the **"Pay by credit card" checkbox** on the tip page (drives card vs cash)
- [ ] Screen 1 — repurpose `/s/[slug]` as the **Story landing** (hero, "Discover Our Story" CTA, no login)
- [ ] Screen 2 — **Our Story carousel** (~5 slides, dot pagination, hamburger menu)
- [ ] Screen 4 — **Review**: 5★ + optional comment + optional **photo upload**, "Submit Review"
- [ ] Screen 5 — **Thank You**: "Back to Top", "View Reviews"
- [ ] Screen 6 — **Stay Connected**: Instagram / Facebook / Google follow + bottom nav
      (Home / Our Story / Reviews / Support)

**Done when:** a guest can scan → read the story → set a tip → tick/untick card → review with a photo →
land on Thank You → follow the store, in all 4 languages, with no login anywhere.

## Milestone 2 — Payment (keep Stripe, single account)

- [ ] **Cash path (checkbox off)** — "submit" writes the `Tip` (amount + table + locale, no charge) and
      fires the store notification (settled later at the register)
- [ ] 🔁 **Card path (checkbox on)** — reuse the Payment Element on the **single platform account**;
      add **Apple Pay / Google Pay** via Stripe's Payment Request Button, card as fallback
- [ ] Drop the per-store `Store.stripeAccountId` / Connect assumption (one account for all stores)
- [ ] Error/retry states on card failures (card errors + "Try again") — already built, re-verify in flow

**Done when:** an unchecked tip records with no charge and notifies the store; a checked tip charges via
Apple Pay / Google Pay / card on the one account and records `status = succeeded`.

## Milestone 3 — Data model & notifications

- [ ] Migration: `Tip.staffId` optional/removed; add `Tip.tableLabel`; add `Tip.paymentMethod`
      (`card` | `cash`); keep `status` + `stripePaymentIntentId` (card only); drop `Store.stripeAccountId`;
      add `Store.instagramUrl` / `Store.facebookUrl` (Google Place ID already exists) — migrate, keep history
- [ ] Persist the **table number** from the QR (`?t=`) onto `Tip`
- [ ] 🔁 Fire the **Realtime notification on tip+review submission** (not only on a Stripe `succeeded`
      webhook), so cash tips also notify — `lib/realtime.ts`
- [ ] Guest **review photos** → Supabase Storage → surfaced in the dashboard

## Milestone 4 — Admin dashboard (match the reference mockup)

- [ ] 🔁 Dashboard layout: new tip+review **banner**, detail card
      (table no. / ¥ + ≈USD / rating / review text / photos)
- [ ] **今日のサマリー** — tip count, total tip amount, review count, average rating
- [ ] **Recent tips+reviews list** — datetime, table no., amount (¥ + ≈USD), rating, review snippet
      (¥0 rows valid)
- [ ] **≈USD equivalent** next to ¥ amounts (decide fixed rate vs live FX)
- [ ] Nav sections: Dashboard / Notifications / Tip history / Reviews / Reports / Settings
- [ ] Remove/hide the per-staff tip breakdown (no staff selection anymore)
- [ ] Add **Instagram / Facebook URL** fields to `/admin/settings` (for the Stay Connected buttons)
- [x] Reviews view, settings, QR generation, Supabase Auth login, Google Place ID field (already built)

## Milestone 5 — Launch

- [ ] Deploy to Vercel; smoke-test end-to-end on a real device
      (scan → story → tip → card/cash → review → follow → notification)
- [ ] Automated tests (no test setup in the repo yet)
- [ ] **Harden the Realtime channel** — `store:{storeId}` is a public broadcast topic; move to private
      channels + RLS before multi-store launch
- [ ] Native-speaker copy review for all 4 languages

---

## Kept as-is (confirmed still in scope)

- [x] next-intl **ja/en/ko/zh** (4-language support confirmed)
- [x] Rating ≥3 → Google review deep link; <3 → private Review (reviews link to the store's Google)
- [x] Supabase project, Prisma, Vercel wiring, first migration

## Open questions — confirm with the client before building

- [ ] **"→ Kitchen team"** in the Apple-Pay reference image — team-level tip destinations, or keep it
      store-level (current confirmed spec)?
- [ ] **"Secure payment" label** on the tip page when the card checkbox is off (nothing charged) — keep
      or hide?
- [ ] **USD conversion** — fixed rate or live FX? (mockup shows ¥2,000 ≈ $13.50, ~150 JPY/USD)
