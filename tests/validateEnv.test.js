import { jest } from "@jest/globals";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

describe("validateEnv.test.js - Environment validation", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.PAT_1;
    delete process.env.WHITELIST;
    delete process.env.GIST_WHITELIST;
    delete process.env.CACHE_SECONDS;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe("PAT validation", () => {
    it("should throw error when PAT_1 is missing", async () => {
      process.env.PAT_1 = "";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).toThrow("PAT_1 is required");
    });

    it("should not throw when PAT_1 is set", async () => {
      process.env.PAT_1 = "test_token";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("WHITELIST validation", () => {
    it("should warn when WHITELIST is empty", async () => {
      process.env.PAT_1 = "test_token";
      process.env.WHITELIST = "";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      validateEnv();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("PORT validation", () => {
    it("should throw for invalid PORT", async () => {
      process.env.PAT_1 = "test_token";
      process.env.PORT = "99999";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).toThrow("PORT must be a valid port");
    });

    it("should not throw for valid PORT", async () => {
      process.env.PAT_1 = "test_token";
      process.env.PORT = "3000";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("NODE_ENV validation", () => {
    it("should throw for invalid NODE_ENV", async () => {
      process.env.PAT_1 = "test_token";
      process.env.NODE_ENV = "invalid";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).toThrow("NODE_ENV must be one of");
    });

    it("should not throw for valid NODE_ENV values", async () => {
      process.env.PAT_1 = "test_token";
      const validEnvs = ["development", "production", "test"];
      const { validateEnv } = await import("../src/common/validateEnv.js");

      for (const env of validEnvs) {
        process.env.NODE_ENV = env;
        expect(() => validateEnv()).not.toThrow();
      }
    });
  });

  describe("CACHE_SECONDS validation", () => {
    it("should throw for invalid CACHE_SECONDS", async () => {
      process.env.PAT_1 = "test_token";
      process.env.CACHE_SECONDS = "99999999999";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).toThrow("CACHE_SECONDS must be");
    });

    it("should not throw for valid CACHE_SECONDS", async () => {
      process.env.PAT_1 = "test_token";
      process.env.CACHE_SECONDS = "3600";
      const { validateEnv } = await import("../src/common/validateEnv.js");

      expect(() => validateEnv()).not.toThrow();
    });
  });
});
