import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../_lib/http";
import { corsHeadersFor, computeIpHash, readBearerToken } from "../_lib/security";
import { supabaseAdmin, getUserIdFromToken } from "../_lib/supabase";
import { enforceRateLimit } from "../_lib/rateLimit";
import { sha256Hex } from "../_lib/hash";
import { randomUUID } from "crypto";

type Body = {
  contentType: string;
  fileName?: string;
};

function extFromContentType(ct: string): string | null {
  const m = ct.toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });

  try {
    const body = (await readJson(req)) as Body;
    const contentType = String(body?.contentType || "").trim();
    const ext = extFromContentType(contentType);
    if (!ext) return json(res, 400, { error: "UNSUPPORTED_FILE_TYPE" }, { ...cors, ...noStoreHeaders() });

    const token = readBearerToken(req);
    const userId = token ? await getUserIdFromToken(token) : null;
    const ipHash = computeIpHash(req);

    // Separate rate limit bucket for uploads.
    await enforceRateLimit({ eventType: "poll_image_upload", userId, ipHash });

    const sb = supabaseAdmin();

    const fileId = randomUUID();
    const path = `previews/${fileId}.${ext}`;

    const { data, error } = await sb.storage.from("poll-images").createSignedUploadUrl(path);
    if (error) throw error;

    const { data: pub } = sb.storage.from("poll-images").getPublicUrl(path);

    // Record intent (optional; helps debugging abuse)
    await sb.from("abuse_events").insert({ event_type: "poll_image_upload_signed", user_id: userId, ip_hash: ipHash });

    return json(
      res,
      200,
      {
        path,
        token: (data as any)?.token,
        signedUrl: (data as any)?.signedUrl,
        publicUrl: pub.publicUrl,
        key: sha256Hex(`${path}`), // non-sensitive correlation id
      },
      { ...cors, ...noStoreHeaders() }
    );
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}
