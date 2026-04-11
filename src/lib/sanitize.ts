/**
 * Input sanitization utilities for security
 * Prevents XSS, SQL injection, and other input-based attacks
 */

/**
 * Sanitize string input - removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  return (
    input
      .slice(0, maxLength)
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script-like patterns
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      // Escape HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim()
  );
}

/**
 * Sanitize search query - alphanumeric, spaces, and common punctuation only
 */
export function sanitizeSearchQuery(query: string, maxLength = 200): string {
  if (typeof query !== "string") return "";

  return query
    .slice(0, maxLength)
    .replace(/[^\w\s\-.,!?']/g, "")
    .trim();
}

/**
 * Sanitize ID - alphanumeric and hyphens only
 */
export function sanitizeId(id: string, maxLength = 100): string {
  if (typeof id !== "string") return "";

  return id
    .slice(0, maxLength)
    .replace(/[^\w-]/g, "")
    .trim();
}

/**
 * Sanitize URL - validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== "string") return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // Block javascript: URLs that might bypass protocol check
    if (url.toLowerCase().includes("javascript:")) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== "string") return null;

  const sanitized = email.toLowerCase().trim().slice(0, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize integer - ensures valid integer within range
 */
export function sanitizeInt(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  defaultValue = 0,
): number {
  const num = Number(value);

  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(
  arr: unknown,
  maxItems = 100,
  maxItemLength = 200,
): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeString(item, maxItemLength))
    .filter((item) => item.length > 0);
}

/**
 * Validate and sanitize JSON body from request
 */
export async function sanitizeRequestBody<T>(
  request: Request,
  maxSize = 100 * 1024, // 100KB default
): Promise<T | null> {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxSize) {
      return null;
    }

    const text = await request.text();
    if (text.length > maxSize) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Rate limit check (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 100,
  windowMs = 60000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
