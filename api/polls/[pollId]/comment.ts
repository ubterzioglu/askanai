import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, computeUserAgentHash, readBearerToken } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { enforceRateLimit } from "../../_lib/rateLimit";
import { sha256Hex } from "../../_lib/hash";

type CommentBody = {
  body: string;
  displayName?: string | null;
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
    const body = (await readJson(req)) as CommentBody;
    const text = (body?.body || "").trim();
    const displayName = body?.displayName ? String(body.displayName).trim() : null;

    if (!text || text.length < 1 || text.length > 2000) {
      return json(res, 400, { error: "INVALID_COMMENT" }, { ...cors, ...noStoreHeaders() });
    }
    if (displayName && displayName.length > 100) {
      return json(res, 400, { error: "INVALID_DISPLAY_NAME" }, { ...cors, ...noStoreHeaders() });
    }

    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const uaHash = computeUserAgentHash(req);
    const textHash = sha256Hex(normalizeText(text));

    await enforceRateLimit({ eventType: "comment_create", userId, ipHash });

    const sb = supabaseAdmin();
    const { data: poll, error: pollErr } = await sb.from("polls").select("id, status, allow_comments").eq("id", pollId).single();
    if (pollErr) throw pollErr;
    if (!poll || poll.status !== "open" || poll.allow_comments !== true) {
      return json(res, 403, { error: "COMMENTS_DISABLED" }, { ...cors, ...noStoreHeaders() });
    }

    const { data: comment, error } = await sb
      .from("comments")
      .insert({
        poll_id: pollId,
        body: text,
        display_name: displayName,
        status: "visible",
        user_id: userId,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
        text_hash: textHash,
      })
      .select("id, poll_id, display_name, body, created_at")
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return json(res, 409, { error: "DUPLICATE_COMMENT" }, { ...cors, ...noStoreHeaders() });
      }
      throw error;
    }

    return json(res, 200, { comment }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

