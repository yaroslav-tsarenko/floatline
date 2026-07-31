import { env } from "@/lib/env";

/**
 * Sends an alert to Telegram. No-ops (and logs) when alerting isn't
 * configured, so callers can always fire alerts without guarding.
 */
export async function alert(message: string): Promise<void> {
  const token = env.ALERT_TELEGRAM_BOT_TOKEN;
  const chatId = env.ALERT_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(`[alert] ${message}`);
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    console.error("[alert] failed to send Telegram alert", err);
  }
}
