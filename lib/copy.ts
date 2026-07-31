// Single source of repeated user-facing strings. UI text lives inline in
// components; only strings tied to backend states (order status, SIH errors)
// are centralized here so the wording stays consistent everywhere.

import type { OrderStatus } from "@/lib/sih/status";

export const ORDER_STATUS_COPY: Record<OrderStatus, string> = {
  created: "Preparing your order",
  submitted: "Placing your order",
  processing: "Finding your item",
  sent: "Trade sent — accept it in Steam",
  finished: "Delivered",
  failed: "Couldn't complete — you've been refunded",
  refunded: "Refunded to your balance",
  rolled_back: "Trade was rolled back — you've been refunded",
};

// SIH error codes mapped to actionable, human explanations.
export const SIH_ERROR_COPY: Record<string, string> = {
  "invalid tradelink":
    "This trade link isn't valid. Refresh it in your Steam privacy settings and paste it again.",
  "private inventory":
    "Your Steam inventory is private. Set it to public so the seller can send the trade.",
  "steam guard is not enabled":
    "Steam Guard mobile authenticator must be enabled on your account to receive trades.",
  "steam trade ban":
    "This Steam account has a trade ban and can't receive items right now.",
  "steam guard is in hold":
    "Steam Guard is in a trade hold. New trades are delayed by Steam for a few days.",
};

export function sihErrorToCopy(error: string | null | undefined): string {
  if (!error) return "Something needs your attention on this order.";
  return (
    SIH_ERROR_COPY[error.trim().toLowerCase()] ??
    "We couldn't complete this order. Your balance has been refunded."
  );
}
