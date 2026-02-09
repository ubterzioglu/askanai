import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor } from "../../_lib/security";
import { supabaseAdmin } from "../../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "GET") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const sb = supabaseAdmin();
    const { count, error } = await sb.from("poll_views").select("id", { count: "exact", head: true }).eq("poll_id", pollId);
    if (error) throw error;
    return json(res, 200, { viewCount: count || 0 }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

