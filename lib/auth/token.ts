import { createHmac, timingSafeEqual } from "node:crypto";

// A session token is `base64url(payload).base64url(hmac)`, where payload is
// `{ uid, iat }` JSON and the hmac is HMAC-SHA256 over the payload segment.
// Stateless and tamper-evident: no DB round-trip to validate a request.

export interface SessionPayload {
  uid: string;
  /** Issued-at, unix seconds. */
  iat: number;
}

const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadSegment: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadSegment).digest("base64url");
}

export function signSession(payload: SessionPayload, secret: string): string {
  const segment = b64url(JSON.stringify(payload));
  return `${segment}.${sign(segment, secret)}`;
}

export function createToken(uid: string, secret: string, now = Date.now()): string {
  return signSession({ uid, iat: Math.floor(now / 1000) }, secret);
}

/**
 * Verifies a token's signature and (optional) age. Returns the payload on
 * success or null on any failure — bad format, wrong signature, or expiry.
 * Comparison is timing-safe.
 */
export function verifyToken(
  token: string | undefined | null,
  secret: string,
  opts: { maxAgeSec?: number; now?: number } = {},
): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const segment = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(segment, secret);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.uid !== "string" || typeof payload?.iat !== "number") {
    return null;
  }

  const maxAge = opts.maxAgeSec ?? DEFAULT_MAX_AGE_SEC;
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (payload.iat > now + 60 || now - payload.iat > maxAge) return null;

  return payload;
}

export { DEFAULT_MAX_AGE_SEC };
