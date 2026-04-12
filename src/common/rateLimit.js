// @ts-check

import { kv } from "@vercel/kv";

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
const RATE_LIMIT_WINDOW_MINUTES = parseInt(
  process.env.RATE_LIMIT_WINDOW_MINUTES || "15",
  10,
);
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
const WHITELIST_IPS = process.env.WHITELIST_IPS?.split(",") || [];

// Fallback in-memory store for local development when KV is not configured
const rateLimitStore = new Map();

/**
 * Get client IP address from request.
 *
 * @param {any} req - Express request object.
 * @returns {string} Client IP address.
 */
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "unknown"
  );
};

/**
 * Check if IP is whitelisted.
 *
 * @param {string} ip - Client IP address.
 * @returns {boolean} True if whitelisted.
 */
const isWhitelisted = (ip) => {
  return WHITELIST_IPS.some((whitelistedIp) => {
    if (whitelistedIp === "*") {
      return true;
    }
    if (whitelistedIp.includes("/")) {
      // CIDR notation support would go here
      return ip === whitelistedIp;
    }
    return ip === whitelistedIp;
  });
};

/**
 * Get rate limit info for a client from KV.
 *
 * @param {string} ip - Client IP address.
 * @returns {Promise<{count: number, resetTime: number}>} Rate limit info.
 */
const getRateLimitInfo = async (ip) => {
  // Fallback to in-memory store if KV is not configured
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    const data = rateLimitStore.get(ip);
    if (!data) {
      return {
        count: 0,
        resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
      };
    }
    return data;
  }

  const key = `ratelimit:${ip}`;
  const data = await kv.get(key);

  if (!data) {
    return {
      count: 0,
      resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
    };
  }

  return JSON.parse(data);
};

/**
 * Update rate limit for a client in KV.
 *
 * @param {string} ip - Client IP address.
 * @param {{count: number, resetTime: number}} info - Rate limit info.
 * @returns {Promise<void>} Resolves when the rate limit is updated.
 */
const updateRateLimit = async (ip, info) => {
  // Fallback to in-memory store if KV is not configured
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    rateLimitStore.set(ip, info);
    return;
  }

  const key = `ratelimit:${ip}`;
  await kv.set(key, JSON.stringify(info), { px: RATE_LIMIT_WINDOW_MS });
};

/**
 * Rate limit middleware for Vercel serverless.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
const rateLimit = async (req, res, next) => {
  const clientIp = getClientIp(req);

  // Bypass rate limiting for whitelisted IPs
  if (isWhitelisted(clientIp)) {
    return next();
  }

  try {
    const info = await getRateLimitInfo(clientIp);
    const now = Date.now();

    // Reset if window expired
    if (now > info.resetTime) {
      info.count = 0;
      info.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }

    // Check if rate limit exceeded
    if (info.count >= RATE_LIMIT_MAX) {
      const retryAfter = Math.ceil((info.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", info.resetTime.toString());
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      });
    }

    // Increment counter
    info.count++;
    await updateRateLimit(clientIp, info);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      (RATE_LIMIT_MAX - info.count).toString(),
    );
    res.setHeader("X-RateLimit-Reset", info.resetTime.toString());

    return next();
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request if rate limiting fails
    return next();
  }
};

export { rateLimit };
export default rateLimit;
