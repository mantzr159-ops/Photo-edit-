import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit } from "./rate-limit";
import type { AIErrorBody } from "./schema";

export function aiError(status: number, body: AIErrorBody) {
  return NextResponse.json(body, { status });
}

/**
 * Shared protection for AI endpoints:
 *  - cloud mode: requires an authenticated Supabase user
 *  - all modes: per-user / per-IP rate limiting
 *  - body size limit
 */
export async function guardAIRequest(req: NextRequest, bucket: string, opts: { maxBytes?: number; limit?: number } = {}) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > (opts.maxBytes ?? 64_000)) return { error: aiError(413, { error: "Request too large", code: "invalid" }) };
  let key = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  if (isSupabaseConfigured) {
    const sb = await getSupabaseServer();
    const { data } = (await sb?.auth.getUser()) ?? { data: { user: null } };
    if (!data.user) return { error: aiError(401, { error: "Sign in to use AI features.", code: "unauthorized" }) };
    key = data.user.id;
  }
  const rl = rateLimit(`${bucket}:${key}`, opts.limit);
  if (!rl.ok) {
    const res = aiError(429, { error: `Too many requests. Try again in ${rl.retryAfter}s.`, code: "rate_limited" });
    res.headers.set("Retry-After", String(rl.retryAfter));
    return { error: res };
  }
  return { key };
}
