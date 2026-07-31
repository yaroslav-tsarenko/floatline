import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Timing-safe string comparison. Returns false on any length mismatch without
 * leaking timing, so it's safe for comparing secrets and signatures.
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export type SignatureEncoding = "hex" | "base64";

/** Computes `HMAC-SHA256(secret, rawBody)` in the given encoding. */
export function hmacSignature(
  rawBody: string,
  secret: string,
  encoding: SignatureEncoding = "hex",
): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest(encoding);
}

// Strips a leading algorithm prefix like `sha256=`. Only removes a prefix at
// the start (not trailing base64 `=` padding), so base64 signatures survive.
const SCHEME_PREFIX = /^(?:sha1|sha256)=/i;

/**
 * Verifies a webhook signature against the raw request body. The provided
 * signature may carry a leading scheme prefix (e.g. `sha256=...`), which is
 * stripped before comparison. Comparison is timing-safe.
 */
export function verifyHmac(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
  encoding: SignatureEncoding = "hex",
): boolean {
  if (!signature) return false;
  const provided = signature.trim().replace(SCHEME_PREFIX, "");
  const expected = hmacSignature(rawBody, secret, encoding);
  return safeEqual(provided, expected);
}
