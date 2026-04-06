// @ts-check

import { jest } from "@jest/globals";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
  CACHE_TTL,
  DURATIONS,
} from "../src/common/cache.js";

describe("cache.js", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.CACHE_SECONDS;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe("resolveCacheSeconds", () => {
    it("should return default when requested is NaN", () => {
      const result = resolveCacheSeconds({
        requested: NaN,
        def: 100,
        min: 50,
        max: 200,
      });
      expect(result).toBe(100);
    });

    it("should return requested value when within range", () => {
      const result = resolveCacheSeconds({
        requested: 100,
        def: 50,
        min: 50,
        max: 200,
      });
      expect(result).toBe(100);
    });

    it("should clamp value below MIN", () => {
      const result = resolveCacheSeconds({
        requested: 10,
        def: 100,
        min: 50,
        max: 200,
      });
      expect(result).toBe(50);
    });

    it("should clamp value above MAX", () => {
      const result = resolveCacheSeconds({
        requested: 500,
        def: 100,
        min: 50,
        max: 200,
      });
      expect(result).toBe(200);
    });

    it("should use CACHE_SECONDS env override", () => {
      process.env.CACHE_SECONDS = "300";
      const result = resolveCacheSeconds({
        requested: 100,
        def: 50,
        min: 50,
        max: 200,
      });
      expect(result).toBe(300);
    });

    it("should use CACHE_SECONDS env override even with invalid requested", () => {
      process.env.CACHE_SECONDS = "180";
      const result = resolveCacheSeconds({
        requested: NaN,
        def: 100,
        min: 50,
        max: 200,
      });
      expect(result).toBe(180);
    });

    it("should ignore invalid CACHE_SECONDS env", () => {
      process.env.CACHE_SECONDS = "invalid";
      const result = resolveCacheSeconds({
        requested: 100,
        def: 50,
        min: 50,
        max: 200,
      });
      expect(result).toBe(100);
    });
  });

  describe("disableCaching", () => {
    it("should set no-cache headers", () => {
      const res = {
        setHeader: jest.fn(),
      };
      setCacheHeaders(res, 0);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
      expect(res.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
      expect(res.setHeader).toHaveBeenCalledWith("Expires", "0");
    });
  });

  describe("setCacheHeaders", () => {
    it("should disable caching when cacheSeconds < 1", () => {
      const res = {
        setHeader: jest.fn(),
      };
      setCacheHeaders(res, 0);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
    });

    it("should disable caching when NODE_ENV=development", () => {
      process.env.NODE_ENV = "development";
      const res = {
        setHeader: jest.fn(),
      };
      setCacheHeaders(res, 3600);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
    });

    it("should set correct Cache-Control header for normal cacheSeconds", () => {
      const res = {
        setHeader: jest.fn(),
      };
      setCacheHeaders(res, 3600);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        `max-age=3600, s-maxage=3600, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      );
    });

    it("should handle negative cacheSeconds as no cache", () => {
      const res = {
        setHeader: jest.fn(),
      };
      setCacheHeaders(res, -1);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
    });
  });

  describe("setErrorCacheHeaders", () => {
    it("should set shorter cache for errors", () => {
      const res = {
        setHeader: jest.fn(),
      };
      setErrorCacheHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        `max-age=${CACHE_TTL.ERROR}, s-maxage=${CACHE_TTL.ERROR}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      );
    });

    it("should disable caching when CACHE_SECONDS is 0", () => {
      process.env.CACHE_SECONDS = "0";
      const res = {
        setHeader: jest.fn(),
      };
      setErrorCacheHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
    });

    it("should disable caching when NODE_ENV=development", () => {
      process.env.NODE_ENV = "development";
      const res = {
        setHeader: jest.fn(),
      };
      setErrorCacheHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      );
    });

    it("should use CACHE_TTL.ERROR when CACHE_SECONDS is set but >= 1", () => {
      process.env.CACHE_SECONDS = "7200";
      const res = {
        setHeader: jest.fn(),
      };
      setErrorCacheHeaders(res);

      // CACHE_SECONDS >= 1 doesn't affect error cache - it still uses CACHE_TTL.ERROR
      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        `max-age=${CACHE_TTL.ERROR}, s-maxage=${CACHE_TTL.ERROR}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      );
    });
  });
});
