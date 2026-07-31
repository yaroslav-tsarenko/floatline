// Our internal order lifecycle (mirrors the DB `order_status` enum).
export type OrderStatus =
  | "created"
  | "submitted"
  | "processing"
  | "sent"
  | "finished"
  | "failed"
  | "refunded"
  | "rolled_back";

// Statuses SIH reports for an order.
export type SihStatus =
  | "created"
  | "processing"
  | "sent"
  | "finished"
  | "failed"
  | "penalized";

export const SIH_STATUSES: readonly SihStatus[] = [
  "created",
  "processing",
  "sent",
  "finished",
  "failed",
  "penalized",
] as const;

const SIH_TO_ORDER: Record<SihStatus, OrderStatus> = {
  created: "processing",
  processing: "processing",
  sent: "sent",
  finished: "finished",
  failed: "failed",
  penalized: "failed",
};

export function isSihStatus(value: string): value is SihStatus {
  return (SIH_STATUSES as readonly string[]).includes(value);
}

export function mapSihStatus(sihStatus: string): OrderStatus | null {
  return isSihStatus(sihStatus) ? SIH_TO_ORDER[sihStatus] : null;
}

// Terminal states from the user's/business perspective. Note that `finished`
// is NOT terminal on its own — protection must also finish (handled in
// syncOrder). Transitions are intentionally not one-directional: SIH may move
// an order from `sent` back to `processing` when it re-buys a bailed item.
export const NON_TERMINAL_SIH: readonly SihStatus[] = [
  "created",
  "processing",
  "sent",
] as const;
