import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Money } from "@/components/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { SkinImage } from "@/components/skin-image";
import { getUserOrders } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/steam");

  const orders = await getUserOrders(user.id, 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-sm text-muted">
          No orders yet.{" "}
          <Link href="/catalog" className="text-signal hover:underline">
            Browse the catalog
          </Link>
          .
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
            >
              <SkinImage
                imageHash={o.snapshot.imageHash ?? null}
                name={o.snapshot.name ?? o.marketHashName}
                rarityColor={o.snapshot.rarityColor ?? null}
                className="size-12 shrink-0 rounded"
                sizes="48px"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {o.snapshot.name ?? o.marketHashName}
                </p>
                <p className="text-xs text-muted">
                  {o.createdAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <OrderStatusBadge status={o.status} />
              <Money usd={Number(o.shownPrice)} className="w-20 text-right text-sm" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
