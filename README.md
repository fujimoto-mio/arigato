# ARIGATO TiP（アリガトウチップ）

Tipping platform for inbound tourists at Japanese restaurants/bars. Guest scans a table QR code, picks a language, tips a staff member by card, and optionally leaves a review that routes to Google (high ratings) or stays private with the store (low ratings). Store staff get a real-time notification when a tip lands so they can thank the guest before they leave.

Wireframes: [docs/](docs/)

## Tech stack

- **Next.js** (App Router) — customer flow + admin dashboard
- **Supabase** — Postgres, Auth (store admin logins), Realtime (tip notifications), Storage (staff photos/logos)
- **Prisma** — ORM/migrations against Supabase Postgres
- **Stripe** — card payments (Payment Element, PCI-safe hosted fields); Connect if payouts to individual stores are needed
- **next-intl** — ja/en/ko/zh UI strings
- **Vercel** — hosting

## Customer flow (from wireframes)

1. QR scan → language picker (🇯🇵🇺🇸🇰🇷🇨🇳), JA default
2. Store hero (photo + store name + welcome line)
3. Staff picker — horizontal scroll of avatars, tap to select
4. Tip amount grid — ¥1,000 / ¥2,000 / ¥3,000 ("a little thanks"), ¥5,000 ("generous"), ¥10,000 ("very generous"), ¥20,000 ("special")
5. Payment — card brand icons, card number, expiry, CVV, cardholder name, "Pay"
6. Thank-you screen — checkmark, message, 5-star rating, optional comment, "Complete"

Described in text but not drawn in any wireframe:
- Star-rating branch logic (≥3 → redirect to Google review; <3 → store-only private feedback)
- Real-time notification to store admin when a tip lands
- Admin/dashboard screens (none of the 8 wireframes cover this)

## Open decisions (blocking before Phase 2)

1. **Tip amount tiers** — wireframe shows 6 tiers (1,000/2,000/3,000/5,000/10,000/20,000), text description says 4 (1,000/3,000/5,000/10,000). Needs confirming.
2. **Payment/payout model** — does money need to reach each store's own bank account (→ Stripe Connect, Standard or Express), or does the platform collect everything and pay stores out manually for now (→ plain Stripe payments to one account)? Connect scales to multiple stores; plain Stripe ships faster for a single-store pilot.
3. **Translation approach** — wireframe shows exactly 4 fixed languages, which reads as static pre-translated UI strings (next-intl) rather than live machine translation. Live MT only matters if store owners type custom Japanese text (bios, thank-you messages) that needs on-the-fly translation.
4. **Google review linking** — default plan: store a Google Place ID per store, deep-link to `search.google.com/local/writereview?placeid=...` for ratings ≥3. No API needed unless review analytics must be pulled back into the dashboard.

Current assumption (revisit if wrong): single-store-first, static i18n, deep-link reviews.

## Data model (Prisma / Supabase Postgres)

```prisma
model Store {
  id              String   @id @default(cuid())
  slug            String   @unique   // QR target: /s/{slug}
  name            String
  logoUrl         String?
  googlePlaceId   String?
  stripeAccountId String?            // if using Connect
  staff           Staff[]
  tips            Tip[]
  admins          AdminUser[]
}

model Staff {
  id        String  @id @default(cuid())
  storeId   String
  name      String
  photoUrl  String?
  active    Boolean @default(true)
  sortOrder Int     @default(0)
  tips      Tip[]
}

model Tip {
  id                     String   @id @default(cuid())
  storeId                String
  staffId                String
  amount                 Int      // JPY
  locale                 String   // ja/en/ko/zh at time of tip
  status                 String   // pending | succeeded | failed
  stripePaymentIntentId  String?
  createdAt              DateTime @default(now())
  review                 Review?
}

model Review {
  id                 String   @id @default(cuid())
  tipId              String   @unique
  storeId            String
  rating             Int      // 1-5
  comment            String?
  redirectedToGoogle Boolean  @default(false)
  createdAt          DateTime @default(now())
}

model AdminUser {
  id             String @id @default(cuid())
  storeId        String
  supabaseUserId String @unique
  role           String // owner | staff
}
```

## To-do list

Status legend: `[x]` done · `[~]` partial · `[ ]` not started. Last reconciled against `src/` on 2026-07-16.

### Phase 0 — Project setup ✅
- [x] Init Next.js (App Router, TS), connect to Vercel _(Vercel deploy not yet verified)_
- [x] Provision Supabase project, connect Prisma, run first migration for schema above
- [x] Set up next-intl with ja/en/ko/zh message catalogs, language-switcher pill component

### Phase 1 — Customer flow (no payment yet) ✅
- [x] `/s/[slug]` store landing + language selector
- [x] Staff picker component (scrollable avatars, Supabase-fetched)
- [x] Tip amount grid — shipped with **6 tiers** (still needs sign-off vs the 4-tier text, see decisions)
- [x] Session/local state carrying store + staff + amount + locale into checkout

### Phase 2 — Payment 🚧
- [x] Decide Connect vs single-account Stripe — shipped **single-account** (no Connect yet; blocks multi-store)
- [x] Stripe Payment Element integration styled to match wireframe
- [x] Webhook → mark `Tip.status = succeeded` / `failed`
- [ ] **Supabase Realtime channel: broadcast on new succeeded tip** — NOT done. Webhook updates status but broadcasts nothing; `lib/supabase/server.ts` is imported nowhere. Core "notify staff" feature.

### Phase 3 — Review & Google flow 🚧
- [x] Thank-you screen with 5-star input + comment
- [x] Branch: rating ≥3 → Google review deep link; <3 → save Review only
- [ ] **Google Place ID field on Store admin settings** — `Store.googlePlaceId` exists in schema and is used by the redirect, but there is no UI to set it (DB/seed only). Depends on Phase 4 admin.

### Phase 4 — Store admin dashboard ⛔ (none of this exists yet)
- [ ] Supabase Auth login for store owners/staff (`AdminUser` model exists but is unused)
- [ ] Live tip feed (Realtime subscription) — the "notify staff before guest leaves" requirement; pairs with the Phase 2 broadcast
- [ ] Staff roster CRUD (add/edit/reorder/photo upload to Supabase Storage)
- [ ] Reviews view, split public (≥3★, sent to Google) vs private (<3★) feedback
- [ ] Basic tip ledger/totals per staff, per period
- [ ] Store settings screen (name, logo upload, Google Place ID — see Phase 3)

### Phase 5 — Polish & launch ⛔
- [ ] **QR code generation per store** (and optionally per table) — the entry point of the whole flow; nothing exists yet
- [ ] Error/retry states for failed payments (verify `PaymentForm.tsx` handles declines/retries)
- [ ] Confirm real amount tiers + tier labels, translated copy for all 4 languages with a native reviewer per language
- [ ] Deploy, smoke test end-to-end tip → notification → review on a real device

### Cross-cutting / not yet tracked
- [ ] Automated tests (no test setup in the repo)
- [ ] Confirm open decisions below are signed off before further build

## Build status summary (2026-07-16)

- **Customer flow (Phase 0–3): essentially complete** — QR-target landing through payment and review branching all work end-to-end.
- **Two headline gaps remain:** (1) the real-time tip notification is a no-op, and (2) the entire admin dashboard (Phase 4) is unbuilt.
- **Missing front door:** per-store QR generation (Phase 5) has no implementation.
