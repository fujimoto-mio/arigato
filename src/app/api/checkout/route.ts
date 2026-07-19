import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALES } from "@/i18n/messages";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { TIP_AMOUNTS } from "@/lib/tipTiers";

const bodySchema = z.object({
  slug: z.string().min(1),
  staffId: z.string().min(1),
  amount: z.number().int().refine((amount) => TIP_AMOUNTS.includes(amount)),
  locale: z.enum(LOCALES),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { slug, staffId, amount, locale } = parsed.data;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "store_not_found" }, { status: 404 });
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, storeId: store.id, active: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const tip = await prisma.tip.create({
    data: { storeId: store.id, staffId: staff.id, amount, locale },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "jpy",
    automatic_payment_methods: { enabled: true },
    metadata: { tipId: tip.id, storeSlug: store.slug, staffId: staff.id },
  });

  await prisma.tip.update({
    where: { id: tip.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({ tipId: tip.id });
}
