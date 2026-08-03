/**
 * Minimal in-memory sliding-window rate limiter.
 * Defense-in-depth for public endpoints (VULN-05 signup abuse).
 * Per-instance cap is acceptable on serverless; swap for Upstash Redis /
 * Vercel KV with the same interface if a globally consistent limit is needed.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  key: string,
  max = MAX_ATTEMPTS,
  windowMs = WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const window = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (window.length >= max) {
    hits.set(key, window);
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((windowMs - (now - window[0])) / 1000)
      ),
    };
  }

  window.push(now);
  hits.set(key, window);

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (hits.size > 10_000) {
    for (const [k, arr] of hits) {
      if (arr.length === 0 || now - arr[arr.length - 1] >= windowMs) {
        hits.delete(k);
      }
    }
  }

  return { ok: true };
}
