import { z } from "zod";

const boolFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

const csv = z
  .string()
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const schema = z.object({
  DATABASE_URL: z.string().min(1),

  SIH_API_KEY: z.string().min(1),
  SIH_API_BASE: z.url().default("https://api.sih.market/api/v1"),
  SIH_APP_ID: z.coerce.number().int().positive().default(730),
  SIH_WEBHOOK_SECRET: z.string().min(1),
  SIH_TEST_MODE: boolFromString.default(true),
  SIH_MARGIN: z.coerce.number().min(0).default(0.07),
  SIH_MIN_MARGIN_ABS: z.coerce.number().min(0).default(0.1),
  SIH_PRICE_TOLERANCE: z.coerce.number().min(0).default(0.03),
  SIH_MAX_ITEM_PRICE: z.coerce.number().positive().default(20000),
  SIH_LOW_BALANCE_THRESHOLD: z.coerce.number().min(0).default(200),
  SIH_SYNC_INTERVAL_MIN: z.coerce.number().int().positive().default(7),

  PAYMENT_PROVIDER: z
    .enum(["crypto", "spoynt", "transfermit"])
    .default("crypto"),
  PAYMENT_API_KEY: z.string().min(1),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),

  FX_API_URL: z.url().default("https://api.frankfurter.app"),
  FX_BASE: z.string().default("USD"),
  FX_QUOTES: csv.default(["EUR", "GBP"]),

  SESSION_SECRET: z.string().min(1),
  STEAM_API_KEY: z.string().optional(),
  ADMIN_STEAM_IDS: csv.default([]),

  CRON_SECRET: z.string().min(1),
  CRON_IN_PROCESS: boolFromString.default(false),
  APP_URL: z.url().default("https://floatline.gg"),

  ALERT_TELEGRAM_BOT_TOKEN: z.string().optional(),
  ALERT_TELEGRAM_CHAT_ID: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const lines = Object.entries(flat.fieldErrors)
      .map(([key, errs]) => `  ${key}: ${(errs ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${lines}`);
  }
  return parsed.data;
}

export const env = loadEnv();
