import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, isPreflight, readJson, readOrigin, noStoreHeaders } from "../_lib/http";
import { corsHeadersFor, computeIpHash } from "../_lib/security";
import { supabaseAdmin } from "../_lib/supabase";
import { sendAccountCreatedEmails } from "../_lib/mailer";
import { enforceRateLimit } from "../_lib/rateLimit";

type RegisterBody = {
  email?: string;
  password?: string;
};

function normalizeEmail(value?: string): string {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = readOrigin(req);
  const cors = corsHeadersFor(origin);

  if (isPreflight(req)) return json(res, 200, { ok: true }, { ...cors, ...noStoreHeaders() });
  if ((req.method || "").toUpperCase() !== "POST") {
    return json(res, 405, { error: "METHOD_NOT_ALLOWED" }, { ...cors, ...noStoreHeaders() });
  }

  try {
    const body = (await readJson(req)) as RegisterBody;
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");

    if (!isValidEmail(email)) {
      return json(res, 400, { error: "INVALID_EMAIL" }, { ...cors, ...noStoreHeaders() });
    }
    if (password.length < 6 || password.length > 128) {
      return json(res, 400, { error: "INVALID_PASSWORD" }, { ...cors, ...noStoreHeaders() });
    }

    const ipHash = computeIpHash(req);
    await enforceRateLimit({ eventType: "auth_register", ipHash });

    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const m = String(error.message || "").toLowerCase();
      if (m.includes("already") || m.includes("registered") || (error as any).status === 422) {
        return json(res, 409, { error: "ALREADY_REGISTERED" }, { ...cors, ...noStoreHeaders() });
      }
      throw error;
    }

    let mailSent = false;
    try {
      mailSent = await sendAccountCreatedEmails({ userEmail: email, plainPassword: password });
    } catch {
      mailSent = false;
    }

    return json(
      res,
      200,
      {
        ok: true,
        mailSent,
        user: {
          id: data.user?.id || null,
          email: data.user?.email || email,
        },
      },
      { ...cors, ...noStoreHeaders() }
    );
  } catch (e: any) {
    const status = e?.status || 500;
    const code = e?.code || "INTERNAL_ERROR";
    return json(res, status, { error: code }, { ...cors, ...noStoreHeaders() });
  }
}
