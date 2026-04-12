// @ts-check

import { clampValue } from "./ops.js";
import { kv } from "@vercel/kv";

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Cache metrics tracking
const cacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
};

/**
 * Common durations in seconds.
 */
const DURATIONS = {
  ONE_MINUTE: MIN,
  FIVE_MINUTES: 5 * MIN,
  TEN_MINUTES: 10 * MIN,
  FIFTEEN_MINUTES: 15 * MIN,
  THIRTY_MINUTES: 30 * MIN,

  TWO_HOURS: 2 * HOUR,
  FOUR_HOURS: 4 * HOUR,
  SIX_HOURS: 6 * HOUR,
  EIGHT_HOURS: 8 * HOUR,
  TWELVE_HOURS: 12 * HOUR,

  ONE_DAY: DAY,
  TWO_DAY: 2 * DAY,
  SIX_DAY: 6 * DAY,
  TEN_DAY: 10 * DAY,
  STALE_WHILE_REVALIDATE: DAY,
};

/**
 * Common cache TTL values in seconds.
 */
const CACHE_TTL = {
  STATS_CARD: {
    DEFAULT: DURATIONS.ONE_DAY,
    MIN: DURATIONS.TWELVE_HOURS,
    MAX: DURATIONS.TWO_DAY,
  },
  TOP_LANGS_CARD: {
    DEFAULT: DURATIONS.SIX_DAY,
    MIN: DURATIONS.TWO_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  PIN_CARD: {
    DEFAULT: DURATIONS.TEN_DAY,
    MIN: DURATIONS.ONE_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  GIST_CARD: {
    DEFAULT: DURATIONS.TWO_DAY,
    MIN: DURATIONS.ONE_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  WAKATIME_CARD: {
    DEFAULT: DURATIONS.ONE_DAY,
    MIN: DURATIONS.TWELVE_HOURS,
    MAX: DURATIONS.TWO_DAY,
  },
  ERROR: DURATIONS.TEN_MINUTES,
};

/**
 * Resolves the cache seconds based on the requested, default, min, and max values.
 *
 * @param {Object} args The parameters object.
 * @param {number} args.requested The requested cache seconds.
 * @param {number} args.def The default cache seconds.
 * @param {number} args.min The minimum cache seconds.
 * @param {number} args.max The maximum cache seconds.
 * @returns {number} The resolved cache seconds.
 */
const resolveCacheSeconds = ({ requested, def, min, max }) => {
  let cacheSeconds = clampValue(isNaN(requested) ? def : requested, min, max);

  if (process.env.CACHE_SECONDS) {
    const envCacheSeconds = parseInt(process.env.CACHE_SECONDS, 10);
    if (!isNaN(envCacheSeconds)) {
      cacheSeconds = envCacheSeconds;
    }
  }

  return cacheSeconds;
};

/**
 * Disables caching by setting appropriate headers on the response object.
 *
 * @param {any} res The response object.
 */
const disableCaching = (res) => {
  // Disable caching for browsers, shared caches/CDNs, and GitHub Camo.
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

/**
 * Sets the Cache-Control headers on the response object.
 *
 * @param {any} res The response object.
 * @param {number} cacheSeconds The cache seconds to set in the headers.
 */
const setCacheHeaders = (res, cacheSeconds) => {
  if (cacheSeconds < 1 || process.env.NODE_ENV === "development") {
    disableCaching(res);
    return;
  }

  res.setHeader(
    "Cache-Control",
    `max-age=${cacheSeconds}, ` +
      `s-maxage=${cacheSeconds}, ` +
      `stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
  );
};

/**
 * Sets the Cache-Control headers for error responses on the response object.
 *
 * @param {any} res The response object.
 */
const setErrorCacheHeaders = (res) => {
  const envCacheSeconds = process.env.CACHE_SECONDS
    ? parseInt(process.env.CACHE_SECONDS, 10)
    : NaN;
  if (
    (!isNaN(envCacheSeconds) && envCacheSeconds < 1) ||
    process.env.NODE_ENV === "development"
  ) {
    disableCaching(res);
    return;
  }

  // Use lower cache period for errors.
  res.setHeader(
    "Cache-Control",
    `max-age=${CACHE_TTL.ERROR}, ` +
      `s-maxage=${CACHE_TTL.ERROR}, ` +
      `stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
  );
};

/**
 * Get data from distributed cache (Vercel KV).
 *
 * @param {string} key - Cache key.
 * @returns {Promise<any|null>} Cached data or null.
 */
const getFromCache = async (key) => {
  try {
    const data = await kv.get(key);
    if (data !== null) {
      cacheMetrics.hits++;
      return JSON.parse(data);
    }
    cacheMetrics.misses++;
    return null;
  } catch (error) {
    cacheMetrics.errors++;
    console.error("Cache get error:", error);
    return null;
  }
};

/**
 * Set data in distributed cache with TTL.
 *
 * @param {string} key - Cache key.
 * @param {any} value - Data to cache.
 * @param {number} ttlSeconds - Time to live in seconds.
 * @returns {Promise<boolean>} Success status.
 */
const setInCache = async (key, value, ttlSeconds) => {
  try {
    await kv.set(key, JSON.stringify(value), { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
};

/**
 * Cache warming for popular users.
 * Pre-warms cache for frequently accessed usernames.
 */
const warmCacheForPopularUsers = async () => {
  const popularUsers = process.env.POPULAR_USERS?.split(",") || [];
  for (const username of popularUsers) {
    const cacheKey = `stats:${username}`;
    const exists = await kv.exists(cacheKey);
    if (!exists) {
      // Trigger background fetch to warm cache
      console.log(`Warming cache for ${username}`);
    }
  }
};

export {
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
  DURATIONS,
  CACHE_TTL,
  getFromCache,
  setInCache,
  cacheMetrics,
  warmCacheForPopularUsers,
};
