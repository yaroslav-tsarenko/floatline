import { describe, expect, it } from "vitest";

import { computeNextBalance, fromCents, toCents } from "./amount";

describe("toCents", () => {
  it("parses decimal strings from the DB", () => {
    expect(toCents("0.00")).toBe(0);
    expect(toCents("10.50")).toBe(1050);
    expect(toCents("1234567.89")).toBe(123456789);
  });

  it("parses whole numbers and single-decimal values", () => {
    expect(toCents("100")).toBe(10000);
    expect(toCents("2.5")).toBe(250);
  });

  it("accepts numeric input", () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0)).toBe(0);
  });

  it("rounds a third decimal half-up", () => {
    expect(toCents("1.005")).toBe(101);
    expect(toCents("1.004")).toBe(100);
    expect(toCents("2.999")).toBe(300);
  });

  it("handles negative amounts (debits)", () => {
    expect(toCents("-10.50")).toBe(-1050);
    expect(toCents(-2.5)).toBe(-250);
  });

  it("rejects malformed input", () => {
    expect(() => toCents("abc")).toThrow();
    expect(() => toCents("1.2.3")).toThrow();
    expect(() => toCents("$5")).toThrow();
    expect(() => toCents("")).toThrow();
  });
});

describe("fromCents", () => {
  it("formats to a fixed 2-decimal string", () => {
    expect(fromCents(0)).toBe("0.00");
    expect(fromCents(1050)).toBe("10.50");
    expect(fromCents(5)).toBe("0.05");
    expect(fromCents(100)).toBe("1.00");
  });

  it("formats negatives", () => {
    expect(fromCents(-1050)).toBe("-10.50");
    expect(fromCents(-5)).toBe("-0.05");
  });

  it("rejects non-integer cents", () => {
    expect(() => fromCents(10.5)).toThrow();
  });
});

describe("toCents/fromCents round-trip", () => {
  it("is stable across a range of values", () => {
    for (const v of ["0.00", "0.01", "9.99", "100.00", "9999999999.99"]) {
      expect(fromCents(toCents(v))).toBe(v);
    }
  });
});

describe("computeNextBalance", () => {
  it("credits and debits", () => {
    expect(computeNextBalance(1000, 500)).toBe(1500);
    expect(computeNextBalance(1000, -400)).toBe(600);
    expect(computeNextBalance(1000, -1000)).toBe(0);
  });

  it("throws when a debit would go below zero", () => {
    expect(() => computeNextBalance(1000, -1001)).toThrow(RangeError);
    expect(() => computeNextBalance(0, -1)).toThrow(RangeError);
  });
});
