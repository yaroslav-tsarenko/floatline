import { describe, expect, it } from "vitest";

import { isProtectionRollback, reconcileOrder } from "./reconcile";

describe("isProtectionRollback", () => {
  it("is false for absent or empty protection", () => {
    expect(isProtectionRollback(null)).toBe(false);
    expect(isProtectionRollback(undefined)).toBe(false);
    expect(isProtectionRollback({})).toBe(false);
    expect(isProtectionRollback({ status: "ok" })).toBe(false);
  });

  it("triggers on a positive rollback amount", () => {
    expect(isProtectionRollback({ rollbackAmount: 12.5 })).toBe(true);
    expect(isProtectionRollback({ rollbackAmount: 0 })).toBe(false);
  });

  it("triggers on a rollback timestamp", () => {
    expect(isProtectionRollback({ rollbackAt: "2026-07-30T00:00:00Z" })).toBe(true);
    expect(isProtectionRollback({ rollbackAt: "" })).toBe(false);
  });

  it("triggers on explicit rollback status strings", () => {
    expect(isProtectionRollback({ status: "rolled_back" })).toBe(true);
    expect(isProtectionRollback({ status: "PENALIZED" })).toBe(true);
    expect(isProtectionRollback({ status: "failed" })).toBe(true);
  });
});

describe("reconcileOrder", () => {
  it("advances to processing/sent without a refund", () => {
    expect(reconcileOrder({ currentStatus: "submitted", sih: { status: "processing" } }))
      .toMatchObject({ nextStatus: "processing", refund: false });
    expect(reconcileOrder({ currentStatus: "processing", sih: { status: "sent" } }))
      .toMatchObject({ nextStatus: "sent", refund: false });
  });

  it("allows SIH to move sent back to processing", () => {
    expect(reconcileOrder({ currentStatus: "sent", sih: { status: "processing" } }))
      .toMatchObject({ nextStatus: "processing", refund: false });
  });

  it("refunds on failed and penalized", () => {
    expect(reconcileOrder({ currentStatus: "sent", sih: { status: "failed", error: "no stock" } }))
      .toMatchObject({ nextStatus: "refunded", refund: true, note: "no stock" });
    expect(reconcileOrder({ currentStatus: "processing", sih: { status: "penalized" } }))
      .toMatchObject({ nextStatus: "refunded", refund: true });
  });

  it("finishes a clean delivery without a refund", () => {
    expect(reconcileOrder({ currentStatus: "sent", sih: { status: "finished" } }))
      .toMatchObject({ nextStatus: "finished", refund: false });
  });

  it("rolls back a delivered order when protection reverses it", () => {
    expect(
      reconcileOrder({
        currentStatus: "finished",
        sih: { status: "finished", protection: { rollbackAmount: 9.99 } },
      }),
    ).toMatchObject({ nextStatus: "rolled_back", refund: true });
  });

  it("never re-processes a terminal order", () => {
    expect(reconcileOrder({ currentStatus: "refunded", sih: { status: "processing" } }))
      .toMatchObject({ nextStatus: "refunded", refund: false });
    expect(reconcileOrder({ currentStatus: "rolled_back", sih: { status: "finished" } }))
      .toMatchObject({ nextStatus: "rolled_back", refund: false });
  });

  it("holds status on an unrecognized SIH status", () => {
    expect(reconcileOrder({ currentStatus: "processing", sih: { status: "weird" } }))
      .toMatchObject({ nextStatus: "processing", refund: false });
  });
});
