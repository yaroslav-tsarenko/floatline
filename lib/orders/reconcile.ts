import { mapSihStatus, type OrderStatus } from "@/lib/sih/status";

export interface ProtectionView {
  status?: string | null;
  error?: string | null;
  rollbackAt?: string | number | null;
  rollbackAmount?: number | null;
}

export interface ReconcileInput {
  currentStatus: OrderStatus;
  sih: {
    status: string;
    error?: string | null;
    protection?: ProtectionView | null;
  };
}

export interface ReconcilePlan {
  nextStatus: OrderStatus;
  /** Whether the buyer must be refunded as part of this transition. */
  refund: boolean;
  note: string;
}

// Fully terminal states — never re-processed. Note `finished` is deliberately
// NOT here: buyer protection can still roll a delivered order back afterwards.
const TERMINAL = new Set<OrderStatus>(["refunded", "rolled_back"]);

/**
 * Detects a buyer-protection rollback. Keyed on the unambiguous structured
 * signals SIH sends when it reverses a delivery (a rollback timestamp or a
 * positive rollback amount); a small set of explicit status strings is treated
 * as a fallback. Kept deliberately narrow so we never refund on noise.
 */
export function isProtectionRollback(p?: ProtectionView | null): boolean {
  if (!p) return false;
  if (p.rollbackAmount != null && Number(p.rollbackAmount) > 0) return true;
  if (p.rollbackAt != null && p.rollbackAt !== "") return true;
  const s = (p.status ?? "").toLowerCase();
  return s === "rollback" || s === "rolled_back" || s === "penalized" || s === "failed";
}

/**
 * Pure decision for how an order should transition given the latest SIH view.
 * Returns the next internal status and whether a refund is owed. Applying the
 * plan (DB write + ledger refund) is the caller's job; refunds go through the
 * idempotent ledger, so re-running a plan can never double-refund.
 */
export function reconcileOrder(input: ReconcileInput): ReconcilePlan {
  const { currentStatus, sih } = input;

  if (TERMINAL.has(currentStatus)) {
    return { nextStatus: currentStatus, refund: false, note: "already terminal" };
  }

  const mapped = mapSihStatus(sih.status);
  if (mapped === null) {
    return {
      nextStatus: currentStatus,
      refund: false,
      note: `unknown sih status: ${sih.status}`,
    };
  }

  if (mapped === "failed") {
    return {
      nextStatus: "refunded",
      refund: true,
      note: sih.error ?? "sih reported failure",
    };
  }

  if (mapped === "finished") {
    if (isProtectionRollback(sih.protection)) {
      return {
        nextStatus: "rolled_back",
        refund: true,
        note: sih.protection?.error ?? "buyer protection rollback",
      };
    }
    return { nextStatus: "finished", refund: false, note: "delivered" };
  }

  // processing / sent — SIH may legitimately move `sent` back to `processing`.
  return { nextStatus: mapped, refund: false, note: sih.status };
}
