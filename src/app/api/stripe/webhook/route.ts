import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { toSubscriptionStatus } from "@/lib/subscription";

// One or more signing secrets (comma/space separated). Supporting several lets a
// `stripe listen` session and a Dashboard endpoint deliver to the same app at
// once — each event carries a signature for only one secret, so we try each.
const webhookSecrets = (process.env.STRIPE_WEBHOOK_SECRET ?? "")
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Mirror a Stripe subscription onto its store. The store id travels on the
 * subscription's metadata (set at checkout); we fall back to matching by the
 * stored subscription id. Idempotent — safe to run on every related event.
 */
async function syncSubscriptionToStore(subscription: Stripe.Subscription) {
  const storeId = subscription.metadata?.storeId;
  const store = storeId
    ? await prisma.store.findUnique({ where: { id: storeId } })
    : await prisma.store.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!store) return;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // current_period_end is a unix-seconds timestamp; store the real instant.
  const periodEndSeconds = (subscription as unknown as { current_period_end?: number }).current_period_end;

  await prisma.store.update({
    where: { id: store.id },
    data: {
      subscriptionStatus: toSubscriptionStatus(subscription.status),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      subscriptionCurrentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
    },
  });
}

export async function POST(request: Request) {
  if (webhookSecrets.length === 0) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  // Verify against each configured secret; the event is valid if any matches.
  let event: Stripe.Event | null = null;
  let lastError: unknown = null;
  if (signature) {
    for (const secret of webhookSecrets) {
      try {
        event = stripe.webhooks.constructEvent(payload, signature, secret);
        break;
      } catch (error) {
        lastError = error;
      }
    }
  }
  if (!event) {
    console.error("Stripe webhook signature verification failed", lastError);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Scoped to tips not already succeeded so a Stripe retry is idempotent.
      await prisma.tip.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id, status: { not: "succeeded" } },
        data: { status: "succeeded" },
      });

      // The admin is notified once after the review (see /api/reviews), so
      // nothing is broadcast/pushed here.
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.tip.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "failed" },
      });
      break;
    }
    // Store subscription lifecycle → mirror status onto the store. created/updated
    // covers trial start, activation, past_due; deleted covers cancellation.
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscriptionToStore(event.data.object as Stripe.Subscription);
      break;
    }
    // Fallback when the operator completes Checkout — fetch the subscription and
    // sync, in case the subscription.* event lands out of order.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToStore(subscription);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
