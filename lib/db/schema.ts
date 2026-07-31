import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// --- Enums ---------------------------------------------------------------

export const exteriorEnum = pgEnum("exterior", ["FN", "MW", "FT", "WW", "BS"]);

export const categoryEnum = pgEnum("category", [
  "rifle",
  "pistol",
  "knife",
  "gloves",
  "smg",
  "heavy",
  "agent",
  "sticker",
  "other",
]);

export const rarityEnum = pgEnum("rarity", [
  "consumer",
  "industrial",
  "milspec",
  "restricted",
  "classified",
  "covert",
  "contraband",
]);

export const currencyEnum = pgEnum("currency", ["USD", "EUR", "GBP"]);

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit",
  "purchase",
  "refund",
  "adjustment",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "created",
  "submitted",
  "processing",
  "sent",
  "finished",
  "failed",
  "refunded",
  "rolled_back",
]);

export const orderEventSourceEnum = pgEnum("order_event_source", [
  "user",
  "sih_webhook",
  "sih_poll",
  "system",
]);

// --- items ---------------------------------------------------------------

export const items = pgTable(
  "items",
  {
    marketHashName: text("market_hash_name").primaryKey(),
    appId: integer("app_id").notNull(),
    name: text("name").notNull(),
    weapon: text("weapon"),
    skinName: text("skin_name"),
    exterior: exteriorEnum("exterior"),
    isStattrak: boolean("is_stattrak").notNull().default(false),
    isSouvenir: boolean("is_souvenir").notNull().default(false),
    category: categoryEnum("category").notNull().default("other"),
    rarity: rarityEnum("rarity"),
    rarityColor: text("rarity_color"),
    phase: text("phase"),
    imageHash: text("image_hash"),
    costPrice: numeric("cost_price", { precision: 12, scale: 4 }),
    sellPrice: numeric("sell_price", { precision: 12, scale: 4 }),
    steamPrice: numeric("steam_price", { precision: 12, scale: 4 }),
    count: integer("count").notNull().default(0),
    market: text("market"),
    isAvailable: boolean("is_available").notNull().default(false),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("items_available_price_idx").on(t.isAvailable, t.sellPrice),
    index("items_category_exterior_idx").on(t.category, t.exterior),
    index("items_rarity_idx").on(t.rarity),
    index("items_name_trgm_idx").using(
      "gin",
      sql`${t.name} gin_trgm_ops`,
    ),
  ],
);

// --- price_history -------------------------------------------------------

export const priceHistory = pgTable(
  "price_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketHashName: text("market_hash_name")
      .notNull()
      .references(() => items.marketHashName, { onDelete: "cascade" }),
    costPrice: numeric("cost_price", { precision: 12, scale: 4 }),
    steamPrice: numeric("steam_price", { precision: 12, scale: 4 }),
    count: integer("count").notNull().default(0),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("price_history_item_time_idx").on(t.marketHashName, t.capturedAt)],
);

// --- users ---------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  steamId64: text("steam_id64"),
  tradeToken: text("trade_token"),
  tradeUrl: text("trade_url"),
  tradeUrlUpdatedAt: timestamp("trade_url_updated_at", { withTimezone: true }),
  preferredCurrency: currencyEnum("preferred_currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- wallets -------------------------------------------------------------

export const wallets = pgTable(
  "wallets",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: numeric("balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currency: currencyEnum("currency").notNull().default("USD"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("wallets_balance_nonneg", sql`${t.balance} >= 0`)],
);

// --- wallet_transactions (append-only double entry) ----------------------

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: walletTxTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
    orderId: uuid("order_id"),
    paymentId: uuid("payment_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("wallet_tx_idempotency_key").on(t.idempotencyKey),
    index("wallet_tx_user_idx").on(t.userId, t.createdAt),
  ],
);

// --- payments ------------------------------------------------------------

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("USD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payments_provider_ref").on(t.providerRef),
    index("payments_user_status_idx").on(t.userId, t.status),
  ],
);

// --- orders --------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    marketHashName: text("market_hash_name").notNull(),
    itemSnapshot: jsonb("item_snapshot").notNull(),
    shownPrice: numeric("shown_price", { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 4 }),
    margin: numeric("margin", { precision: 12, scale: 4 }),
    status: orderStatusEnum("status").notNull().default("created"),
    sihOrderId: text("sih_order_id"),
    sihStatus: text("sih_status"),
    sihError: text("sih_error"),
    steamId: text("steam_id"),
    tradeToken: text("trade_token"),
    senderOfferId: text("sender_offer_id"),
    senderNickname: text("sender_nickname"),
    senderAvatar: text("sender_avatar"),
    senderTimeout: integer("sender_timeout"),
    protectionStatus: text("protection_status"),
    protectionError: text("protection_error"),
    protectionRollbackAt: timestamp("protection_rollback_at", {
      withTimezone: true,
    }),
    protectionRollbackAmount: numeric("protection_rollback_amount", {
      precision: 12,
      scale: 4,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("orders_sih_order_id").on(t.sihOrderId),
    index("orders_user_idx").on(t.userId, t.createdAt),
    index("orders_status_idx").on(t.status),
  ],
);

// --- order_events --------------------------------------------------------

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    source: orderEventSourceEnum("source").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

// --- webhook_logs --------------------------------------------------------

export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    method: text("method").notNull(),
    query: jsonb("query"),
    headers: jsonb("headers"),
    body: jsonb("body"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("webhook_logs_source_time_idx").on(t.source, t.createdAt)],
);

// --- fx_rates ------------------------------------------------------------

export const fxRates = pgTable("fx_rates", {
  quote: currencyEnum("quote").primaryKey(),
  rate: numeric("rate", { precision: 12, scale: 6 }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- sync_runs -----------------------------------------------------------

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    job: text("job").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().default("running"),
    stats: jsonb("stats"),
    error: text("error"),
  },
  (t) => [index("sync_runs_job_time_idx").on(t.job, t.startedAt)],
);
