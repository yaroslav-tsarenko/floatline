import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { Money } from "@/components/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { SkinImage } from "@/components/skin-image";
import { Surface } from "@/components/ui/surface";
import { getOrderForUser } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth/session";
import { itemSlug } from "@/lib/catalog/slug";

export const metadata: Metadata = { title: "Order" };

const REFUNDED = new Set(["refunded", "rolled_back", "failed"]);

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/steam");

  const { id } = await params;
  const data = await getOrderForUser(user.id, id);
  if (!data) notFound();

  const { order, events } = data;
  const refunded = REFUNDED.has(order.status);
  const delivered = order.status === "finished";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <nav className="text-xs text-muted">
        <Link href="/orders" className="hover:text-text">
          Orders
        </Link>
        <span className="mx-1">/</span>
        <span className="font-mono">{order.id.slice(0, 8)}</span>
      </nav>

      <Surface className="flex items-center gap-4 p-4">
        <SkinImage
          imageHash={order.snapshot.imageHash ?? null}
          name={order.snapshot.name ?? order.marketHashName}
          rarityColor={order.snapshot.rarityColor ?? null}
          className="size-20 shrink-0 rounded"
          sizes="80px"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/item/${itemSlug(order.marketHashName)}`}
            className="truncate font-medium hover:underline"
          >
            {order.snapshot.name ?? order.marketHashName}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <Money usd={Number(order.shownPrice)} className="text-sm" />
          </div>
        </div>
      </Surface>

      <Surface className="p-4 text-sm">
        {delivered && (
          <p className="text-positive">
            Delivered. The trade offer{" "}
            {order.senderNickname ? `from ${order.senderNickname} ` : ""}was
            accepted into your inventory.
          </p>
        )}
        {refunded && (
          <p className="text-negative">
            This order was {order.status.replace("_", " ")} and your balance was
            refunded automatically.
            {order.sihError ? ` Reason: ${order.sihError}.` : ""}
          </p>
        )}
        {!delivered && !refunded && (
          <p className="text-muted">
            We&apos;re fulfilling this order. A Steam trade offer will arrive
            shortly — keep an eye on your inventory.
          </p>
        )}
      </Surface>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-muted">Timeline</h2>
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span>
                {e.fromStatus ? `${e.fromStatus} → ` : ""}
                {e.toStatus ?? "—"}
              </span>
              <span className="text-xs text-muted">
                {e.createdAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted">No events yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
