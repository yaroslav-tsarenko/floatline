import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  formatTransfermitPhone,
  getTransfermitApiKey,
  getTransfermitWebhookSecret,
  verifyTransfermitWebhookSignature,
} from "./transfermit";

describe("formatTransfermitPhone", () => {
  it("strips '+' and reformats into country and number with a space", () => {
    expect(formatTransfermitPhone("+44 7412 839910")).toBe("44 7412839910");
    expect(formatTransfermitPhone("447412839910")).toBe("44 7412839910");
    expect(formatTransfermitPhone("+1 555 123 4567")).toBe("15 551234567");
    expect(formatTransfermitPhone("37120000000")).toBe("37 120000000");
  });

  it("returns undefined for empty, null, or short values", () => {
    expect(formatTransfermitPhone(null)).toBeUndefined();
    expect(formatTransfermitPhone(undefined)).toBeUndefined();
    expect(formatTransfermitPhone("")).toBeUndefined();
    expect(formatTransfermitPhone("   ")).toBeUndefined();
    expect(formatTransfermitPhone("123")).toBeUndefined();
  });
});

describe("verifyTransfermitWebhookSignature", () => {
  const testSecret = "whsec_test_secret_12345";
  const testPayload = JSON.stringify({
    id: "pmt_4f9a8b1c-7e3d",
    paymentType: "DEPOSIT",
    state: "COMPLETED",
    referenceId: "topup_cmtx12345678",
    amount: 50.0,
    currency: "USD",
  });

  function signPayload(body: string, secret: string): string {
    return createHmac("sha256", secret).update(body, "utf8").digest("hex");
  }

  it("accepts valid HMAC-SHA256 signature", () => {
    const sig = signPayload(testPayload, testSecret);
    expect(
      verifyTransfermitWebhookSignature(testPayload, sig, testSecret),
    ).toBe(true);
  });

  it("accepts signature with sha256= prefix", () => {
    const sig = signPayload(testPayload, testSecret);
    expect(
      verifyTransfermitWebhookSignature(
        testPayload,
        `sha256=${sig}`,
        testSecret,
      ),
    ).toBe(true);
  });

  it("rejects invalid or tampered signatures", () => {
    const sig = signPayload(testPayload, testSecret);
    expect(
      verifyTransfermitWebhookSignature(
        testPayload + " ",
        sig,
        testSecret,
      ),
    ).toBe(false);
    expect(
      verifyTransfermitWebhookSignature(
        testPayload,
        "invalid_signature_hex",
        testSecret,
      ),
    ).toBe(false);
    expect(
      verifyTransfermitWebhookSignature(
        testPayload,
        signPayload(testPayload, "wrong_secret"),
        testSecret,
      ),
    ).toBe(false);
  });

  it("rejects missing signature", () => {
    expect(
      verifyTransfermitWebhookSignature(testPayload, null, testSecret),
    ).toBe(false);
    expect(
      verifyTransfermitWebhookSignature(testPayload, undefined, testSecret),
    ).toBe(false);
    expect(
      verifyTransfermitWebhookSignature(testPayload, "", testSecret),
    ).toBe(false);
  });
});
