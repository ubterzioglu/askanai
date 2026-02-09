export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export function json(res: any, status: number, body: any, extraHeaders?: Record<string, string>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }
  res.end(JSON.stringify(body));
}

export function noStoreHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
  };
}

export function readOrigin(req: any): string | undefined {
  const o = req.headers?.origin;
  if (typeof o === "string" && o.length) return o;
  return undefined;
}

export function isPreflight(req: any): boolean {
  return (req.method || "").toUpperCase() === "OPTIONS";
}

export async function readJson(req: any): Promise<any> {
  // Vercel may pre-parse body depending on runtime; support both.
  if (req.body && typeof req.body === "object") return req.body;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve());
    req.on("error", (e: any) => reject(e));
  });
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

