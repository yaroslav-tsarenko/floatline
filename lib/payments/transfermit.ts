import { env } from "@/lib/env";
import { verifyHmac } from "@/lib/webhooks/verify";

export interface TransfermitCustomer {
  referenceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ip?: string;
}

export interface TransfermitBillingAddress {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  countryCode: string;
  postalCode: string;
  state?: string | null;
}

export interface CreateDepositParams {
  referenceId: string;
  amount: number;
  currency: string;
  customer: {
    userId: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    steamId64?: string | null;
    ip?: string | null;
  };
  billingAddress?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    countryCode?: string | null;
    postalCode?: string | null;
    state?: string | null;
  };
  paymentMethod?: string;
  returnUrl: string;
  webhookUrl?: string;
}

export interface TransfermitDepositResult {
  paymentId: string;
  redirectUrl: string;
  state?: string;
  raw: unknown;
}

export interface TransfermitPaymentDetails {
  id: string;
  paymentType: "DEPOSIT" | "REFUND";
  state:
    | "PENDING"
    | "CHECKOUT"
    | "AWAITING_REDIRECT"
    | "AWAITING_APPROVAL"
    | "AWAITING_RETURN"
    | "COMPLETED"
    | "DECLINED"
    | "ERROR"
    | "CANCELLED"
    | "CHARGEBACK"
    | "PARTIAL_COMPLETE"
    | string;
  referenceId?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  raw: unknown;
}

/**
 * Normalizes phone numbers strictly according to Transfermit specifications:
 * 1. '+' sign is forbidden.
 * 2. Format must be '<country_code> <national_number>' with single space.
 * 3. Returns undefined if empty or too short so the field is safely omitted.
 */
export function formatTransfermitPhone(
  phone?: string | null,
): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits || digits.length < 4) return undefined;
  // Format: first 2 digits as country code, space, remainder as subscriber number
  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
}

/**
 * Returns effective API key for Transfermit requests.
 */
export function getTransfermitApiKey(): string {
  return env.TRANSFERMIT_API_KEY || env.PAYMENT_API_KEY || "";
}

/**
 * Returns effective webhook secret for Transfermit HMAC verification.
 */
export function getTransfermitWebhookSecret(): string {
  return env.TRANSFERMIT_WEBHOOK_SECRET || env.PAYMENT_WEBHOOK_SECRET || "";
}

/**
 * Verifies the HMAC-SHA256 signature from the Transfermit webhook.
 */
export function verifyTransfermitWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secretOverride?: string,
): boolean {
  const secret = secretOverride ?? getTransfermitWebhookSecret();
  if (!secret) return false;
  return verifyHmac(rawBody, signature, secret, "hex");
}

/**
 * Builds the headers required by Transfermit API.
 */
function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getTransfermitApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Floatline-NextJS/1.0.0",
  };
}

/**
 * Initiates a hosted DEPOSIT payment with Transfermit.
 */
export async function createTransfermitDeposit(
  params: CreateDepositParams,
): Promise<TransfermitDepositResult> {
  const endpoint = env.TRANSFERMIT_API_URL || "https://app.transfermit.com/api/v1/payments";

  const customerNameFirst = params.customer.firstName?.trim() || "Customer";
  const customerNameLast = params.customer.lastName?.trim() || "User";
  const customerEmail =
    params.customer.email?.trim() ||
    (params.customer.steamId64
      ? `${params.customer.steamId64}@floatline.gg`
      : `user_${params.customer.userId.slice(0, 8)}@floatline.gg`);

  const phone = formatTransfermitPhone(params.customer.phone);

  const customer: TransfermitCustomer = {
    referenceId: params.customer.userId,
    firstName: customerNameFirst,
    lastName: customerNameLast,
    email: customerEmail,
    ...(phone ? { phone } : {}),
    ...(params.customer.ip ? { ip: params.customer.ip } : {}),
  };

  const countryCode =
    params.billingAddress?.countryCode?.trim().toUpperCase().slice(0, 2) || "GB";

  const billingAddress: TransfermitBillingAddress = {
    addressLine1:
      params.billingAddress?.addressLine1?.trim() || "Dept 6790, 196 High Road",
    addressLine2: params.billingAddress?.addressLine2?.trim() || null,
    city: params.billingAddress?.city?.trim() || "London",
    countryCode,
    postalCode: params.billingAddress?.postalCode?.trim() || "N22 8HH",
    state: params.billingAddress?.state?.trim() || null,
  };

  const webhookUrl =
    params.webhookUrl || `${env.APP_URL}/api/webhooks/transfermit`;

  const payload = {
    paymentType: "DEPOSIT",
    paymentMethod: params.paymentMethod || "BASIC_CARD",
    referenceId: params.referenceId,
    amount: Number(params.amount.toFixed(2)),
    currency: params.currency.toUpperCase(),
    customer,
    billingAddress,
    redirectUrl: params.returnUrl,
    webhookUrl,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Transfermit deposit request failed (${res.status}): ${responseText}`,
    );
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(`Transfermit payment creation failed: ${msg}`);
  }

  const result = json.result || json;
  const paymentId = result.id || json.id;
  const redirectUrl =
    result.redirectUrl ||
    result.url ||
    json.redirectUrl ||
    json.url;

  if (!redirectUrl) {
    throw new Error(
      `Transfermit returned no redirectUrl in response: ${JSON.stringify(json)}`,
    );
  }

  return {
    paymentId: paymentId || params.referenceId,
    redirectUrl,
    state: result.state || json.state,
    raw: json,
  };
}

/**
 * Retrieves payment details from Transfermit by payment ID.
 */
export async function getTransfermitPayment(
  paymentId: string,
): Promise<TransfermitPaymentDetails> {
  const baseUrl = (
    env.TRANSFERMIT_API_URL || "https://app.transfermit.com/api/v1/payments"
  ).replace(/\/+$/, "");
  const url = `${baseUrl}/${encodeURIComponent(paymentId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const responseText = await res.text();
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Transfermit get payment failed (${res.status}): ${responseText}`,
    );
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(`Failed to get Transfermit payment ${paymentId}: ${msg}`);
  }

  const data = json.result || json;
  return {
    id: data.id,
    paymentType: data.paymentType || "DEPOSIT",
    state: data.state || "UNKNOWN",
    referenceId: data.referenceId,
    amount: Number(data.amount),
    currency: data.currency || "USD",
    paymentMethod: data.paymentMethod,
    raw: json,
  };
}

/**
 * Initiates a refund for an existing payment in Transfermit.
 */
export async function refundTransfermitPayment(params: {
  parentPaymentId: string;
  amount: number;
  currency: string;
}): Promise<{ refundId: string; state: string; raw: unknown }> {
  const endpoint = env.TRANSFERMIT_API_URL || "https://app.transfermit.com/api/v1/payments";

  const payload = {
    paymentType: "REFUND",
    parentPaymentId: params.parentPaymentId,
    amount: Number(params.amount.toFixed(2)),
    currency: params.currency.toUpperCase(),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Transfermit refund request failed (${res.status}): ${responseText}`,
    );
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(`Transfermit refund failed: ${msg}`);
  }

  const result = json.result || json;
  return {
    refundId: result.id || json.id,
    state: result.state || json.state || "COMPLETED",
    raw: json,
  };
}
