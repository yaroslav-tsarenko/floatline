import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  fxRates,
  items,
  orders,
  payments,
  syncRuns,
  webhookLogs,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { listJobs } from "@/lib/jobs/registry";
import { sih } from "@/lib/sih/client";

export const OPEN_ORDER_STATUSES = [
  "created",
  "submitted",
  "processing",
  "sent",
] as const;

// An open order older than this is stuck and worth a human's attention.
const STUCK_MINUTES = 15;

export interface SihHealth {
  ok: boolean;
  balance: number | null;
  threshold: number;
  lowBalance: boolean;
  webhook: string | null;
  expectedWebhook: string;
  webhookMatches: boolean;
  error: string | null;
}

export async function getSihHealth(): Promise<SihHealth> {
  const expectedWebhook = `${env.APP_URL}/api/webhooks/sih`;
  const threshold = env.SIH_LOW_BALANCE_THRESHOLD;
  try {
    const project = await sih.getProject();
    const balance = project.balance ?? null;
    const webhook = project.webhook ?? null;
    return {
      ok: true,
      balance,
      threshold,
      lowBalance: balance != null && balance < threshold,
      webhook,
      expectedWebhook,
      webhookMatches: webhook === expectedWebhook,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      balance: null,
      threshold,
      lowBalance: false,
      webhook: null,
      expectedWebhook,
      webhookMatches: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface CronHealth {
  job: string;
  everyMinutes: number;
  lastStatus: string | null;
  lastStartedAt: Date | null;
  lastFinishedAt: Date | null;
  lastError: string | null;
  stats: unknown;
}

export async function getCronHealth(): Promise<CronHealth[]> {
  const jobs = listJobs();
  return Promise.all(
    jobs.map(async (job) => {
      const [last] = await db
        .select()
        .from(syncRuns)
        .where(eq(syncRuns.job, job.name))
        .orderBy(desc(syncRuns.startedAt))
        .limit(1);
      return {
        job: job.name,
        everyMinutes: job.everyMinutes,
        lastStatus: last?.status ?? null,
        lastStartedAt: last?.startedAt ?? null,
        lastFinishedAt: last?.finishedAt ?? null,
        lastError: last?.error ?? null,
        stats: last?.stats ?? null,
      };
    }),
  );
}

export interface AdminOrderRow {
  id: string;
  marketHashName: string;
  status: string;
  shownPrice: string;
  sihStatus: string | null;
  sihError: string | null;
  createdAt: Date;
  ageMinutes: number;
  stuck: boolean;
}

export async function getOpenOrders(limit = 100): Promise<AdminOrderRow[]> {
  const rows = await db
    .select({
      id: orders.id,
      marketHashName: orders.marketHashName,
      status: orders.status,
      shownPrice: orders.shownPrice,
      sihStatus: orders.sihStatus,
      sihError: orders.sihError,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(inArray(orders.status, [...OPEN_ORDER_STATUSES]))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const now = Date.now();
  return rows.map((r) => {
    const ageMinutes = Math.floor((now - r.createdAt.getTime()) / 60_000);
    return { ...r, ageMinutes, stuck: ageMinutes >= STUCK_MINUTES };
  });
}

export interface FxStatus {
  quote: string;
  rate: string;
  fetchedAt: Date;
  stale: boolean;
}

const FX_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function getFxStatus(): Promise<FxStatus[]> {
  const rows = await db
    .select({
      quote: fxRates.quote,
      rate: fxRates.rate,
      fetchedAt: fxRates.fetchedAt,
    })
    .from(fxRates)
    .orderBy(fxRates.quote);

  const now = Date.now();
  return rows.map((r) => ({
    ...r,
    stale: now - r.fetchedAt.getTime() > FX_MAX_AGE_MS,
  }));
}

export interface MarkupConfig {
  margin: number;
  minMarginAbs: number;
  maxItemPrice: number;
  priceTolerance: number;
  availableItems: number;
  totalItems: number;
}

export async function getMarkupConfig(): Promise<MarkupConfig> {
  const [{ available }] = await db
    .select({ available: count() })
    .from(items)
    .where(eq(items.isAvailable, true));
  const [{ total }] = await db.select({ total: count() }).from(items);

  return {
    margin: env.SIH_MARGIN,
    minMarginAbs: env.SIH_MIN_MARGIN_ABS,
    maxItemPrice: env.SIH_MAX_ITEM_PRICE,
    priceTolerance: env.SIH_PRICE_TOLERANCE,
    availableItems: available,
    totalItems: total,
  };
}

export interface WebhookActivity {
  total: number;
  lastReceivedAt: Date | null;
}

export async function getWebhookActivity(): Promise<WebhookActivity> {
  const [row] = await db
    .select({
      total: count(),
      lastReceivedAt: sql<Date | null>`max(${webhookLogs.createdAt})`,
    })
    .from(webhookLogs)
    .where(eq(webhookLogs.source, "sih"));

  return {
    total: row?.total ?? 0,
    lastReceivedAt: row?.lastReceivedAt ?? null,
  };
}

export interface PendingPaymentStat {
  pending: number;
}

export async function getPendingPayments(): Promise<PendingPaymentStat> {
  const staleCutoff = new Date(Date.now() - 60 * 60_000);
  const [row] = await db
    .select({ pending: count() })
    .from(payments)
    .where(and(eq(payments.status, "pending"), lt(payments.createdAt, staleCutoff)));
  return { pending: row?.pending ?? 0 };
}
