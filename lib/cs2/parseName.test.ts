import { describe, expect, it } from "vitest";

import { parseName } from "./parseName";

describe("parseName", () => {
  it("parses a StatTrak rifle with wear", () => {
    expect(parseName("StatTrak™ AK-47 | Redline (Field-Tested)")).toEqual({
      weapon: "AK-47",
      skinName: "Redline",
      exterior: "FT",
      isStattrak: true,
      isSouvenir: false,
      isStar: false,
      category: "rifle",
      phase: null,
    });
  });

  it("parses a ★ knife", () => {
    expect(parseName("★ Karambit | Doppler (Factory New)")).toEqual({
      weapon: "Karambit",
      skinName: "Doppler",
      exterior: "FN",
      isStattrak: false,
      isSouvenir: false,
      isStar: true,
      category: "knife",
      phase: null,
    });
  });

  it("parses a Souvenir sniper (folded into rifle)", () => {
    expect(parseName("Souvenir AWP | Dragon Lore (Field-Tested)")).toEqual({
      weapon: "AWP",
      skinName: "Dragon Lore",
      exterior: "FT",
      isStattrak: false,
      isSouvenir: true,
      isStar: false,
      category: "rifle",
      phase: null,
    });
  });

  it("parses a sticker", () => {
    expect(parseName("Sticker | Titan (Holo) | Katowice 2014")).toEqual({
      weapon: null,
      skinName: "Titan",
      exterior: null,
      isStattrak: false,
      isSouvenir: false,
      isStar: false,
      category: "sticker",
      phase: null,
    });
  });

  it("parses a vanilla ★ knife with no skin", () => {
    const p = parseName("★ Bayonet");
    expect(p.weapon).toBe("Bayonet");
    expect(p.skinName).toBeNull();
    expect(p.category).toBe("knife");
    expect(p.isStar).toBe(true);
  });

  it("detects a Doppler phase inside the skin name", () => {
    expect(parseName("★ Karambit | Doppler (Phase 2) (Factory New)").phase).toBe(
      "Phase 2",
    );
  });

  it("parses ★ StatTrak gloves", () => {
    const p = parseName("★ StatTrak™ Sport Gloves | Pandora's Box (Minimal Wear)");
    expect(p.category).toBe("gloves");
    expect(p.isStar).toBe(true);
    expect(p.isStattrak).toBe(true);
    expect(p.weapon).toBe("Sport Gloves");
    expect(p.exterior).toBe("MW");
  });
});
