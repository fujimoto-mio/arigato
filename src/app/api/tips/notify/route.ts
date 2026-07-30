import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendStorePush } from "@/lib/push";
import { broadcastTip } from "@/lib/realtime";
import { stripe } from "@/lib/stripe";
import type { Locale } from "@/i18n/messages";

const bodySchema = z.object({ tipId: z.string().min(1) });

/**
 * Notify the admin / register of a tip that has no review. The review route
 * handles the combined tip+review notification; this covers the case where the
 * guest tipped but skipped the rating, so the register still hears about it.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const tip = await prisma.tip.findUnique({
    where: { id: parsed.data.tipId },
    include: { store: true, review: true },
  });
  if (!tip) {
    return NextResponse.json({ error: "tip_not_found" }, { status: 404 });
  }
  // A reviewed tip is (or will be) notified by the reviews route — don't double up.
  if (tip.review) {
    return NextResponse.json({ ok: true, skipped: "reviewed" });
  }

  // Card tips must have actually succeeded before we announce them. The webhook
  // may lag, so self-heal by checking Stripe. Cash tips are succeeded already.
  let status = tip.status;
  if (status !== "succeeded" && tip.stripePaymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(tip.stripePaymentIntentId);
    if (paymentIntent.status === "succeeded") {
      await prisma.tip.update({ where: { id: tip.id }, data: { status: "succeeded" } });
      status = "succeeded";
    }
  }
  if (status !== "succeeded") {
    return NextResponse.json({ error: "payment_not_completed" }, { status: 400 });
  }

  const amountLabel = `$${(tip.amount / 100).toLocaleString("en-US")}`;

  await Promise.all([
    broadcastTip(tip.storeId, {
      tipId: tip.id,
      amount: tip.amount,
      locale: tip.locale as Locale,
      tableLabel: tip.tableLabel,
      paymentMethod: tip.paymentMethod,
      createdAt: tip.createdAt.toISOString(),
    }),
    sendStorePush({
      title: `${tip.store.name}｜新しいチップが届きました`,
      body: amountLabel,
      tag: `tip-${tip.id}`,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
