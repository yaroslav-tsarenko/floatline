"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { buyItem } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";

export type BuyState = "guest" | "no_trade" | "insufficient" | "ready";

export function BuyButton({
  marketHashName,
  price,
  state,
}: {
  marketHashName: string;
  price: number;
  state: BuyState;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (state === "guest") {
    return (
      <a
        href="/api/auth/steam"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
      >
        Sign in with Steam to buy
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
      <Link
        href="/account"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
      >
        Top up balance to buy
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await buyItem(marketHashName, price.toFixed(2));
            // A successful buy redirects, so we only get here on failure.
            if (res && !res.ok) setError(res.error);
          });
        }}
      >
        Buy for ${price.toFixed(2)}
      </Button>
      {error && <p className="text-center text-xs text-negative">{error}</p>}
    </div>
  );
}
