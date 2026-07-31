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

export const itemsResponseSchema = z.record(z.string(), itemValueSchema);
export type SihItemsResponse = z.infer<typeof itemsResponseSchema>;

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
