import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { hmacSignature, safeEqual, verifyHmac } from "./verify";

const SECRET = "test-webhook-secret";
const BODY = '{"event":"payment.paid","id":"pay_123","amount":"50.00"}';

function sign(body: string, enc: "hex" | "base64" = "hex"): string {
  return createHmac("sha256", SECRET).update(body, "utf8").digest(enc);
}

describe("safeEqual", () => {
  it("matches equal strings and rejects others", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});

describe("hmacSignature", () => {
  it("computes a stable hex digest", () => {
    expect(hmacSignature(BODY, SECRET)).toBe(sign(BODY));
  });

  it("supports base64 encoding", () => {
    expect(hmacSignature(BODY, SECRET, "base64")).toBe(sign(BODY, "base64"));
  });
});

describe("verifyHmac", () => {
  it("accepts a correct hex signature", () => {
    expect(verifyHmac(BODY, sign(BODY), SECRET)).toBe(true);
  });

  it("accepts a correct base64 signature", () => {
    expect(verifyHmac(BODY, sign(BODY, "base64"), SECRET, "base64")).toBe(true);
  });

  it("preserves trailing base64 padding", () => {
    const b64 = sign(BODY, "base64");
    // Sanity: many HMAC base64 digests end with padding; verifier must not strip it.
    expect(verifyHmac(BODY, b64, SECRET, "base64")).toBe(true);
  });

  it("strips a leading scheme prefix", () => {
    expect(verifyHmac(BODY, `sha256=${sign(BODY)}`, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyHmac(BODY + " ", sign(BODY), SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const bad = createHmac("sha256", "other").update(BODY).digest("hex");
    expect(verifyHmac(BODY, bad, SECRET)).toBe(false);
  });

  it("rejects missing signatures", () => {
    expect(verifyHmac(BODY, null, SECRET)).toBe(false);
    expect(verifyHmac(BODY, undefined, SECRET)).toBe(false);
    expect(verifyHmac(BODY, "", SECRET)).toBe(false);
  });
});
