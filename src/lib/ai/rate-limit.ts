import "server-only";
/**
 * Sliding-window rate limiter (in-memory, per server instance).
 * For multi-instance production deployments, back this with Redis/Upstash;
 * the interface stays the same.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20), windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  }
  return { ok: true as const, remaining: limit - list.length };
}
