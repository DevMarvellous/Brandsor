type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitRecord>();

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  req: Request,
  routeKey: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const clientKey = getClientKey(req);
  const key = `${routeKey}:${clientKey}`;
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, remaining: Math.max(0, maxRequests - current.count) };
}

/** Clears in-memory counters (for tests only). */
export function resetRateLimitsForTests() {
  if (process.env.NODE_ENV === "test") {
    store.clear();
  }
}
