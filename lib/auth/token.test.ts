import { describe, expect, it } from "vitest";

import { createToken, signSession, verifyToken } from "./token";

const SECRET = "test-session-secret";

describe("token round-trip", () => {
  it("verifies a freshly created token", () => {
    const now = Date.UTC(2026, 6, 30);
    const token = createToken("user-1", SECRET, now);
    const payload = verifyToken(token, SECRET, { now });
    expect(payload).toMatchObject({ uid: "user-1" });
  });
});

describe("verifyToken", () => {
  it("rejects a tampered payload", () => {
    const token = createToken("user-1", SECRET);
    const forged = signSession({ uid: "admin", iat: Math.floor(Date.now() / 1000) }, "wrong");
    // Splice the forged payload segment onto the real signature.
    const bad = forged.split(".")[0] + "." + token.split(".")[1];
    expect(verifyToken(bad, SECRET)).toBeNull();
  });

  it("rejects a wrong secret", () => {
    const token = createToken("user-1", SECRET);
    expect(verifyToken(token, "other-secret")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyToken(undefined, SECRET)).toBeNull();
    expect(verifyToken("", SECRET)).toBeNull();
    expect(verifyToken("nodot", SECRET)).toBeNull();
    expect(verifyToken(".sig", SECRET)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const issued = Date.UTC(2026, 0, 1);
    const token = createToken("user-1", SECRET, issued);
    const later = issued + 31 * 24 * 60 * 60 * 1000;
    expect(verifyToken(token, SECRET, { now: later })).toBeNull();
  });

  it("accepts tokens within max age", () => {
    const issued = Date.UTC(2026, 0, 1);
    const token = createToken("user-1", SECRET, issued);
    const later = issued + 29 * 24 * 60 * 60 * 1000;
    expect(verifyToken(token, SECRET, { now: later })).toMatchObject({ uid: "user-1" });
  });

  it("rejects tokens issued in the future", () => {
    const now = Date.UTC(2026, 0, 1);
    const token = createToken("user-1", SECRET, now + 10 * 60 * 1000);
    expect(verifyToken(token, SECRET, { now })).toBeNull();
  });
});
