import { describe, expect, it } from "vitest";

import { buildAuthUrl, steamIdFromClaimedId } from "./steam";

describe("buildAuthUrl", () => {
  it("targets Steam OpenID with identifier_select", () => {
    const url = new URL(
      buildAuthUrl("https://floatline.gg/api/auth/steam/callback", "https://floatline.gg"),
    );
    expect(url.origin + url.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(url.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(url.searchParams.get("openid.return_to")).toBe(
      "https://floatline.gg/api/auth/steam/callback",
    );
    expect(url.searchParams.get("openid.realm")).toBe("https://floatline.gg");
    expect(url.searchParams.get("openid.identity")).toBe(
      "http://specs.openid.net/auth/2.0/identifier_select",
    );
  });
});

describe("steamIdFromClaimedId", () => {
  it("extracts a 17-digit SteamID64", () => {
    expect(
      steamIdFromClaimedId("https://steamcommunity.com/openid/id/76561198000000000"),
    ).toBe("76561198000000000");
  });

  it("rejects malformed or foreign claimed ids", () => {
    expect(steamIdFromClaimedId(null)).toBeNull();
    expect(steamIdFromClaimedId("https://evil.com/openid/id/76561198000000000")).toBeNull();
    expect(steamIdFromClaimedId("https://steamcommunity.com/openid/id/123")).toBeNull();
    expect(steamIdFromClaimedId("not a url")).toBeNull();
  });
});
