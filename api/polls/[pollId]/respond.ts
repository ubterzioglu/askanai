import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, computeUserAgentHash, readBearerToken } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { enforceRateLimit } from "../../_lib/rateLimit";

type RespondBody = {
  respondentName?: string;
  answers: Record<string, any>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  const pollId = String((req.query as any)?.pollId || "").trim();
  if (!pollId) return json(res, 400, { error: "INVALID_POLL_ID" }, { ...cors, ...noStoreHeaders() });

  try {
    const body = (await readJson(req)) as RespondBody;
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : null;
    if (!answers) return json(res, 400, { error: "INVALID_ANSWERS" }, { ...cors, ...noStoreHeaders() });

    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const uaHash = computeUserAgentHash(req);

    await enforceRateLimit({ eventType: "poll_respond", userId, ipHash });

    const sb = supabaseAdmin();

    // Ensure poll is open
    const { data: poll, error: pollErr } = await sb.from("polls").select("id, status").eq("id", pollId).single();
    if (pollErr) throw pollErr;
    if (!poll || poll.status !== "open") return json(res, 403, { error: "POLL_CLOSED" }, { ...cors, ...noStoreHeaders() });

    // Insert response (dedupe by unique indexes)
    const { data: response, error: rErr } = await sb
      .from("responses")
      .insert({
        poll_id: pollId,
        respondent_name: body?.respondentName ? String(body.respondentName).slice(0, 100) : null,
        user_id: userId,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
      })
      .select("id, poll_id, respondent_name, created_at")
      .single();

    if (rErr) {
      // Unique violation => already voted.
      if ((rErr as any).code === "23505") return json(res, 409, { error: "ALREADY_VOTED" }, { ...cors, ...noStoreHeaders() });
      throw rErr;
    }

    // Insert answers
    const answerRows = Object.entries(answers).map(([questionId, value]) => {
      const row: any = { response_id: response.id, question_id: questionId };
      if (typeof value === "string") row.value_text = value;
      else if (typeof value === "number") row.value_number = value;
      else row.value_json = value;
      return row;
    });

    if (answerRows.length) {
      const { error: aErr } = await sb.from("answers").insert(answerRows);
      if (aErr) throw aErr;
    }

    return json(res, 200, { success: true, response }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

