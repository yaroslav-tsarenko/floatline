import { describe, expect, it } from "vitest";

import { parseTradeUrl } from "./trade-url";

describe("parseTradeUrl", () => {
  it("parses a valid trade URL", () => {
    expect(
      parseTradeUrl(
        "https://steamcommunity.com/tradeoffer/new/?partner=123456&token=AbCdEfGh",
      ),
    ).toEqual({ partner: "123456", token: "AbCdEfGh" });
  });

  it("trims surrounding whitespace", () => {
    expect(
      parseTradeUrl("  https://steamcommunity.com/tradeoffer/new/?partner=1&token=x  "),
    ).toEqual({ partner: "1", token: "x" });
  });

  it("rejects foreign hosts and wrong paths", () => {
    expect(parseTradeUrl("https://evil.com/tradeoffer/new/?partner=1&token=x")).toBeNull();
    expect(parseTradeUrl("https://steamcommunity.com/id/foo?partner=1&token=x")).toBeNull();
  });

  it("rejects missing partner or token", () => {
    expect(parseTradeUrl("https://steamcommunity.com/tradeoffer/new/?partner=1")).toBeNull();
    expect(parseTradeUrl("https://steamcommunity.com/tradeoffer/new/?token=x")).toBeNull();
  });

  it("rejects non-numeric partner and garbage input", () => {
    expect(parseTradeUrl("https://steamcommunity.com/tradeoffer/new/?partner=abc&token=x")).toBeNull();
    expect(parseTradeUrl("not a url")).toBeNull();
    expect(parseTradeUrl("")).toBeNull();
  });
});
