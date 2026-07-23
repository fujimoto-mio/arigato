/**
 * Tip amount rules. The guest sets the amount with a ¥0-start counter that adds
 * TIP_STEP per tap (matches the "+¥100" reference frame); any amount from ¥0 up
 * to TIP_MAX is allowed, so long as it is a whole multiple of the step.
 */
export const TIP_STEP = 100;
export const TIP_MIN = 0;
export const TIP_MAX = 100_000;

/** Stripe rejects tiny/zero JPY charges, so card payment needs a real amount. */
export const CARD_MIN_AMOUNT = TIP_STEP;

export function isValidTipAmount(amount: number): boolean {
  return (
    Number.isInteger(amount) &&
    amount >= TIP_MIN &&
    amount <= TIP_MAX &&
    amount % TIP_STEP === 0
  );
}
