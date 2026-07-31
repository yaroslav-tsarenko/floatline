# Floatline

A production CS2 skins marketplace. Skins are sourced through the **SIH**
provider (an aggregator over 28+ trading marketplaces); we never hold
inventory. A buyer spends a USD wallet balance, we place the order with SIH, and
the item is delivered by trade offer straight to their Steam inventory.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Neon
Postgres · Drizzle ORM · Tailwind v4. All background jobs run inside Next as
cron-invoked routes — no separate services.

---

## Architecture

- **Money is USD-only in storage.** EUR/GBP are display-only, converted at render
  from `fx_rates` (refreshed by the `sync-fx-rates` job). Rounding happens once,
  at render, via `<Money />`.
- **Wallet is an append-only ledger.** `wallet_transactions` is the source of
  truth; `wallets.balance` is a cached projection with a `>= 0` CHECK. Every
  entry carries an `idempotency_key`, so redelivered payment webhooks and
  concurrent purchases can never double-credit or double-charge.
- **Orders** move `created → submitted → processing → sent → finished`, with
  `failed` / `refunded` / `rolled_back` terminal states. Refunds post through the
  idempotent ledger (`order:<id>:refund`). SIH state is reconciled by both the
  webhook and the `poll-orders` job, which converge without double-applying.
- **Catalog** is populated and kept fresh entirely by the `sync-catalog` job.
  There is no client-side catalog fetching.

---

## Local development

### 1. Prerequisites

- Node.js 20+
- A Postgres database (Neon recommended). The `pg_trgm` extension is used for
  catalog search.

### 2. Configure environment

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (pooled) |
| `SIH_API_KEY` / `SIH_WEBHOOK_SECRET` | SIH provider credentials |
| `SIH_TEST_MODE` | `true` runs the full purchase cycle without real fulfillment |
| `SIH_MARGIN` / `SIH_MIN_MARGIN_ABS` | Sell-price markup (relative + absolute floor) |
| `SIH_MAX_ITEM_PRICE` | Risk cap — items above this are never sold |
| `SIH_LOW_BALANCE_THRESHOLD` | Alerts fire when SIH balance drops below this |
| `PAYMENT_API_KEY` / `PAYMENT_WEBHOOK_SECRET` | Deposit provider credentials |
| `FX_API_URL` / `FX_QUOTES` | FX source (Frankfurter shape) and quote currencies |
| `SESSION_SECRET` | Signs the session cookie |
| `ADMIN_STEAM_IDS` | Comma-separated SteamID64s allowed into `/admin` |
| `CRON_SECRET` | Bearer/secret required to invoke `/api/cron/*` |
| `APP_URL` | Public origin — used for the SIH webhook URL |
| `ALERT_TELEGRAM_BOT_TOKEN` / `ALERT_TELEGRAM_CHAT_ID` | Optional alert sink |

### 3. Migrate and seed

```bash
npm install
npm run db:migrate     # apply Drizzle migrations
npm run db:seed        # seed a realistic catalog + price history + FX rates
```

### 4. Run

```bash
npm run dev            # http://localhost:3000
```

---

## Jobs & crons

Jobs are registered in `lib/jobs/registry.ts` and invoked over HTTP at
`/api/cron/<job>` (guarded by `CRON_SECRET`). Scheduling lives in `vercel.json`.

| Job | Schedule | Does |
| --- | --- | --- |
| `sync-catalog` | every 7m | Pull SIH catalog, price, upsert, snapshot history |
| `poll-orders` | every 1m | Submit stuck orders, reconcile in-flight ones |
| `sync-fx-rates` | every 12h | Refresh USD→EUR/GBP rates |
| `check-balance` | every 30m | Alert on low SIH balance |
| `expire-payments` | every 30m | Mark abandoned pending deposits as expired |

Invoke manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app/api/cron/sync-catalog
```

Admins can also trigger any job and retry stuck orders from `/admin`.

---

## Deploying to Vercel

1. Import the repo. Framework preset: **Next.js**.
2. Add every variable from `.env.example` in **Project → Settings → Environment
   Variables**.
3. Deploy. `vercel.json` registers the cron schedule automatically.
4. Point SIH's webhook at `https://<your-domain>/api/webhooks/sih` — either from
   the `/admin` page ("Set webhook") or by calling SIH's `set-webhook` endpoint.
   The admin page shows whether the configured webhook matches this deployment.
5. Verify on `/admin`: SIH reachable, balance non-zero, crons green, FX fresh.

---

## Testing

```bash
npm test               # Vitest: name parser, pricing, SIH status mapping,
                       # wallet arithmetic, webhook verification, reconcile
npm run lint           # ESLint (flat config)
```

Money-path integration smoke test against a real database (creates a throwaway
user, exercises deposit idempotency, overdraft protection, a real purchase, and
refund idempotency, then cleans up):

```bash
tsx --env-file=.env scripts/smoke-wallet.ts
```

For performance, run Lighthouse against a production build (`npm run build &&
npm start`) — catalog and item pages stream their grids under Suspense and use
`next/image` with explicit `sizes`.
