import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin/auth";
import { resolveAppOrigin } from "@/lib/origin";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isSubscriptionLive, PLAN } from "@/lib/subscription";

// Consent must be re-affirmed on the subscription page (利用規約 / 自動課金 / 解約).
const schema = z.object({
  termsAgreed: z.literal(true),
  billingAgreed: z.literal(true),
  cancellationAgreed: z.literal(true),
});

/**
 * Start a Stripe Checkout subscription for the signed-in store operator's store.
 * The subscription binds directly to the store (client_reference_id + metadata),
 * so there is no manual matching against the Google Form. The webhook flips the
 * store's subscriptionStatus once payment/trial starts.
 */
export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Only a store operator (scoped to one store) subscribes; the platform admin has
  // no store of their own to subscribe.
  if (!ctx.storeId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (!priceId) return NextResponse.json({ error: "price_not_configured" }, { status: 500 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "consent_required" }, { status: 400 });

  const store = await prisma.store.findUnique({ where: { id: ctx.storeId } });
  if (!store || store.deletedAt) return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  if (isSubscriptionLive(store.subscriptionStatus)) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  // Reuse the store's Stripe customer if it already has one (e.g. a previous
  // canceled subscription); otherwise create one keyed to the store.
  let customerId = store.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email ?? store.email ?? undefined,
      name: store.name,
      metadata: { storeId: store.id },
    });
    customerId = customer.id;
    await prisma.store.update({ where: { id: store.id }, data: { stripeCustomerId: customerId } });
  }

  // Record consent at subscribe time (this is where the 利用規約 is agreed now).
  await prisma.store.update({ where: { id: store.id }, data: { termsAgreedAt: new Date() } });

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
    success_url: `${origin}/admin/subscription?status=success`,
    cancel_url: `${origin}/admin/subscription?status=cancel`,
  } as Stripe.Checkout.SessionCreateParams);

  if (!session.url) return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  return NextResponse.json({ url: session.url });
}
