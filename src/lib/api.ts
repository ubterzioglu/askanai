import { supabase } from "@/integrations/supabase/client";

export type ApiError = Error & { status?: number; code?: string };

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token || null;
}

export async function apiJson<T>(
  path: string,
  opts: { method?: string; body?: any; includeAuth?: boolean; extraHeaders?: Record<string, string> } = {}
): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.extraHeaders || {}),
  };

  if (opts.includeAuth !== false) {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(opts.body ?? {}),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err: ApiError = new Error(payload?.error || `HTTP_${res.status}`) as any;
    err.status = res.status;
    err.code = payload?.error;
    throw err;
  }

  return payload as T;
}

