import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { broadcastReview } from "@/lib/realtime";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({
  tipId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).max(6).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { tipId, rating, comment, photoUrls } = parsed.data;

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

  // Card tips must have actually succeeded before we accept a review. The webhook
  // may not have landed yet, so self-heal by checking Stripe directly. Cash tips
  // are recorded as succeeded at creation and skip this entirely.
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

  const redirectedToGoogle = rating >= 3 && Boolean(tip.store.googlePlaceId);

  const review = await prisma.review.create({
    data: {
      tipId: tip.id,
      storeId: tip.storeId,
      rating,
      comment,
      photoUrls: photoUrls ?? [],
      redirectedToGoogle,
    },
  });

  void broadcastReview(tip.storeId, {
    tipId: tip.id,
    rating: review.rating,
    comment: review.comment,
    photoUrls: review.photoUrls,
    createdAt: review.createdAt.toISOString(),
  });

  return NextResponse.json({
    redirectUrl: redirectedToGoogle
      ? `https://search.google.com/local/writereview?placeid=${tip.store.googlePlaceId}`
      : null,
  });
}
