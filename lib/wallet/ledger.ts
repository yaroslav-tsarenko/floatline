import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { wallets, walletTransactions } from "@/lib/db/schema";

import { computeNextBalance, fromCents, toCents } from "./amount";
import { InsufficientFundsError, WalletNotFoundError } from "./errors";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type WalletTxType = "deposit" | "purchase" | "refund" | "adjustment";

export interface LedgerEntry {
  userId: string;
  type: WalletTxType;
  /** Signed amount in dollars: positive credits, negative debits. */
  amount: string | number;
  /** Unique key so the same logical event posts at most once. */
  idempotencyKey: string;
  orderId?: string;
  paymentId?: string;
  meta?: Record<string, unknown>;
}

export interface WalletTxRecord {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: string;
  balanceAfter: string;
  orderId: string | null;
  paymentId: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export interface PostResult {
  record: WalletTxRecord;
  /** False when an entry with the same idempotency key already existed. */
  created: boolean;
}

/** Creates the wallet row if absent. Safe to call repeatedly. */
export async function ensureWallet(tx: Tx, userId: string): Promise<void> {
  await tx.insert(wallets).values({ userId }).onConflictDoNothing();
}

/**
 * Posts one append-only ledger entry inside an existing transaction. Locks the
 * wallet row FOR UPDATE first so concurrent posts for the same user serialize;
 * the idempotency check runs under that lock, so a duplicate key is a no-op
 * rather than a unique-violation race. Updates `wallets.balance` to match the
 * running total and records `balanceAfter` on the entry.
 *
 * Requires the wallet to exist (call `ensureWallet` for first-time credits).
 */
export async function postTransaction(
  tx: Tx,
  entry: LedgerEntry,
): Promise<PostResult> {
  const [wallet] = await tx
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, entry.userId))
    .for("update");

  if (!wallet) throw new WalletNotFoundError(entry.userId);

  const [existing] = await tx
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.idempotencyKey, entry.idempotencyKey))
    .limit(1);

  if (existing) {
    return { record: toRecord(existing), created: false };
  }

  const balanceCents = toCents(wallet.balance);
  const amountCents = toCents(entry.amount);

  let nextCents: number;
  try {
    nextCents = computeNextBalance(balanceCents, amountCents);
  } catch {
    throw new InsufficientFundsError(entry.userId, balanceCents, amountCents);
  }

  const balanceAfter = fromCents(nextCents);

  await tx
    .update(wallets)
    .set({ balance: balanceAfter, updatedAt: new Date() })
    .where(eq(wallets.userId, entry.userId));

  const [row] = await tx
    .insert(walletTransactions)
    .values({
      userId: entry.userId,
      type: entry.type,
      amount: fromCents(amountCents),
      balanceAfter,
      orderId: entry.orderId ?? null,
      paymentId: entry.paymentId ?? null,
      idempotencyKey: entry.idempotencyKey,
      meta: entry.meta ?? null,
    })
    .returning();

  return { record: toRecord(row), created: true };
}

/** Opens its own transaction to post a single entry. */
export function post(entry: LedgerEntry): Promise<PostResult> {
  return db.transaction((tx) => postTransaction(tx, entry));
}

export async function getBalance(userId: string): Promise<string> {
  const [wallet] = await db
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, userId));
  return wallet?.balance ?? "0.00";
}

type WalletTxRow = typeof walletTransactions.$inferSelect;

function toRecord(row: WalletTxRow): WalletTxRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    orderId: row.orderId,
    paymentId: row.paymentId,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
  };
}
