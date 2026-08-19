import { NextResponse } from "next/server";
import { z } from "zod";
import { drawOmikuji, fortuneIndex, isOmikujiEligible, isOmikujiTier } from "@/lib/omikuji";
import { FORTUNES } from "@/lib/omikuji-fortunes";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// The variation is derived from the tip id (stable), so both the fresh draw and
// a re-fetch return the same fortune without persisting an extra column.
function fortuneFor(tipId: string, result: string): number {
  return isOmikujiTier(result) ? fortuneIndex(tipId, FORTUNES[result].length) : 0;
}

const bodySchema = z.object({ tipId: z.string().min(1) });

// One omikuji draw per qualifying tip. The result is decided here and persisted
// once — never re-rolled — so a guest can't refresh their way to 大吉, and the
// store can verify a winner from the recorded result.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { tipId } = parsed.data;

  const tip = await prisma.tip.findUnique({ where: { id: tipId } });
  if (!tip) {
    return NextResponse.json({ error: "tip_not_found" }, { status: 404 });
  }
  if (!isOmikujiEligible(tip.amount)) {
    return NextResponse.json({ error: "not_eligible" }, { status: 400 });
  }
  // Already drawn — return the recorded result (idempotent).
  if (tip.omikujiResult) {
    return NextResponse.json({ result: tip.omikujiResult, fortune: fortuneFor(tip.id, tip.omikujiResult) });
  }

  // Card tips must have actually succeeded. The webhook may lag, so self-heal by
  // checking Stripe directly (same pattern as /api/reviews). Cash is succeeded
  // at creation and skips this.
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

  const result = drawOmikuji();
  // Guard on omikujiResult null so two concurrent requests can't both write —
  // the loser reads back the winner's result below.
  await prisma.tip.updateMany({
    where: { id: tip.id, omikujiResult: null },
    data: { omikujiResult: result },
  });
  const saved = await prisma.tip.findUnique({
    where: { id: tip.id },
    select: { omikujiResult: true },
  });

  const finalResult = saved?.omikujiResult ?? result;
  return NextResponse.json({ result: finalResult, fortune: fortuneFor(tip.id, finalResult) });
}
