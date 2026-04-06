// @ts-check

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock the envs module with empty whitelist (default deny) BEFORE importing
jest.mock("../src/common/envs.js", () => ({
  whitelist: [],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import { guardAccess } from "../src/common/access.js";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockImplementation((val) => {
    res.lastSent = val;
    return val;
  });
  return res;
};

describe("guardAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty whitelist (default deny)", () => {
    it("should deny access when whitelist is empty for username type", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "testuser",
        type: "username",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
      // Check that an error was sent (we don't need to check the exact content)
    });

    it("should deny access when whitelist is empty for gist type", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "abc123",
        type: "gist",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });

    it("should deny access when whitelist is empty for wakatime type", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "wakatimeuser",
        type: "wakatime",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("missing or empty id", () => {
    it("should deny access when id is empty string", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "",
        type: "username",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });

    it("should deny access when id is whitespace only", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "   ",
        type: "username",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("invalid type", () => {
    it("should throw an error for invalid type", () => {
      const res = mockRes();
      expect(() =>
        guardAccess({
          res,
          id: "testuser",
          type: "invalid",
          colors: {},
        }),
      ).toThrow('Invalid type. Expected "username", "gist", or "wakatime".');
    });
  });
});
