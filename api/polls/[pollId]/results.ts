import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readOrigin, noStoreHeaders } from "../../_lib/http";
import { corsHeadersFor, computeIpHash, readBearerToken, readCreatorKey } from "../../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../../_lib/supabase";
import { sha256Hex } from "../../_lib/hash";

type AnswerRow = {
  question_id: string;
  value_text: string | null;
  value_number: number | null;
  value_json: any;
};

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
    const creatorKey = readCreatorKey(req);

    const { data: poll, error: pollErr } = await sb
      .from("polls")
      .select("id, status, visibility_mode, creator_key_hash, created_by_user_id")
      .eq("id", pollId)
      .single();
    if (pollErr) throw pollErr;
    if (!poll) return json(res, 404, { error: "NOT_FOUND" }, { ...cors, ...noStoreHeaders() });

    const isAdmin = userId
      ? (await sb.rpc("has_role", { _user_id: userId, _role: "admin" })).data === true
      : false;
    const isOwnerUser = !!(userId && poll.created_by_user_id && userId === poll.created_by_user_id);
    const isOwnerKey = !!(creatorKey && poll.creator_key_hash && sha256Hex(creatorKey) === poll.creator_key_hash);
    const isOwner = isOwnerUser || isOwnerKey || isAdmin;

    // Hide drafts unless owner/admin.
    if (poll.status === "draft" && !isOwner) return json(res, 404, { error: "NOT_FOUND" }, { ...cors, ...noStoreHeaders() });

    // Visibility gating
    if (poll.visibility_mode === "private" && !isOwner) {
      return json(res, 404, { error: "NOT_FOUND" }, { ...cors, ...noStoreHeaders() });
    }

    if (poll.visibility_mode === "voters" && !isOwner) {
      // Give-to-get: must have responded (user-based if logged in, else ip-based).
      let q = sb.from("responses").select("id").eq("poll_id", pollId).limit(1);
      if (userId) q = q.eq("user_id", userId);
      else q = q.eq("ip_hash", ipHash);
      const { data: responded, error: respErr } = await q.maybeSingle();
      if (respErr) throw respErr;
      if (!responded) return json(res, 403, { error: "GIVE_TO_GET_REQUIRED" }, { ...cors, ...noStoreHeaders() });
    }

    // Fetch questions + options (needed for deterministic ordering and labels)
    const { data: questions, error: qErr } = await sb
      .from("questions")
      .select("id, type, settings_json, options (label, position)")
      .eq("poll_id", pollId)
      .order("position", { ascending: true });
    if (qErr) throw qErr;

    const { count: responseCount, error: countErr } = await sb
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("poll_id", pollId);
    if (countErr) throw countErr;

    // Fetch all answers for this poll without leaking response ids.
    const { data: answers, error: aErr } = await sb
      .from("answers")
      .select("question_id, value_text, value_number, value_json, responses!inner(poll_id)")
      .eq("responses.poll_id", pollId);
    if (aErr) throw aErr;

    const flatAnswers: AnswerRow[] = (answers || []).map((r: any) => ({
      question_id: r.question_id,
      value_text: r.value_text ?? null,
      value_number: r.value_number ?? null,
      value_json: r.value_json ?? null,
    }));

    const resultsByQuestionId: Record<string, any> = {};

    for (const q of questions || []) {
      const qid = q.id as string;
      const qType = String(q.type);
      const qAnswers = flatAnswers.filter((a) => a.question_id === qid);
      const options = Array.isArray((q as any).options) ? (q as any).options : [];
      const optionLabels = options
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((o: any) => String(o.label));

      if (qType === "single_choice" || qType === "multiple_choice") {
        const counts: Record<string, number> = {};
        for (const lbl of optionLabels) counts[lbl] = 0;

        for (const a of qAnswers) {
          if (a.value_text && counts[a.value_text] !== undefined) counts[a.value_text] += 1;
          if (Array.isArray(a.value_json)) {
            for (const v of a.value_json) {
              const s = String(v);
              if (counts[s] !== undefined) counts[s] += 1;
            }
          }
        }

        const total = Math.max(1, Object.values(counts).reduce((x, y) => x + y, 0));
        resultsByQuestionId[qid] = optionLabels.map((label) => ({
          label,
          count: counts[label] || 0,
          percent: Math.round(((counts[label] || 0) / total) * 100),
        }));
        continue;
      }

      if (qType === "rating") {
        const scale = (q as any)?.settings_json?.scale || 5;
        const values = qAnswers.map((a) => a.value_number).filter((v) => typeof v === "number") as number[];
        const avg = values.length ? values.reduce((x, y) => x + y, 0) / values.length : 0;
        const distribution = Array(scale).fill(0);
        for (const v of values) {
          if (v >= 1 && v <= scale) distribution[v - 1] += 1;
        }
        const total = Math.max(1, values.length);
        resultsByQuestionId[qid] = {
          average: avg.toFixed(1),
          scale,
          distribution: distribution.map((d) => Math.round((d / total) * 100)),
        };
        continue;
      }

      if (qType === "nps") {
        const values = qAnswers.map((a) => a.value_number).filter((v) => typeof v === "number") as number[];
        const total = Math.max(1, values.length);
        const detractors = values.filter((v) => v <= 6).length;
        const passives = values.filter((v) => v >= 7 && v <= 8).length;
        const promoters = values.filter((v) => v >= 9).length;
        const nps = Math.round(((promoters - detractors) / total) * 100);
        resultsByQuestionId[qid] = {
          npsScore: nps,
          detractors: Math.round((detractors / total) * 100),
          passives: Math.round((passives / total) * 100),
          promoters: Math.round((promoters / total) * 100),
        };
        continue;
      }

      if (qType === "emoji") {
        const emojis = (q as any)?.settings_json?.emojis || ["😍", "😊", "😐", "😕", "😢"];
        const counts: Record<string, number> = {};
        for (const e of emojis) counts[String(e)] = 0;
        for (const a of qAnswers) {
          if (a.value_text && counts[a.value_text] !== undefined) counts[a.value_text] += 1;
        }
        const total = Math.max(1, Object.values(counts).reduce((x, y) => x + y, 0));
        resultsByQuestionId[qid] = emojis.map((emoji: any) => ({
          emoji: String(emoji),
          count: counts[String(emoji)] || 0,
          percent: Math.round(((counts[String(emoji)] || 0) / total) * 100),
        }));
        continue;
      }

      // short_text / ranking: keep empty aggregates (UI currently doesn't render)
      resultsByQuestionId[qid] = null;
    }

    return json(res, 200, { responseCount: responseCount || 0, resultsByQuestionId }, { ...cors, ...noStoreHeaders() });
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}

