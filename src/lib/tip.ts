/**
 * Tip amount rules. Amounts are stored in US-dollar cents — Stripe's smallest
 * USD unit — so $1 = 100. The guest sets the amount with a $0-start counter that
 * adds TIP_STEP (one dollar) per tap; any amount from $0 up to TIP_MAX is
 * allowed, so long as it is a whole multiple of the step.
 */
export const TIP_STEP = 100; // one dollar, in cents
export const TIP_MIN = 0;
export const TIP_MAX = 100_000; // $1,000, in cents

/** Stripe rejects tiny/zero charges, so a card tip needs a real amount ($1). */
export const CARD_MIN_AMOUNT = TIP_STEP;

export function isValidTipAmount(amount: number): boolean {
  return (
    Number.isInteger(amount) &&
    amount >= TIP_MIN &&
    amount <= TIP_MAX &&
    amount % TIP_STEP === 0
  );
}
