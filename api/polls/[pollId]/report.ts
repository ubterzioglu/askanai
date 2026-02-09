import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, computeUserAgentHash, readBearerToken } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { enforceRateLimit } from "../../_lib/rateLimit";
import { sha256Hex } from "../../_lib/hash";

type ReportBody = {
  type: string;
  message?: string | null;
  commentId?: string | null;
};

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const body = (await readJson(req)) as ReportBody;
    const type = String(body?.type || "").trim();
    const message = body?.message ? String(body.message).trim() : null;
    const commentId = body?.commentId ? String(body.commentId).trim() : null;

    if (!type || type.length > 64) return json(res, 400, { error: "INVALID_TYPE" }, { ...cors, ...noStoreHeaders() });
    if (message && message.length > 5000) return json(res, 400, { error: "INVALID_MESSAGE" }, { ...cors, ...noStoreHeaders() });

    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const uaHash = computeUserAgentHash(req);
    const textHash = sha256Hex(normalizeText(`${type}|${message || ""}|${commentId || ""}`));

    await enforceRateLimit({ eventType: "ticket_create", userId, ipHash });

    const sb = supabaseAdmin();
    const { error } = await sb.from("tickets").insert({
      poll_id: pollId,
      comment_id: commentId,
      type,
      message,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      text_hash: textHash,
    });
    if (error) {
      if ((error as any).code === "23505") return json(res, 409, { error: "DUPLICATE_REPORT" }, { ...cors, ...noStoreHeaders() });
      throw error;
    }

    return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

