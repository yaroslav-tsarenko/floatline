import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { signOut } from "@/app/actions/auth";
import { TradeUrlForm } from "@/components/account/trade-url-form";
import { Money } from "@/components/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Surface } from "@/components/ui/surface";
import { getRecentTransactions, getUserOrders } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/wallet/ledger";

export const metadata: Metadata = { title: "Account" };

const TX_LABEL: Record<string, string> = {
  deposit: "Top up",
  purchase: "Purchase",
  refund: "Refund",
  adjustment: "Adjustment",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { link } = await searchParams;
  const linkTaken = link === "taken";
  const hasSteam = !!user.steamId64;

  const [balance, txs, orders] = await Promise.all([
    getBalance(user.id),
    getRecentTransactions(user.id, 15),
    getUserOrders(user.id, 5),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Account
          </h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-muted hover:text-text">Sign out</button>
        </form>
      </div>

      {!hasSteam && (
        <Surface inset className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Link your Steam account to buy</p>
            <p className="text-sm text-muted">
              Purchases are delivered as Steam trades, so we need your Steam
              identity before your first order.
            </p>
            {linkTaken && (
              <p className="mt-1 text-sm text-negative">
                That Steam account is already linked to another user.
              </p>
            )}
          </div>
          <a
            href="/api/auth/steam"
            className="shrink-0 rounded-md bg-signal px-4 py-2 text-center text-sm font-medium text-white hover:brightness-110"
          >
            Link Steam
          </a>
        </Surface>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Surface className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Balance</p>
          <Money usd={Number(balance)} className="text-3xl font-semibold" />
          <p className="mt-3 text-xs text-muted">
            Top-ups require a configured payment provider. Balance is spent in
            USD on purchases; refunds are credited back automatically.
          </p>
        </Surface>

        <Surface className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">
            Steam trade link
          </p>
          <p className="mb-3 mt-1 text-xs text-muted">
            Required to receive items. Find it in Steam → Inventory → Trade
            Offers → Who can send me Trade Offers.
          </p>
          <TradeUrlForm initial={user.tradeUrl} />
        </Surface>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent orders</h2>
          <Link href="/orders" className="text-sm text-signal hover:underline">
            All orders
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate">
                  {o.snapshot.name ?? o.marketHashName}
                </span>
                <OrderStatusBadge status={o.status} />
                <Money usd={Number(o.shownPrice)} className="w-20 text-right" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Wallet activity</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {txs.map((t) => {
              const credit = !t.amount.startsWith("-");
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="flex-1">{TX_LABEL[t.type] ?? t.type}</span>
                  <span className="text-xs text-muted">
                    {t.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`num w-24 text-right ${credit ? "text-positive" : "text-text"}`}
                  >
                    {credit ? "+" : "−"}
                    <Money usd={Math.abs(Number(t.amount))} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
