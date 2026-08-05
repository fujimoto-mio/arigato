import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { toSubscriptionStatus } from "../src/lib/subscription";

// One-off reconcile: pull each store's latest Stripe subscription and write its
// status back — recovers stores whose webhook was missed. Safe to re-run.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, options: "-c timezone=Asia/Tokyo" }),
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

async function main() {
  const stores = await prisma.store.findMany({
    where: { deletedAt: null, stripeCustomerId: { not: null } },
    select: { id: true, name: true, stripeCustomerId: true },
  });

  for (const store of stores) {
    const subs = await stripe.subscriptions.list({ customer: store.stripeCustomerId as string, status: "all", limit: 1 });
    const sub = subs.data[0];
    if (!sub) {
      console.log(`skip  ${store.name} (no subscription in Stripe)`);
      continue;
    }
    const raw = sub as unknown as { current_period_end?: number; trial_end?: number };
    const periodEnd = raw.current_period_end ?? raw.trial_end ?? null;
    await prisma.store.update({
      where: { id: store.id },
      data: {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: toSubscriptionStatus(sub.status),
        subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
    console.log(`sync  ${store.name} → ${toSubscriptionStatus(sub.status)} (${sub.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
