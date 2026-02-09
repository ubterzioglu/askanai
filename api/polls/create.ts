import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../_lib/http";
import { corsHeadersFor, computeIpHash, computeUserAgentHash, readBearerToken } from "../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../_lib/supabase";
import { enforceRateLimit } from "../_lib/rateLimit";
import { randomSlug, sha256Hex } from "../_lib/hash";
import { randomUUID } from "crypto";

type CreatePollBody = {
  title: string;
  description?: string | null;
  questions: Array<{
    type: string;
    prompt: string;
    options: string[];
    isRequired: boolean;
    settingsJson?: Record<string, any>;
  }>;
  settings: {
    visibility: string;
    allowComments: boolean;
    previewImageUrl?: string | null;
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  try {
    const body = (await readJson(req)) as CreatePollBody;
    const title = (body?.title || "").trim();
    const description = (body?.description ?? null) ? String(body.description).trim() : null;
    const questions = Array.isArray(body?.questions) ? body.questions : [];
    const settings = body?.settings || ({} as any);

    if (!title || title.length < 3 || title.length > 140) {
      return json(res, 400, { error: "INVALID_TITLE" }, { ...cors, ...noStoreHeaders() });
    }
    if (description && description.length > 5000) {
      return json(res, 400, { error: "INVALID_DESCRIPTION" }, { ...cors, ...noStoreHeaders() });
    }
    if (questions.length < 1 || questions.length > 25) {
      return json(res, 400, { error: "INVALID_QUESTIONS" }, { ...cors, ...noStoreHeaders() });
    }

    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);
    const uaHash = computeUserAgentHash(req);

    await enforceRateLimit({ eventType: "poll_create", userId, ipHash });

    const sb = supabaseAdmin();

    // Generate unique slug (5 chars, retry)
    let slug = randomSlug(5);
    for (let i = 0; i < 10; i++) {
      const { data: existing, error } = await sb.from("polls").select("id").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!existing) break;
      slug = randomSlug(5);
    }

    const creatorKey = randomUUID();
    const creatorKeyHash = sha256Hex(creatorKey);

    const { data: poll, error: pollErr } = await sb
      .from("polls")
      .insert({
        slug,
        title,
        description,
        status: "open",
        creator_key_hash: creatorKeyHash,
        created_by_user_id: userId,
        visibility_mode: settings.visibility || "public",
        allow_comments: !!settings.allowComments,
        preview_image_url: settings.previewImageUrl || null,
      })
      .select(
        "id, slug, title, description, status, open_until, close_after_responses, visibility_mode, allow_comments, preview_image_url, created_at, updated_at"
      )
      .single();

    if (pollErr || !poll) throw pollErr;

    // Create questions/options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const prompt = (q?.prompt || "").trim();
      if (!prompt || prompt.length < 1 || prompt.length > 500) continue;

      const { data: question, error: qErr } = await sb
        .from("questions")
        .insert({
          poll_id: poll.id,
          position: i,
          type: q.type,
          prompt,
          is_required: !!q.isRequired,
          settings_json: q.settingsJson || null,
        })
        .select("id, type")
        .single();

      if (qErr || !question) throw qErr;

      const isChoice = ["single_choice", "multiple_choice", "ranking"].includes(String(question.type));
      const opts = Array.isArray(q.options) ? q.options : [];
      if (isChoice && opts.length) {
        const rows = opts
          .map((label, idx) => ({ question_id: question.id, position: idx, label: String(label).trim() }))
          .filter((r) => r.label.length > 0 && r.label.length <= 140);
        if (rows.length) {
          const { error: oErr } = await sb.from("options").insert(rows);
          if (oErr) throw oErr;
        }
      }
    }

    // Record a server-side event (useful for abuse investigations).
    await sb.from("abuse_events").insert({ event_type: "poll_create_ok", user_id: userId, ip_hash: ipHash });

    return json(
      res,
      200,
      {
        poll,
        creatorKey, // plaintext key returned once; client stores it
        meta: { ipHash: undefined, uaHash: undefined },
      },
      { ...cors, ...noStoreHeaders() }
    );
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}
