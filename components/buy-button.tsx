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
  balance,
}: {
  marketHashName: string;
  price: number;
  state: BuyState;
  /** Site wallet balance in USD, or null when nobody is signed in. */
  balance?: number | null;
}) {
  const [pendingBalance, startBalanceTransition] = useTransition();
  const [pendingCard, startCardTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPending = pendingBalance || pendingCard;
  // `createPurchase` re-checks the balance authoritatively; this only keeps the
  // buyer from starting a buy that cannot succeed. An unknown balance falls
  // through to that server check rather than blocking the button.
  const knownBalance = typeof balance === "number" ? balance : null;
  const shortfall = knownBalance != null ? Math.max(0, price - knownBalance) : 0;
  const canPayFromBalance = knownBalance == null || shortfall <= 0;

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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initiate payment. Please try again.",
        );
      }
    });
  };

  const handleBalancePay = () => {
    setError(null);
    if (!canPayFromBalance) {
      setError(
        `Not enough balance. You have $${(knownBalance ?? 0).toFixed(2)} — top up $${shortfall.toFixed(2)} or pay by card.`,
      );
      return;
    }
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

  const balanceLine =
    knownBalance == null ? null : (
      <p className="text-center text-xs text-muted">
        Site balance: ${knownBalance.toFixed(2)}
        {shortfall > 0 ? ` — $${shortfall.toFixed(2)} short of this skin` : ""}
      </p>
    );

  // Not enough on the site balance: card checkout is the only way through, and
  // the balance button stays visibly blocked instead of failing on submit.
  if (state === "insufficient") {
    return (
      <div className="space-y-2">
        <Button
          className="w-full"
          loading={pendingCard}
          disabled={isPending}
          onClick={handleDirectCardPay}
        >
          Pay by card — ${price.toFixed(2)}
        </Button>
        <Button
          variant="secondary"
          className="w-full text-xs"
          disabled
          title="Top up your balance to use it for this skin"
        >
          Balance too low for this skin
        </Button>
        {balanceLine}
        <div className="flex items-center justify-center">
          <Link
            href="/account"
            className="text-xs text-muted underline hover:text-text"
          >
            Top up your balance instead
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
        disabled={isPending || !canPayFromBalance}
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
      {balanceLine}
      {error && <p className="text-center text-xs text-negative">{error}</p>}
    </div>
  );
}
