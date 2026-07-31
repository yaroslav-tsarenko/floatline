export class OrderError extends Error {}

/** The user hasn't set a Steam id / trade token, so we can't deliver. */
export class NoTradeTargetError extends OrderError {
  constructor(public readonly userId: string) {
    super(`user ${userId} has no Steam id / trade token set`);
    this.name = "NoTradeTargetError";
  }
}

/** The item is no longer available (out of stock or delisted). */
export class ItemUnavailableError extends OrderError {
  constructor(public readonly marketHashName: string) {
    super(`item unavailable: ${marketHashName}`);
    this.name = "ItemUnavailableError";
  }
}

/**
 * The live price moved outside tolerance versus what the buyer confirmed, so we
 * refuse to charge silently. The caller re-quotes and asks the buyer again.
 */
export class PriceChangedError extends OrderError {
  constructor(
    public readonly marketHashName: string,
    public readonly expected: string,
    public readonly current: string,
  ) {
    super(
      `price changed for ${marketHashName}: confirmed ${expected}, now ${current}`,
    );
    this.name = "PriceChangedError";
  }
}
