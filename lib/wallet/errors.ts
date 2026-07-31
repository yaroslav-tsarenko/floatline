export class WalletError extends Error {}

/** The user has no wallet row yet — call `ensureWallet` before posting. */
export class WalletNotFoundError extends WalletError {
  constructor(public readonly userId: string) {
    super(`wallet not found for user ${userId}`);
    this.name = "WalletNotFoundError";
  }
}

/** A debit would push the balance below zero. */
export class InsufficientFundsError extends WalletError {
  constructor(
    public readonly userId: string,
    public readonly balanceCents: number,
    public readonly amountCents: number,
  ) {
    super(
      `insufficient funds for user ${userId}: balance ${balanceCents}¢, entry ${amountCents}¢`,
    );
    this.name = "InsufficientFundsError";
  }
}
