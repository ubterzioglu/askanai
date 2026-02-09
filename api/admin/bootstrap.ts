import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../_lib/http";
import { corsHeadersFor, readBearerToken } from "../_lib/security";
import { supabaseAdmin } from "../_lib/supabase";

function parseCsv(s: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!s) return out;
  for (const part of s.split(",")) {
    const v = part.trim().toLowerCase();
    if (v) out.add(v);
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const allowed = parseCsv(process.env.BOOTSTRAP_ADMIN_EMAILS);
  if (!allowed.size) return json(res, 404, { error: "NOT_FOUND" }, { ...cors, ...noStoreHeaders() });

  const token = readBearerToken(req);
  if (!token) return json(res, 401, { error: "UNAUTHORIZED" }, { ...cors, ...noStoreHeaders() });

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return json(res, 401, { error: "UNAUTHORIZED" }, { ...cors, ...noStoreHeaders() });

    const email = (data.user.email || "").toLowerCase();
    if (!email || !allowed.has(email)) return json(res, 403, { error: "FORBIDDEN" }, { ...cors, ...noStoreHeaders() });

    const userId = data.user.id;
    const { error: insErr } = await sb.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );
    if (insErr) throw insErr;

    return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

