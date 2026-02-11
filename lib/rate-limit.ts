/**
 * In-memory rate limit for the public submit endpoint.
 * Limits by identifier (e.g. IP). Resets after windowMs.
 * Note: In serverless, state is per-instance; for strict limits use Vercel/Edge or external store.
 */

const windowMs = 60 * 1000; // 1 minute
const maxPerWindow = 20;

const hits = new Map<string, number[]>();

function prune(keys: number[], now: number): number[] {
  return keys.filter((t) => now - t < windowMs);
}

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const times = hits.get(identifier) ?? [];
  const recent = prune(times, now);
  if (recent.length >= maxPerWindow) return false;
  recent.push(now);
  hits.set(identifier, recent);
  return true;
}
