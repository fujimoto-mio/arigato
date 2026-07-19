import { notFound } from "next/navigation";
import { PaymentForm } from "@/components/PaymentForm";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipId?: string }>;
}) {
  const { slug } = await params;
  const { tipId } = await searchParams;

  if (!tipId) {
    notFound();
  }

  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: { staff: true, store: true },
  });

  if (!tip || tip.store.slug !== slug || !tip.stripePaymentIntentId) {
    notFound();
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(tip.stripePaymentIntentId);
  if (!paymentIntent.client_secret) {
    notFound();
  }

  return (
    <PaymentForm
      slug={slug}
      tipId={tip.id}
      clientSecret={paymentIntent.client_secret}
      amount={tip.amount}
      staffName={tip.staff.name}
    />
  );
}
