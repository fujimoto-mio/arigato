import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALES } from "@/i18n/messages";
import { prisma } from "@/lib/prisma";
import { broadcastTip } from "@/lib/realtime";
import { stripe } from "@/lib/stripe";
import { CARD_MIN_AMOUNT, isValidTipAmount } from "@/lib/tip";

const bodySchema = z.object({
  slug: z.string().min(1),
  amount: z.number().int().refine(isValidTipAmount, "invalid_amount"),
  locale: z.enum(LOCALES),
  tableLabel: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["cash", "card"]),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { slug, amount, locale, tableLabel, paymentMethod } = parsed.data;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  // Cash: nothing is charged — record the tip and notify the register so it can
  // be settled at checkout. Zero-yen (review-only) is allowed here.
  if (paymentMethod === "cash") {
    const tip = await prisma.tip.create({
      data: {
        storeId: store.id,
        amount,
        locale,
        tableLabel: tableLabel || null,
        paymentMethod: "cash",
        status: "succeeded",
      },
    });

    void broadcastTip(store.id, {
      tipId: tip.id,
      amount: tip.amount,
      locale: tip.locale,
      tableLabel: tip.tableLabel,
      paymentMethod: "cash",
      createdAt: tip.createdAt.toISOString(),
    });

    return NextResponse.json({ tipId: tip.id, mode: "cash" });
  }

  // Card: Stripe can't charge ¥0, so a card tip needs a real amount.
  if (amount < CARD_MIN_AMOUNT) {
    return NextResponse.json({ error: "amount_too_low_for_card" }, { status: 400 });
  }

  const tip = await prisma.tip.create({
    data: {
      storeId: store.id,
      amount,
      locale,
      tableLabel: tableLabel || null,
      paymentMethod: "card",
      status: "pending",
    },
  });

  // Single platform account (no Connect) — all card tips settle to one account.
  // `card` covers the card form plus the Apple Pay / Google Pay wallets; Link is
  // intentionally excluded so no "stripe"/Link branding shows to guests.
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "jpy",
    payment_method_types: ["card"],
    metadata: { tipId: tip.id, storeSlug: store.slug, tableLabel: tableLabel ?? "" },
  });

  await prisma.tip.update({
    where: { id: tip.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    tipId: tip.id,
    mode: "card",
    clientSecret: paymentIntent.client_secret,
  });
}
