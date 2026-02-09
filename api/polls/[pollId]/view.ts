import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, computeUserAgentHash, readBearerToken } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { enforceRateLimit } from "../../_lib/rateLimit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const uaHash = computeUserAgentHash(req);

    await enforceRateLimit({ eventType: "poll_view", userId, ipHash });

    const sb = supabaseAdmin();
    const { error } = await sb.from("poll_views").insert({
      poll_id: pollId,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      fingerprint: null,
    });

    if (error && (error as any).code !== "23505") throw error;

    return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

