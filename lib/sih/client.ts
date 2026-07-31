import { env } from "@/lib/env";

import { SihApiError, SihError, SihHttpError } from "./errors";
import {
  createOrderResponseSchema,
  itemsResponseSchema,
  minItemSchema,
  orderSchema,
  ordersResponseSchema,
  projectSchema,
  walletHistorySchema,
  type SihItemsResponse,
  type SihMinItem,
  type SihOrder,
  type SihProject,
} from "./schemas";

const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

type Query = Record<string, string | number | boolean | undefined>;

interface RawResult {
  status: number;
  json: unknown;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(env.SIH_API_BASE + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest(
  method: "GET" | "POST",
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<RawResult> {
  const url = buildUrl(path, opts.query);
  const retryable = method === "GET";
  let lastError: unknown;

  for (let attempt = 0; attempt <= (retryable ? MAX_RETRIES : 0); attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          apikey: env.SIH_API_KEY,
          accept: "application/json",
          ...(opts.body ? { "content-type": "application/json" } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      if (retryable && res.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new SihHttpError(res.status, `SIH ${res.status}`);
        await backoff(attempt);
        continue;
      }

      const text = await res.text();
      let json: unknown = undefined;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = text;
        }
      }
      return { status: res.status, json };
    } catch (err) {
      lastError = err;
      if (retryable && attempt < MAX_RETRIES) {
        await backoff(attempt);
        continue;
      }
      throw new SihError(`SIH request failed: ${method} ${path}`, err);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new SihError(`SIH request failed: ${method} ${path}`, lastError);
}

function backoff(attempt: number): Promise<void> {
  const ms = 250 * 2 ** attempt;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(path: string, query?: Query): Promise<unknown> {
  const { status, json } = await rawRequest("GET", path, { query });
  if (status >= 400) {
    throw new SihHttpError(status, `SIH GET ${path} -> ${status}`, json);
  }
  return json;
}

// --- Public API ----------------------------------------------------------

export interface CreateOrderInput {
  steamId: string;
  token: string;
  amount: number;
  item: string;
  customId: string;
  test?: boolean;
}

export type CreateOrderResult =
  | {
      ok: true;
      conflict: boolean;
      id: string | null;
      balance: number | null;
      order: SihOrder | null;
    }
  | { ok: false; error: string };

export const sih = {
  async getProject(): Promise<SihProject> {
    return projectSchema.parse(await getJson("/project"));
  },

  /** Sets the webhook URL. Passing no url unsets it. Note: this is a GET. */
  async setWebhook(url?: string): Promise<SihProject> {
    return projectSchema.parse(
      await getJson("/set-webhook", url ? { url } : undefined),
    );
  },

  async getItems(
    opts: { appId?: number; extended?: boolean } = {},
  ): Promise<SihItemsResponse> {
    const json = await getJson("/get-items", {
      appId: opts.appId ?? env.SIH_APP_ID,
      extended: opts.extended ?? true,
    });
    return itemsResponseSchema.parse(json);
  },

  async getMinItem(item: string, appId?: number): Promise<SihMinItem> {
    return minItemSchema.parse(
      await getJson("/get-min-item", { item, appId: appId ?? env.SIH_APP_ID }),
    );
  },

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const { status, json } = await rawRequest("POST", "/create-order", {
      body: {
        steamId: input.steamId,
        token: input.token,
        amount: input.amount,
        item: input.item,
        customId: input.customId,
        test: input.test ?? env.SIH_TEST_MODE,
        appId: env.SIH_APP_ID,
      },
    });

    const parsed = createOrderResponseSchema.parse(json ?? {});

    // 409 = custom id already exists -> treat as success, adopt existing order.
    if (status === 409) {
      return {
        ok: true,
        conflict: true,
        id: parsed.order?.id != null ? String(parsed.order.id) : null,
        balance: parsed.balance ?? null,
        order: parsed.order ?? null,
      };
    }

    if (status >= 200 && status < 300 && parsed.success !== false) {
      return {
        ok: true,
        conflict: false,
        id: parsed.id != null ? String(parsed.id) : null,
        balance: parsed.balance ?? null,
        order: parsed.order ?? null,
      };
    }

    return { ok: false, error: parsed.error ?? `SIH create-order ${status}` };
  },

  async getOrder(
    ref: { id: string } | { customId: string },
  ): Promise<SihOrder> {
    const query = "id" in ref ? { id: ref.id } : { customId: ref.customId };
    return orderSchema.parse(await getJson("/get-order", query));
  },

  async getOrders(refs: {
    ids?: string[];
    customIds?: string[];
  }): Promise<SihOrder[]> {
    const { status, json } = await rawRequest("POST", "/get-orders", {
      body: { ids: refs.ids ?? [], customIds: refs.customIds ?? [] },
    });
    if (status >= 400) {
      throw new SihHttpError(status, `SIH get-orders -> ${status}`, json);
    }
    const parsed = ordersResponseSchema.parse(json ?? []);
    return Array.isArray(parsed) ? parsed : Object.values(parsed);
  },

  async getWalletHistory(
    opts: { walletTypeId?: number; typeIds?: number[] } = {},
  ): Promise<unknown> {
    const json = await getJson("/wallet/history", {
      walletTypeId: opts.walletTypeId ?? 1,
      typeIds: (opts.typeIds ?? [1, 2, 5, 12]).join(","),
    });
    return walletHistorySchema.parse(json);
  },
};

export { SihApiError, SihError, SihHttpError };
