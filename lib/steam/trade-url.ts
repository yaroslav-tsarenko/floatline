// A Steam trade URL looks like:
//   https://steamcommunity.com/tradeoffer/new/?partner=123456&token=AbCdEfGh
// SIH needs the `token`; we keep the full URL for display and the token for
// order submission.

export interface ParsedTradeUrl {
  partner: string;
  token: string;
}

export function parseTradeUrl(input: string): ParsedTradeUrl | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.hostname !== "steamcommunity.com") return null;
  if (!url.pathname.startsWith("/tradeoffer/new")) return null;

  const partner = url.searchParams.get("partner");
  const token = url.searchParams.get("token");
  if (!partner || !token) return null;
  if (!/^\d+$/.test(partner)) return null;

  return { partner, token };
}
