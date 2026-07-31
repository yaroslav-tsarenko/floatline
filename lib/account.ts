import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderEvents, orders, walletTransactions } from "@/lib/db/schema";

export interface WalletTxView {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  createdAt: Date;
  orderId: string | null;
}

export async function getRecentTransactions(
  userId: string,
  limit = 20,
): Promise<WalletTxView[]> {
  return db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      createdAt: walletTransactions.createdAt,
      orderId: walletTransactions.orderId,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

export interface OrderSnapshot {
  name?: string;
  weapon?: string | null;
  skinName?: string | null;
  exterior?: string | null;
  rarityColor?: string | null;
  imageHash?: string | null;
  isStattrak?: boolean;
  isSouvenir?: boolean;
}

export interface OrderView {
  id: string;
  marketHashName: string;
  status: string;
  shownPrice: string;
  createdAt: Date;
  snapshot: OrderSnapshot;
}

export async function getUserOrders(
  userId: string,
  limit = 50,
): Promise<OrderView[]> {
  const rows = await db
    .select({
      id: orders.id,
      marketHashName: orders.marketHashName,
      status: orders.status,
      shownPrice: orders.shownPrice,
      createdAt: orders.createdAt,
      snapshot: orders.itemSnapshot,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, snapshot: (r.snapshot ?? {}) as OrderSnapshot }));
}

export interface OrderDetail extends OrderView {
  sihStatus: string | null;
  sihError: string | null;
  senderNickname: string | null;
  finishedAt: Date | null;
  submittedAt: Date | null;
}

export interface OrderEventView {
  id: string;
  source: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: Date;
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<{ order: OrderDetail; events: OrderEventView[] } | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!row || row.userId !== userId) return null;

  const events = await db
    .select({
      id: orderEvents.id,
      source: orderEvents.source,
      fromStatus: orderEvents.fromStatus,
      toStatus: orderEvents.toStatus,
      createdAt: orderEvents.createdAt,
    })
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(desc(orderEvents.createdAt));

  return {
    order: {
      id: row.id,
      marketHashName: row.marketHashName,
      status: row.status,
      shownPrice: row.shownPrice,
      createdAt: row.createdAt,
      snapshot: (row.itemSnapshot ?? {}) as OrderSnapshot,
      sihStatus: row.sihStatus,
      sihError: row.sihError,
      senderNickname: row.senderNickname,
      finishedAt: row.finishedAt,
      submittedAt: row.submittedAt,
    },
    events,
  };
}
