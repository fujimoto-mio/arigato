# ARIGATO TiP（アリガトウチップ）

Story-first "thank you" platform for Japanese restaurants/bars. A guest scans a table QR code — no app, no login — reads the restaurant's story, optionally leaves a **tip**, optionally leaves a **review** (rating + comment + photos, linked to the store's Google), and can **follow** the store on social media. The store gets a **real-time notification** and an admin dashboard that aggregates tip amounts and reviews.

> ⚠️ **Spec revised (2026-07-23).** New confirmed direction: **story-first flow, no staff selection,
> no customer login, ¥0-start +¥100 tip counter, 4 languages (ja/en/ko/zh).** On the tip page the
> **guest ticks a "pay by credit card" checkbox**: checked → **Stripe online payment (Apple Pay /
> Google Pay / card)**; unchecked → **cash at the register**. Stripe uses a **single platform account
> for all stores** (not per-store, not Connect), so the existing Stripe integration stays (gated on the
> checkbox, not removed). The code below still reflects the previous "tip a staff member by card" MVP
> and is being reworked. Authoritative spec: **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)**.

Reference images (client, 2026-07-22 → 2026-07-23): 6-screen `ARIGATO TiP – User Flow`, QR table-stand mockup, Apple-Pay tip screen, and the admin-dashboard mockup, in Slack ([1](https://level-frontier-hq.slack.com/archives/C0BD3UQ138C/p1784702079661999), [2](https://level-frontier-hq.slack.com/archives/C0BJS2090ET/p1784778736422269)). Earlier wireframes: [docs/](docs/)

## Tech stack

- **Next.js** (App Router) — customer flow + admin dashboard
- **Supabase** — Postgres, Auth (store admin logins), Realtime (tip notifications), Storage (staff photos/logos)
- **Prisma** — ORM/migrations against Supabase Postgres
- **Stripe** — card payments (Payment Element, PCI-safe hosted fields); Connect if payouts to individual stores are needed
- **next-intl** — ja/en/ko/zh UI strings
- **Vercel** — hosting

## Customer flow (target — 2026-07-22 reference frames)

6 screens, to be built to match the reference frames. Full detail in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

1. **Landing / QR target** — hero photo, "DISCOVER THE STORY BEHIND OUR RESTAURANT", **Discover Our Story** CTA. No login.
2. **Our Story** — image + text carousel (~5 slides, dot pagination).
3. **Support Us (Tip)** — amount display **starting at ¥0**, **+¥100** button adds ¥100/tap, **–** to decrease, any amount from ¥0, a **"pay by credit card" checkbox**, **Next**. Checked → Stripe (Apple Pay / Google Pay / card); unchecked → cash at the register (amount recorded, no charge).
4. **Review (optional)** — 5-star rating, free-text (optional), add photo (optional), **Submit Review**. Linked to the store's Google.
5. **Thank You** — heart, thank-you message, **Back to Top**, **View Reviews**.
6. **Stay Connected** — follow on **Instagram / Facebook / Google**, restaurant photos, bottom nav (Home / Our Story / Reviews / Support).

## Confirmed decisions (client + 藤本, 2026-07-22 → 07-23)

- **4-language support** (ja/en/ko/zh) — confirmed in scope.
- **Payment: guest chooses via a "pay by credit card" checkbox** on the tip page — checked → Stripe (Apple Pay / Google Pay / card); unchecked → cash at the register (レジ打ち, no in-app charge). **Stripe = one whole platform account for all stores** (not per-store, not Connect).
- **No staff/member selection** — the tip is for the store as a whole.
- **No customer login** — the QR opens the story page directly.
- **Tip amount** = ¥0-start +¥100 counter (¥0 allowed); **table number** tracked per tip (from the QR).
- **Real-time / push notification** to the store on each new tip+review.
- **Reviews** = rating + comment + photos, linked to the store's Google. Dashboard shows ¥ + ≈USD.
- **Stay Connected** buttons need per-store Instagram/Facebook URLs + Google Place ID on admin settings.

Still open (see requirements doc): whether "→ Kitchen team" in the Apple-Pay reference means team-level tip destinations (current spec is store-level); Stripe mode global vs per-store; keep the "Secure payment" label in cashless mode; USD fixed rate vs live FX.

## Data model (Prisma / Supabase Postgres)

See [prisma/schema.prisma](prisma/schema.prisma) for the source of truth. Shape after the 2026-07-23 pivot:

```prisma
model Store {
  id            String   @id @default(cuid())
  slug          String   @unique   // QR target: /s/{slug}?t={table}
  name          String
  logoUrl       String?
  googlePlaceId String?             // Google review deep-link + "Follow on Google"
  instagramUrl  String?             // Stay Connected buttons
  facebookUrl   String?
  staff         Staff[]
  tips          Tip[]
  admins        AdminUser[]
}

// Staff is retained for the admin roster/history but no longer part of the tip flow.
model Staff { /* id, storeId, name, photoUrl, active, sortOrder */ }

model Tip {
  id                    String        @id @default(cuid())
  storeId               String
  staffId               String?       // optional — tips are store-level now
  amount                Int           // JPY (0 allowed for review-only cash visits)
  locale                String        // ja/en/ko/zh at time of tip
  tableLabel            String?       // from the QR ?t= param
  paymentMethod         PaymentMethod // cash | card
  status                TipStatus     // pending | succeeded | failed (cash → succeeded at creation)
  stripePaymentIntentId String?       @unique  // card only
  createdAt             DateTime      @default(now())
  review                Review?
}

model Review {
  id                 String   @id @default(cuid())
  tipId              String   @unique
  storeId            String
  rating             Int      // 1-5
  comment            String?
  photoUrls          String[] @default([])   // guest-uploaded, shown in the dashboard
  redirectedToGoogle Boolean  @default(false)
  createdAt          DateTime @default(now())
}
// AdminUser unchanged: id, storeId, supabaseUserId, email, role.
```

## To-do list

The full, prioritized implementation checklist lives in **[docs/TODO.md](docs/TODO.md)** (single source
of truth). Milestones:

1. **Customer flow rework** — story landing, Our Story carousel, ¥0/+¥100 counter + card checkbox, review with photo, Thank You, Stay Connected. _(highest priority)_
2. **Payment** — cash path (no charge, notify register) + card path (Stripe Apple Pay / Google Pay / card on one platform account).
3. **Data & notifications** — schema migration (`tableLabel`, `paymentMethod`, drop `stripeAccountId`), QR table number, notify on submit, review photos.
4. **Admin dashboard** — match the reference mockup (banner, detail card, today's summary, recent list, ≈USD, nav sections).
5. **Launch** — Vercel deploy + real-device smoke test, tests, harden the Realtime channel, native-speaker copy review.

Confirmed still in scope: 4 languages (ja/en/ko/zh), Google-linked reviews, existing Supabase/Prisma/Vercel wiring. Open questions to confirm with the client are tracked in both docs ("Kitchen team" team-tips?, "Secure payment" label when card off, USD rate).

## Admin dashboard

Provision the first store admin (creates the Supabase Auth user and links it to a store):

```bash
npm run db:seed                                        # creates the "kokoro" store
npm run admin:create -- owner@example.com "s3cret" kokoro
```

Then sign in at `/admin/login`. Routes:

| Route | Purpose |
| --- | --- |
| `/admin` | Live tip feed (Realtime) + today's totals + per-staff breakdown |
| `/admin/staff` | Roster: add, rename, reorder, photo upload, hide |
| `/admin/reviews` | Private (<3★) and public (≥3★) feedback |
| `/admin/settings` | Store name, logo, Google Place ID, table QR codes |

Staff are **deactivated, never deleted** — `Tip.staff` cascades on delete, so a hard delete would erase that person's tip history.

## Deploying to Vercel

`prisma generate` runs via `postinstall` — without it the build fails with
`Module '"@prisma/client"' has no exported member 'PrismaClient'`, because a fresh
`npm install` never generates the client.

The build itself needs **no environment variables**: the Prisma, Stripe and Supabase
clients are all constructed lazily, so a missing value fails at request time with a
clear message instead of breaking the build. Set these in Vercel for the app to run:

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` | all database access (pooled connection) |
| `DIRECT_URL` | `prisma migrate` only — not required to build |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | admin auth, Realtime subscribe |
| `SUPABASE_SERVICE_ROLE_KEY` | storage uploads, tip broadcast |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | payments |
| `STRIPE_WEBHOOK_SECRET` | webhook signature verification |
| `NEXT_PUBLIC_APP_URL` | QR code targets — set to the public domain, or printed codes point at the wrong host |

## Build status summary

**Old-spec MVP (2026-07-21):** guest flow (QR → staff → amount → Stripe payment → review branch) and the
full store dashboard were implemented and verified against live infrastructure (build + lint clean; admin
auth guards; Realtime broadcast 202; QR PNG valid). A real card payment through to a live notification and a
real-device smoke test were never verified end-to-end.

**New spec (2026-07-23):** story-first flow, no staff selection, no login, ¥0/+¥100 counter, 4 languages
(see the banner up top and [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)). On the tip page the **guest ticks a "pay
by credit card" checkbox** — checked → **Stripe (Apple Pay / Google Pay / card)** on a single platform
account, unchecked → **cash at the register** — so Stripe and the Realtime notification stay (gated on
the checkbox / fired on submit).
Reworks: staff picker and tier grid come out; Our Story + Stay Connected screens, the ¥0/+¥100 counter,
table-number tracking, review photos, and the reference-matching dashboard go in. Track progress in the
[to-do list](#to-do-list).

**Implemented 2026-07-23 (build + typecheck + lint green):** the rework is code-complete. The guest flow
is now the 6-screen story-first journey (single `/s/[slug]` client); the staff picker, tier grid, and the
separate `/checkout` + `/thank-you` routes are removed; Stripe is gated behind the guest's card checkbox on
one platform account, with cash tips recorded and notified on submit. **Still pending:** run the DB
migration against Supabase (`prisma migrate deploy`, needs `DIRECT_URL`; SQL under
`prisma/migrations/20260723000000_arigato_tip_pivot`), a real-device smoke test, and the open questions in
[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).
