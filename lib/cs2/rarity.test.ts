import { describe, expect, it } from "vitest";

import { rarityFromColor, resolveRarity } from "./rarity";

describe("rarityFromColor", () => {
  it("maps canonical Valve colors (case/# insensitive)", () => {
    expect(rarityFromColor("#EB4B4B")).toBe("covert");
    expect(rarityFromColor("4b69ff")).toBe("milspec");
    expect(rarityFromColor(" #b0c3d9 ")).toBe("consumer");
    expect(rarityFromColor("E4AE39")).toBe("contraband");
  });

  it("returns null for unknown or missing colors", () => {
    expect(rarityFromColor("#123456")).toBeNull();
    expect(rarityFromColor(null)).toBeNull();
    expect(rarityFromColor(undefined)).toBeNull();
  });
});

describe("resolveRarity", () => {
  it("forces knives and gloves to the special tier", () => {
    expect(resolveRarity(null, "knife")).toBe("contraband");
    expect(resolveRarity("#5E98D9", "gloves")).toBe("contraband");
  });

  it("uses the color for regular weapons", () => {
    expect(resolveRarity("#5E98D9", "rifle")).toBe("industrial");
    expect(resolveRarity(null, "rifle")).toBeNull();
  });
});
