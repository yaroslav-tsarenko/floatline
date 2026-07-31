import { describe, expect, it } from "vitest";

import { computeSellPrice, isSellable, round2 } from "./pricing";

const opts = { margin: 0.07, minMarginAbs: 0.1 };

describe("computeSellPrice", () => {
  it("applies the relative margin when it dominates", () => {
    expect(computeSellPrice(10, opts)).toBe(10.7);
    expect(computeSellPrice(100, opts)).toBe(107);
  });

  it("falls back to the absolute minimum margin on cheap items", () => {
    // relative 0.535 < absolute 0.6
    expect(computeSellPrice(0.5, opts)).toBe(0.6);
  });

  it("rounds to cents", () => {
    expect(computeSellPrice(3.33, opts)).toBe(3.56); // 3.33 * 1.07 = 3.5631
  });
});

describe("round2", () => {
  it("rounds half up at the cent", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.344)).toBe(2.34);
  });
});

describe("isSellable", () => {
  it("requires stock, positive cost, and price cap", () => {
    expect(isSellable(10, 2, { maxItemPrice: 30 })).toBe(true);
    expect(isSellable(40, 2, { maxItemPrice: 30 })).toBe(false);
    expect(isSellable(10, 0, { maxItemPrice: 30 })).toBe(false);
    expect(isSellable(0, 2, { maxItemPrice: 30 })).toBe(false);
  });
});
