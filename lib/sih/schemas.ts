import { z } from "zod";

// SIH payload shapes are not officially documented, so schemas are tolerant:
// numbers may arrive as strings, unknown keys are preserved, most fields are
// optional. We validate only what we rely on.

const numberish = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
});

export const projectSchema = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    name: z.string().optional(),
    balance: numberish.optional(),
    webhook: z.string().nullish(),
  })
  .loose();
export type SihProject = z.infer<typeof projectSchema>;

// get-items returns an object keyed by market_hash_name.
export const itemValueSchema = z
  .object({
    price: numberish.optional(),
    count: numberish.optional(),
    phase: z.string().nullish(),
    market: z.string().nullish(),
    sell: numberish.optional(),
    steam: numberish.optional(),
    image: z.string().nullish(),
    color: z.string().nullish(),
  })
  .loose();
export type SihItemValue = z.infer<typeof itemValueSchema>;

const itemsMapSchema = z.record(z.string(), itemValueSchema);
export type SihItemsResponse = z.infer<typeof itemsMapSchema>;

// The live API wraps the map in an envelope: `{ success, items }`. Older/bare
// responses may be the map directly. Accept both and always yield the map.
export const itemsResponseSchema = z.union([
  z
    .object({ items: itemsMapSchema })
    .loose()
    .transform((r) => r.items),
  itemsMapSchema,
]);

export const minItemSchema = z
  .object({
    item: z.string().optional(),
    price: numberish.optional(),
    count: numberish.optional(),
    phase: z.string().nullish(),
    market: z.string().nullish(),
  })
  .loose();
export type SihMinItem = z.infer<typeof minItemSchema>;

// get-min-item wraps the value in `{ success, items: { "<name>": {...} } }`.
// Accept that envelope (yielding the requested item's value) or a bare
// min-item object.
export const minItemResponseSchema = z.union([
  z
    .object({ items: z.record(z.string(), minItemSchema) })
    .loose()
    .transform((r) => r.items),
  minItemSchema,
]);

export const protectionSchema = z
  .object({
    status: z.string().nullish(),
    error: z.string().nullish(),
    rollbackAt: z.union([z.string(), z.number()]).nullish(),
    rollbackAmount: numberish.nullish(),
  })
  .loose();

export const senderSchema = z
  .object({
    offerId: z.union([z.string(), z.number()]).nullish(),
    timeout: numberish.nullish(),
    nickname: z.string().nullish(),
    avatar: z.string().nullish(),
  })
  .loose();

export const orderSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullish(),
    customId: z.string().nullish(),
    status: z.string(),
    error: z.string().nullish(),
    sender: senderSchema.nullish(),
    protection: protectionSchema.nullish(),
  })
  .loose();
export type SihOrder = z.infer<typeof orderSchema>;

export const createOrderResponseSchema = z
  .object({
    success: z.boolean().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    balance: numberish.optional(),
    error: z.string().optional(),
    order: orderSchema.optional(),
  })
  .loose();
export type SihCreateOrderResponse = z.infer<typeof createOrderResponseSchema>;

export const ordersResponseSchema = z.union([
  z.array(orderSchema),
  z.record(z.string(), orderSchema),
]);

export const walletHistorySchema = z.unknown();
