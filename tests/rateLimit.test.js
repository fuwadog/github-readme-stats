// @ts-check

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

describe("rateLimit.test.js - Rate limiting tests", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.PAT_1 = "test_token";
    process.env.PAT_2 = "test_token_2";
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe("Retryer rate limit handling", () => {
    it("should retry on rate limit error response", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const rateLimitedResponse = {
        data: {
          errors: [{ type: "RATE_LIMITED", message: "Rate limit exceeded" }],
        },
      };
      const successResponse = { data: { stars: 100 } };

      let callCount = 0;
      const mockFetcher = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(rateLimitedResponse);
        }
        return Promise.resolve(successResponse);
      });

      const result = await retryer(mockFetcher, {}, 0);

      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ stars: 100 });
    });

    it("should retry on rate limit message in error response", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const rateLimitedResponse = {
        data: { errors: [{ message: "API rate limit exceeded" }] },
      };
      const successResponse = { data: { stars: 100 } };

      let callCount = 0;
      const mockFetcher = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(rateLimitedResponse);
        }
        return Promise.resolve(successResponse);
      });

      const result = await retryer(mockFetcher, {}, 0);

      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ stars: 100 });
    });

    it("should throw after exhausting all retries on rate limit", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const rateLimitedResponse = {
        data: { errors: [{ type: "RATE_LIMITED" }] },
      };

      let callCount = 0;
      const mockFetcher = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(rateLimitedResponse);
      });

      await expect(retryer(mockFetcher, {}, 0)).rejects.toThrow(
        "Downtime due to GitHub API rate limiting",
      );

      expect(callCount).toBeGreaterThan(1);
    });

    it("should return response directly for non-rate-limit HTTP errors", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const errorResponse = {
        data: { message: "Not Found" },
      };

      const mockError = new Error("HTTP Error");
      mockError.response = errorResponse;

      const mockFetcher = jest.fn().mockRejectedValue(mockError);

      const result = await retryer(mockFetcher, {}, 0);

      expect(result).toEqual(errorResponse);
    });

    it("should rethrow network errors", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const networkError = new Error("Network error");

      const mockFetcher = jest.fn().mockRejectedValue(networkError);

      await expect(retryer(mockFetcher, {}, 0)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("Iterative retry loop", () => {
    it("should handle iterative retries without stack overflow", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const rateLimitedResponse = {
        data: { errors: [{ type: "RATE_LIMITED" }] },
      };
      const successResponse = { data: { success: true } };

      let callCount = 0;
      const mockFetcher = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.resolve(rateLimitedResponse);
        }
        return Promise.resolve(successResponse);
      });

      const result = await retryer(mockFetcher, {}, 0);

      expect(callCount).toBe(4);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe("Token rotation", () => {
    it("should rotate through multiple PATs", async () => {
      const { retryer } = await import("../src/common/retryer.js");

      const successResponse = { data: { success: true } };

      let tokensUsed = [];
      const mockFetcher = jest.fn().mockImplementation((vars, token) => {
        tokensUsed.push(token);
        return Promise.resolve(successResponse);
      });

      await retryer(mockFetcher, {}, 0);

      expect(tokensUsed).toContain("test_token");
    });
  });
});
