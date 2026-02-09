import { mustGetEnv, getAllowedOrigins } from "./env";
import { sha256Hex } from "./hash";

export function corsHeadersFor(origin?: string): Record<string, string> {
  const allowlist = getAllowedOrigins();
  const allowOrigin =
    origin && allowlist.length
      ? (allowlist.includes(origin) ? origin : "")
      : "*";

  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, x-creator-key",
  };

  if (allowOrigin) h["Access-Control-Allow-Origin"] = allowOrigin;
  // Only add credentials if we are not using "*" and explicitly allow an origin.
  if (allowOrigin && allowOrigin !== "*") h["Access-Control-Allow-Credentials"] = "true";
  return h;
}

export function getRequestIp(req: any): string | undefined {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  const xr = req.headers?.["x-real-ip"];
  if (typeof xr === "string" && xr.length) return xr.trim();
  const cf = req.headers?.["cf-connecting-ip"];
  if (typeof cf === "string" && cf.length) return cf.trim();
  return undefined;
}

export function getUserAgent(req: any): string {
  const ua = req.headers?.["user-agent"];
  return typeof ua === "string" ? ua : "";
}

export function computeIpHash(req: any): string {
  const salt = mustGetEnv("IP_HASH_SALT");
  const ip = getRequestIp(req) || "unknown";
  return sha256Hex(`${salt}|ip|${ip}`);
}

export function computeUserAgentHash(req: any): string {
  const salt = mustGetEnv("IP_HASH_SALT");
  const ua = getUserAgent(req) || "unknown";
  return sha256Hex(`${salt}|ua|${ua}`);
}

export function readBearerToken(req: any): string | null {
  const h = req.headers?.authorization;
  if (typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function readCreatorKey(req: any): string | null {
  const k = req.headers?.["x-creator-key"];
  if (typeof k === "string" && k.trim()) return k.trim();
  return null;
}

