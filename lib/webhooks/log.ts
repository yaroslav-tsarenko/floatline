import { db } from "@/lib/db";
import { webhookLogs } from "@/lib/db/schema";

/**
 * Persists an inbound webhook for audit/debugging. Never throws — logging must
 * not block acking a webhook. Header values are captured as-is; upstream
 * callers should not send secrets in the body we store.
 */
export async function logWebhook(input: {
  source: string;
  method: string;
  url: string;
  headers: Headers;
  body: unknown;
}): Promise<void> {
  try {
    const url = new URL(input.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const headers: Record<string, string> = {};
    input.headers.forEach((value, key) => {
      headers[key] = value;
    });

    await db.insert(webhookLogs).values({
      source: input.source,
      method: input.method,
      query,
      headers,
      body: (input.body ?? null) as object,
    });
  } catch (err) {
    console.error("[webhook] failed to persist log", err);
  }
}
