import { describe, expect, it } from "vitest";

import { isSihStatus, mapSihStatus } from "./status";

describe("mapSihStatus", () => {
  it("maps every SIH status to our order status", () => {
    expect(mapSihStatus("created")).toBe("processing");
    expect(mapSihStatus("processing")).toBe("processing");
    expect(mapSihStatus("sent")).toBe("sent");
    expect(mapSihStatus("finished")).toBe("finished");
    expect(mapSihStatus("failed")).toBe("failed");
    expect(mapSihStatus("penalized")).toBe("failed");
  });

  it("returns null for unknown statuses", () => {
    expect(mapSihStatus("bogus")).toBeNull();
  });
});

describe("isSihStatus", () => {
  it("recognizes valid statuses", () => {
    expect(isSihStatus("sent")).toBe(true);
    expect(isSihStatus("nope")).toBe(false);
  });
});
