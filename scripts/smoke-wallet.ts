/**
 * Integration smoke test for the money path against the real database. Creates
 * a throwaway user, exercises deposit idempotency, overdraft protection, a real
 * purchase, and refund idempotency, then cleans everything up. Run with:
 *   tsx --env-file=.env scripts/smoke-wallet.ts
 */
import { and, eq } from "drizzle-orm";

import { db, pool } from "@/lib/db";
import {
  orderEvents,
  orders,
  users,
  walletTransactions,
  wallets,
} from "@/lib/db/schema";
import { createPurchase } from "@/lib/orders/purchase";
import { InsufficientFundsError } from "@/lib/wallet/errors";
import { ensureWallet, getBalance, post, postTransaction } from "@/lib/wallet/ledger";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  const email = `smoke-${Date.now()}@test.invalid`;
  const [user] = await db
    .insert(users)
    .values({ email, steamId64: "76561190000000000", tradeToken: "SMOKETEST" })
    .returning({ id: users.id });
  const userId = user.id;
  console.log(`Created user ${userId}`);

  let createdOrderId: string | null = null;

  try {
    await db.transaction((tx) => ensureWallet(tx, userId));

    // Deposit idempotency: same key credits once.
    await post({ userId, type: "deposit", amount: "100.00", idempotencyKey: `smoke:dep:${userId}` });
    await post({ userId, type: "deposit", amount: "100.00", idempotencyKey: `smoke:dep:${userId}` });
    assert((await getBalance(userId)) === "100.00", "deposit is idempotent (balance = 100.00)");

    // Overdraft protection.
    let overdrew = false;
    try {
      await post({ userId, type: "purchase", amount: "-500.00", idempotencyKey: `smoke:over:${userId}` });
    } catch (err) {
      overdrew = err instanceof InsufficientFundsError;
    }
    assert(overdrew, "overdraft is rejected with InsufficientFundsError");
    assert((await getBalance(userId)) === "100.00", "balance unchanged after rejected overdraft");

    // Real purchase against a live, affordable item.
    const [item] = await db
      .select({ mhn: items.marketHashName, price: items.sellPrice })
      .from(items)
      .where(and(eq(items.isAvailable, true)))
      .limit(1);

    if (item && item.price && Number(item.price) <= 100) {
      const result = await createPurchase({ userId, marketHashName: item.mhn });
      createdOrderId = result.orderId;
      const expected = (100 - Number(item.price)).toFixed(2);
      assert(result.balanceAfter === expected, `purchase debited ${item.price} (balance = ${expected})`);

      const [ord] = await db.select().from(orders).where(eq(orders.id, result.orderId));
      assert(ord?.status === "created", "order created in 'created' state");

      // Refund idempotency on the ledger.
      await db.transaction((tx) =>
        postTransaction(tx, {
          userId,
          type: "refund",
          amount: ord.shownPrice,
          idempotencyKey: `order:${result.orderId}:refund`,
          orderId: result.orderId,
        }),
      );
      const dup = await db.transaction((tx) =>
        postTransaction(tx, {
          userId,
          type: "refund",
          amount: ord.shownPrice,
          idempotencyKey: `order:${result.orderId}:refund`,
          orderId: result.orderId,
        }),
      );
      assert(dup.created === false, "duplicate refund is a no-op");
      assert((await getBalance(userId)) === "100.00", "balance restored to 100.00 after single refund");
    } else {
      console.log("  ! no affordable available item found — skipping purchase leg");
    }

    console.log("\nSMOKE TEST PASSED");
  } finally {
    // Cleanup, children first.
    if (createdOrderId) {
      await db.delete(orderEvents).where(eq(orderEvents.orderId, createdOrderId));
    }
    await db.delete(orders).where(eq(orders.userId, userId));
    await db.delete(walletTransactions).where(eq(walletTransactions.userId, userId));
    await db.delete(wallets).where(eq(wallets.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    console.log(`Cleaned up user ${userId}`);
    await pool.end();
  }
}

// Imported late so the assert-time reference is clear above.
import { items } from "@/lib/db/schema";

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
