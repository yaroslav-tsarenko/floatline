import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import {
  retryOrderAction,
  runJobAction,
  setWebhookAction,
} from "@/app/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { Money } from "@/components/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Surface } from "@/components/ui/surface";
import {
  getCronHealth,
  getFxStatus,
  getMarkupConfig,
  getOpenOrders,
  getPendingPayments,
  getSihHealth,
  getWebhookActivity,
} from "@/lib/admin";
import { getAdminUser } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

function ago(date: Date | null): string {
  if (!date) return "never";
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Dot({ tone }: { tone: "positive" | "negative" | "muted" }) {
  const cls =
    tone === "positive"
      ? "bg-positive"
      : tone === "negative"
        ? "bg-negative"
        : "bg-muted";
  return <span className={`inline-block size-2 rounded-full ${cls}`} />;
}

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/");

  const [sihHealth, crons, fx, markup, openOrders, webhook, pending] =
    await Promise.all([
      getSihHealth(),
      getCronHealth(),
      getFxStatus(),
      getMarkupConfig(),
      getOpenOrders(),
      getWebhookActivity(),
      getPendingPayments(),
    ]);

  const stuck = openOrders.filter((o) => o.stuck).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Admin
        </h1>
        <p className="text-sm text-muted">
          Operations dashboard — supplier health, jobs, orders, pricing.
        </p>
      </div>

      {/* SIH health */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted">
          Supplier (SIH)
        </h2>
        <Surface className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Balance</p>
            {sihHealth.ok ? (
              <p className="num text-2xl font-semibold">
                {sihHealth.balance != null ? (
                  <Money usd={sihHealth.balance} />
                ) : (
                  "—"
                )}
              </p>
            ) : (
              <p className="text-sm text-negative">unreachable</p>
            )}
            {sihHealth.lowBalance && (
              <p className="mt-1 text-xs text-negative">
                below ${sihHealth.threshold} threshold
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted">Webhook</p>
            <p className="flex items-center gap-2 text-sm">
              <Dot tone={sihHealth.webhookMatches ? "positive" : "negative"} />
              <span className="truncate font-mono text-xs">
                {sihHealth.webhook ?? "not set"}
              </span>
            </p>
            {!sihHealth.webhookMatches && (
              <p className="mt-1 text-xs text-muted">
                expected{" "}
                <span className="font-mono">{sihHealth.expectedWebhook}</span>
              </p>
            )}
            {sihHealth.error && (
              <p className="mt-1 text-xs text-negative">{sihHealth.error}</p>
            )}
            <div className="mt-2">
              <AdminButton action={setWebhookAction} label="Set webhook" />
            </div>
          </div>
        </Surface>
      </section>

      {/* Cron health */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted">
          Jobs &amp; crons
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {crons.map((c) => {
            const tone =
              c.lastStatus === "ok"
                ? "positive"
                : c.lastStatus === "error"
                  ? "negative"
                  : "muted";
            return (
              <div
                key={c.job}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm"
              >
                <span className="flex min-w-40 items-center gap-2 font-medium">
                  <Dot tone={tone} />
                  {c.job}
                </span>
                <span className="text-xs text-muted">every {c.everyMinutes}m</span>
                <span className="text-xs text-muted">
                  last run {ago(c.lastStartedAt)}
                  {c.lastStatus ? ` · ${c.lastStatus}` : ""}
                </span>
                {c.lastError && (
                  <span className="text-xs text-negative">{c.lastError}</span>
                )}
                <span className="ml-auto">
                  <AdminButton
                    action={runJobAction.bind(null, c.job)}
                    label="Run now"
                    size="sm"
                    variant="ghost"
                  />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* FX + markup */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted">
            FX rates (base USD)
          </h2>
          <Surface className="divide-y divide-border p-0 text-sm">
            {fx.length === 0 ? (
              <p className="p-4 text-muted">No rates yet.</p>
            ) : (
              fx.map((r) => (
                <div
                  key={r.quote}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <Dot tone={r.stale ? "negative" : "positive"} />
                    {r.quote}
                  </span>
                  <span className="num">{Number(r.rate).toFixed(4)}</span>
                  <span className="text-xs text-muted">{ago(r.fetchedAt)}</span>
                </div>
              ))
            )}
          </Surface>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted">
            Pricing (env-configured)
          </h2>
          <Surface className="space-y-2 p-4 text-sm">
            <Row label="Relative margin" value={`${(markup.margin * 100).toFixed(1)}%`} />
            <Row label="Min absolute margin" value={`$${markup.minMarginAbs}`} />
            <Row label="Price tolerance" value={`${(markup.priceTolerance * 100).toFixed(1)}%`} />
            <Row label="Max item price" value={`$${markup.maxItemPrice}`} />
            <Row
              label="Available / total"
              value={`${markup.availableItems} / ${markup.totalItems}`}
            />
          </Surface>
        </section>
      </div>

      {/* Small stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="SIH webhooks logged" value={String(webhook.total)} sub={`last ${ago(webhook.lastReceivedAt)}`} />
        <Stat label="Stuck orders" value={String(stuck)} sub={`of ${openOrders.length} open`} />
        <Stat label="Stale pending payments" value={String(pending.pending)} sub="> 60m old" />
      </div>

      {/* Open orders */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted">
          Open orders
        </h2>
        {openOrders.length === 0 ? (
          <p className="text-sm text-muted">Nothing in flight.</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {openOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm"
              >
                <Link
                  href={`/orders/${o.id}`}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {o.marketHashName}
                </Link>
                <OrderStatusBadge status={o.status} />
                <Money usd={Number(o.shownPrice)} className="w-20 text-right" />
                <span
                  className={`w-20 text-right text-xs ${o.stuck ? "text-negative" : "text-muted"}`}
                >
                  {o.ageMinutes}m
                </span>
                <span className="w-28 truncate text-right text-xs text-muted">
                  {o.sihStatus ?? "—"}
                </span>
                <AdminButton
                  action={retryOrderAction.bind(null, o.id)}
                  label="Retry"
                  size="sm"
                  variant="ghost"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Surface className="p-4">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="num mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
    </Surface>
  );
}
