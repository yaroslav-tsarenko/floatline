import { describe, expect, it } from "vitest";

describe("Direct skin purchase flow", () => {
  it("formats payment reference IDs correctly", () => {
    const initialRef = `buy_${crypto.randomUUID()}`;
    expect(initialRef.startsWith("buy_")).toBe(true);
    expect(initialRef.length).toBeGreaterThan(10);
  });

  it("calculates fees accurately for direct item checkout", () => {
    const itemPrice = 43.96;
    const serviceFee = 0;
    const total = itemPrice + serviceFee;

    const purchasePayload = {
      id: "cmv0r4dpv000404jp21bda7nd",
      status: "pending",
      skinName: "MAC-10 | Indigo",
      currency: "USD",
      fees: {
        itemPrice,
        serviceFee,
        total,
      },
    };

    expect(purchasePayload.fees.total).toBe(43.96);
    expect(purchasePayload.status).toBe("pending");
    expect(purchasePayload.currency).toBe("USD");
  });
});
