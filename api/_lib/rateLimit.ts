import { supabaseAdmin } from "./supabase";

type Limits = {
  perHour: number;
  perDay: number;
  perWeek: number;
};

const LIMITS: Record<string, Limits> = {
  auth_register: { perHour: 20, perDay: 80, perWeek: 200 },
  poll_create: { perHour: 20, perDay: 100, perWeek: 300 },
  poll_image_upload: { perHour: 40, perDay: 200, perWeek: 600 },
  poll_respond: { perHour: 120, perDay: 400, perWeek: 1200 },
  comment_create: { perHour: 40, perDay: 200, perWeek: 600 },
  ticket_create: { perHour: 10, perDay: 30, perWeek: 80 },
  poll_view: { perHour: 600, perDay: 5000, perWeek: 20000 },
};

function since(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function countEvents(params: { eventType: string; userId?: string | null; ipHash?: string | null; sinceIso: string }) {
  const sb = supabaseAdmin();
  let q = sb
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", params.eventType)
    .gte("created_at", params.sinceIso);

  if (params.userId) q = q.eq("user_id", params.userId);
  else if (params.ipHash) q = q.eq("ip_hash", params.ipHash);
  else q = q.is("ip_hash", null).is("user_id", null);

  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

export async function enforceRateLimit(params: { eventType: string; userId?: string | null; ipHash?: string | null }) {
  const limits = LIMITS[params.eventType];
  if (!limits) return;

  // Prefer user-based limits; fall back to ip-based for anonymous.
  const scopeUserId = params.userId || null;
  const scopeIpHash = scopeUserId ? null : (params.ipHash || null);

  const hourCount = await countEvents({ eventType: params.eventType, userId: scopeUserId, ipHash: scopeIpHash, sinceIso: since(1) });
  if (hourCount >= limits.perHour) {
    const err: any = new Error("RATE_LIMIT_HOURLY");
    err.code = "RATE_LIMIT_HOURLY";
    err.status = 429;
    throw err;
  }

  const dayCount = await countEvents({ eventType: params.eventType, userId: scopeUserId, ipHash: scopeIpHash, sinceIso: since(24) });
  if (dayCount >= limits.perDay) {
    const err: any = new Error("RATE_LIMIT_DAILY");
    err.code = "RATE_LIMIT_DAILY";
    err.status = 429;
    throw err;
  }

  const weekCount = await countEvents({ eventType: params.eventType, userId: scopeUserId, ipHash: scopeIpHash, sinceIso: since(24 * 7) });
  if (weekCount >= limits.perWeek) {
    const err: any = new Error("RATE_LIMIT_WEEKLY");
    err.code = "RATE_LIMIT_WEEKLY";
    err.status = 429;
    throw err;
  }

  const sb = supabaseAdmin();
  const { error } = await sb.from("abuse_events").insert({
    event_type: params.eventType,
    user_id: scopeUserId,
    ip_hash: scopeIpHash,
  });
  if (error) throw error;
}
