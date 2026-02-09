import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, readBearerToken } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "GET") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const sb = supabaseAdmin();
    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);

    let q = sb.from("responses").select("id").eq("poll_id", pollId).limit(1);
    if (userId) q = q.eq("user_id", userId);
    else q = q.eq("ip_hash", ipHash);

    const { data, error } = await q.maybeSingle();
    if (error) throw error;

    return json(res, 200, { hasVoted: !!data }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

