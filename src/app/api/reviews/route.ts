import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({
  tipId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { tipId, rating, comment } = parsed.data;

  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: { store: true, review: true },
  });

  if (!tip) {
    return NextResponse.json({ error: "tip_not_found" }, { status: 404 });
  }

  if (tip.review) {
    return NextResponse.json({ error: "review_already_submitted" }, { status: 409 });
  }

  let status = tip.status;
  if (status !== "succeeded" && tip.stripePaymentIntentId) {
    // The webhook may not have landed yet — self-heal by checking Stripe directly.
    const paymentIntent = await stripe.paymentIntents.retrieve(tip.stripePaymentIntentId);
    if (paymentIntent.status === "succeeded") {
      await prisma.tip.update({ where: { id: tip.id }, data: { status: "succeeded" } });
      status = "succeeded";
    }
  }

  if (status !== "succeeded") {
    return NextResponse.json({ error: "payment_not_completed" }, { status: 400 });
  }

  const redirectedToGoogle = rating >= 3 && Boolean(tip.store.googlePlaceId);

  await prisma.review.create({
    data: {
      tipId: tip.id,
      storeId: tip.storeId,
      rating,
      comment,
      redirectedToGoogle,
    },
  });

  return NextResponse.json({
    redirectUrl: redirectedToGoogle
      ? `https://search.google.com/local/writereview?placeid=${tip.store.googlePlaceId}`
      : null,
  });
}
