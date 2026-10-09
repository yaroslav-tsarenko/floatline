"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { buyItem } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";

export type BuyState =
  | "guest"
  | "no_steam"
  | "no_trade"
  | "insufficient"
  | "ready";

export function BuyButton({
  marketHashName,
  price,
  state,
}: {
  marketHashName: string;
  price: number;
  state: BuyState;
}) {
  const [pendingBalance, startBalanceTransition] = useTransition();
  const [pendingCard, startCardTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPending = pendingBalance || pendingCard;

  const handleDirectCardPay = () => {
    setError(null);
    startCardTransition(async () => {
      try {
        const res = await fetch("/api/skins/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketHashName,
            confirmedPrice: price.toFixed(2),
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error || "Failed to start checkout. Please try again.");
          return;
        }

        if (json.redirectUrl) {
          window.location.href = json.redirectUrl;
        }
      } catch (err: any) {
        setError(err?.message || "Failed to initiate payment. Please try again.");
      }
    });
  };

  const handleBalancePay = () => {
    setError(null);
    startBalanceTransition(async () => {
      const res = await buyItem(marketHashName, price.toFixed(2));
      if (res && !res.ok) setError(res.error);
    });
  };

  if (state === "guest") {
    return (
      <Link
        href="/signin"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
      >
        Sign in to buy
      </Link>
    );
  }

  if (state === "no_steam") {
    return (
      <a
        href="/api/auth/steam"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
      >
        Link Steam to buy
      </a>
    );
  }

  if (state === "no_trade") {
    return (
      <Link
        href="/account"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
      >
        Add your trade link to buy
      </Link>
    );
  }

  if (state === "insufficient") {
    return (
      <div className="space-y-2">
        <Button
          className="w-full"
          loading={pendingCard}
          disabled={isPending}
          onClick={handleDirectCardPay}
        >
          Buy now for ${price.toFixed(2)}
        </Button>
        <div className="flex items-center justify-center">
          <Link
            href="/account"
            className="text-xs text-muted hover:text-text underline"
          >
            Or top up balance first
          </Link>
        </div>
        {error && <p className="text-center text-xs text-negative">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        loading={pendingBalance}
        disabled={isPending}
        onClick={handleBalancePay}
      >
        Buy with balance (${price.toFixed(2)})
      </Button>
      <Button
        variant="secondary"
        className="w-full text-xs"
        loading={pendingCard}
        disabled={isPending}
        onClick={handleDirectCardPay}
      >
        Pay with Card / Bank
      </Button>
      {error && <p className="text-center text-xs text-negative">{error}</p>}
    </div>
  );
}
