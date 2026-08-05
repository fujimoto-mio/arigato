import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { resolveAppOrigin } from "@/lib/origin";
import { prisma } from "@/lib/prisma";
import { nameToSlug } from "@/lib/slug";
import { stripe } from "@/lib/stripe";
import { isSubscriptionLive, PLAN } from "@/lib/subscription";

const emptyToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  companyName: emptyToNull(120),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  // Consent — all three required (same as the old registration).
  termsAgreed: z.literal(true),
  billingAgreed: z.literal(true),
  cancellationAgreed: z.literal(true),
});

const CONSENT_FIELDS = ["termsAgreed", "billingAgreed", "cancellationAgreed"];

async function makeUniqueSlug(name: string): Promise<string> {
  const root = (nameToSlug(name) || "store").slice(0, 40);
  let candidate = root;
  while (await prisma.store.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${randomBytes(3).toString("hex")}`.slice(0, 50);
  }
  return candidate;
}

/**
 * Public subscription sign-up (the link inside the Google Form). Runs BEFORE any
 * login account exists: it creates a `pending` store bound to a Stripe
 * subscription (metadata.storeId), then hands off to Stripe Checkout. The webhook
 * flips the store's subscriptionStatus; the platform admin later cross-references
 * the Google Form, issues the login + QR, and activates the store.
 */
export async function POST(request: Request) {
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (!priceId) return NextResponse.json({ error: "price_not_configured" }, { status: 500 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const isConsent = parsed.error.issues.some((issue) => CONSENT_FIELDS.includes(String(issue.path[0])));
    return NextResponse.json({ error: isConsent ? "consent_required" : "invalid_request" }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  // If this email already has a live subscription, don't start a second one.
  const existingLive = await prisma.store.findFirst({
    where: { email, deletedAt: null, subscriptionStatus: { in: ["trialing", "active", "past_due"] } },
    select: { id: true, subscriptionStatus: true },
  });
  if (existingLive && isSubscriptionLive(existingLive.subscriptionStatus)) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  // Reuse an earlier not-yet-paid pending store for this email (re-submit / abandoned
  // checkout) instead of piling up duplicates; otherwise create a fresh one.
  let store = await prisma.store.findFirst({
    where: { email, deletedAt: null, status: "pending", subscriptionStatus: "none" },
    orderBy: { createdAt: "desc" },
  });
  if (store) {
    store = await prisma.store.update({
      where: { id: store.id },
      data: { name: data.name, companyName: data.companyName, phone: data.phone, termsAgreedAt: new Date() },
    });
  } else {
    store = await prisma.store.create({
      data: {
        name: data.name,
        slug: await makeUniqueSlug(data.name),
        status: "pending",
        companyName: data.companyName,
        phone: data.phone,
        email,
        termsAgreedAt: new Date(),
      },
    });
  }

  // One Stripe customer per store (keyed by store id), reused across attempts.
  let customerId = store.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: data.name,
      metadata: { storeId: store.id },
    });
    customerId = customer.id;
    await prisma.store.update({ where: { id: store.id }, data: { stripeCustomerId: customerId } });
  }

  const origin = await resolveAppOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: PLAN.trialDays,
      metadata: { storeId: store.id },
    },
    client_reference_id: store.id,
    metadata: { storeId: store.id },
    // Our account enables Managed Payments by default, which requires a product
    // tax_code. We handle tax manually (税抜), so opt this session out.
    managed_payments: { enabled: false },
    success_url: `${origin}/subscribe?status=success`,
    cancel_url: `${origin}/subscribe?status=cancel`,
  } as Stripe.Checkout.SessionCreateParams);

  if (!session.url) return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  return NextResponse.json({ url: session.url });
}
