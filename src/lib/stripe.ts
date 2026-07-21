import Stripe from "stripe";

let client: Stripe | undefined;

function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  client = new Stripe(secretKey);
  return client;
}

/**
 * Lazily constructed Stripe client.
 *
 * Building the client at module scope would throw during `next build`, which
 * imports route modules to collect page data but never needs a live key. The
 * proxy defers construction to first use, so call sites keep using `stripe.x`
 * and a missing key fails at request time with a clear message.
 */
export const stripe = new Proxy({} as Stripe, {
  get: (_target, property) => {
    const instance = getStripe();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
