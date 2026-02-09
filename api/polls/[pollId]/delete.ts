import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, readBearerToken, readCreatorKey } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { sha256Hex } from "../../_lib/hash";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "DELETE") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const sb = supabaseAdmin();
    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const creatorKey = readCreatorKey(req);
    const creatorKeyHash = creatorKey ? sha256Hex(creatorKey) : null;

    const { data: poll, error: pollErr } = await sb
      .from("polls")
      .select("id, created_by_user_id, creator_key_hash")
      .eq("id", pollId)
      .single();
    if (pollErr) throw pollErr;
    if (!poll) return json(res, 404, { error: "NOT_FOUND" }, { ...cors, ...noStoreHeaders() });

    const isAdmin = userId
      ? (await sb.rpc("has_role", { _user_id: userId, _role: "admin" })).data === true
      : false;

    const isOwnerUser = !!(userId && poll.created_by_user_id && userId === poll.created_by_user_id);
    const isOwnerKey = !!(creatorKeyHash && poll.creator_key_hash && creatorKeyHash === poll.creator_key_hash);

    if (!(isAdmin || isOwnerUser || isOwnerKey)) {
      return json(res, 403, { error: "FORBIDDEN" }, { ...cors, ...noStoreHeaders() });
    }

    const { data: ok, error: archErr } = await sb.rpc("archive_poll", {
      _poll_id: pollId,
      _actor_user_id: userId,
      _creator_key_hash: creatorKeyHash,
      _actor_ip_hash: ipHash,
      _reason: "user_delete",
    });
    if (archErr) throw archErr;
    if (!ok) return json(res, 403, { error: "FORBIDDEN" }, { ...cors, ...noStoreHeaders() });

    return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

