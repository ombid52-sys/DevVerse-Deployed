interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

export interface RateLimitOptions {
  windowMs: number; // Duration of window in milliseconds
  maxRequests: number; // Max requests allowed per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, maxRequests: 10 }
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
