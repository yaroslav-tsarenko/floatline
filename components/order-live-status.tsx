"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 4_000;
// Stop after ~15 minutes of watching; by then the order is either done or
// stuck, and reopening the page starts a fresh watch.
const MAX_POLLS = Math.round((15 * 60_000) / POLL_MS);

/**
 * Keeps an in-flight order page live: polls the owner-scoped status endpoint
 * (which reconciles against SIH) and refreshes the server-rendered page as soon
 * as the status changes, so "trade offer sent" and "delivered" appear without a
 * manual reload.
 */
export function OrderLiveStatus({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [watching, setWatching] = useState(true);
  const polls = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;

          if (data.status && data.status !== status) {
            router.refresh();
            return;
          }
          if (data.open === false) {
            setWatching(false);
            router.refresh();
            return;
          }
        }
      } catch {
        // Offline or a transient failure — just try again on the next tick.
      }

      polls.current += 1;
      if (polls.current >= MAX_POLLS) {
        setWatching(false);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };

    timer = setTimeout(tick, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, status, router]);

  if (!watching) {
    return (
      <button
        type="button"
        onClick={() => router.refresh()}
        className="text-xs text-muted underline hover:text-text"
      >
        Refresh status
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-1.5 animate-pulse rounded-full bg-signal" aria-hidden />
      Live — this page updates itself
    </span>
  );
}
