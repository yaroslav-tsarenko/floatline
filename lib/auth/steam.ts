// Steam sign-in uses OpenID 2.0. We never see a password: we bounce the user to
// Steam, which redirects back with signed params we validate by echoing them
// back to Steam with `openid.mode=check_authentication`. No API key required.

import { env } from "@/lib/env";

const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const STEAM_IDENTIFIER = "https://steamcommunity.com/openid/id/";
const CLAIMED_ID_RE =
  /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

/** Builds the URL to send the user to for Steam login. */
export function buildAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID}?${params.toString()}`;
}

/** Extracts the 64-bit SteamID from a validated claimed_id, or null. */
export function steamIdFromClaimedId(claimedId: string | null): string | null {
  if (!claimedId) return null;
  const m = CLAIMED_ID_RE.exec(claimedId);
  return m ? m[1] : null;
}

/**
 * Verifies an OpenID callback by re-posting the returned params to Steam with
 * `check_authentication`. Returns the SteamID64 on success, or null. This is
 * the security-critical step — it defeats forged callbacks.
 */
export async function verifyCallback(
  query: URLSearchParams,
): Promise<string | null> {
  if (query.get("openid.mode") !== "id_res") return null;

  const claimedId = query.get("openid.claimed_id");
  const steamId = steamIdFromClaimedId(claimedId);
  if (!steamId) return null;

  const body = new URLSearchParams(query);
  body.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();

  return /is_valid\s*:\s*true/i.test(text) ? steamId : null;
}

export type SteamProfile = { nickname: string; avatar: string };

/**
 * Fetches the public persona name and avatar for a SteamID64 via the Steam Web
 * API. Requires STEAM_API_KEY; returns null when the key is absent or the call
 * fails, so callers can degrade gracefully (linking still succeeds).
 */
export async function fetchSteamProfile(
  steamId64: string,
): Promise<SteamProfile | null> {
  if (!env.STEAM_API_KEY) return null;

  const url = new URL(
    "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
  );
  url.searchParams.set("key", env.STEAM_API_KEY);
  url.searchParams.set("steamids", steamId64);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (!player) return null;
    return {
      nickname: player.personaname ?? "",
      avatar: player.avatarfull ?? player.avatarmedium ?? "",
    };
  } catch {
    return null;
  }
}

export { STEAM_IDENTIFIER };
