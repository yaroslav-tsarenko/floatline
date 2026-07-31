// Money is stored as numeric(12,2) and read back from Postgres as decimal
// strings. Doing arithmetic on those as floats loses cents, so all ledger math
// runs on integer cents. These helpers are the only place strings/numbers turn
// into cents and back — keep them pure and exact.

const MONEY_RE = /^-?\d+(\.\d+)?$/;

/** Parses a decimal money value to integer cents, rounding half-up. */
export function toCents(value: string | number): number {
  const s = typeof value === "number" ? value.toString() : value.trim();
  if (!MONEY_RE.test(s)) {
    throw new Error(`invalid money amount: ${JSON.stringify(value)}`);
  }
  const neg = s.startsWith("-");
  const [intPart, fracPart = ""] = (neg ? s.slice(1) : s).split(".");
  // Three frac digits: two of precision plus one to decide rounding.
  const frac = (fracPart + "000").slice(0, 3);
  let cents = Number(intPart) * 100 + Number(frac.slice(0, 2));
  if (Number(frac[2]) >= 5) cents += 1;
  return neg ? -cents : cents;
}

/** Formats integer cents back to a fixed 2-decimal string for numeric(12,2). */
export function fromCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`cents must be an integer: ${cents}`);
  }
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${neg ? "-" : ""}${whole}.${rem.toString().padStart(2, "0")}`;
}

/**
 * Applies a signed entry to a balance, both in cents. Throws when the result
 * would be negative — the ledger must never let a wallet go below zero.
 */
export function computeNextBalance(balanceCents: number, amountCents: number): number {
  const next = balanceCents + amountCents;
  if (next < 0) {
    throw new RangeError(
      `insufficient funds: balance ${balanceCents}¢ + entry ${amountCents}¢ < 0`,
    );
  }
  return next;
}
