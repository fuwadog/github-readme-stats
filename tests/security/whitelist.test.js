import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../src/common/envs.js", () => ({
  whitelist: [],
  gistWhitelist: [],
  excludeRepositories: [],
  blacklist: ["renovate-bot", "technote-space", "sw-yx"],
}));

jest.mock("../../src/common/blacklist.js", () => ({
  default: ["renovate-bot", "technote-space", "sw-yx"],
  blacklist: ["renovate-bot", "technote-space", "sw-yx"],
}));

import { guardAccess } from "../../src/common/access.js";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockImplementation((val) => {
    res.lastSent = val;
    return val;
  });
  return res;
};

describe("Whitelist Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Empty whitelist (default deny)", () => {
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
  });

  describe("Blacklist enforcement", () => {
    it("should deny access when username is blacklisted", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "renovate-bot",
        type: "username",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });

    it("should deny access when username is in default blacklist", () => {
      const res = mockRes();
      const result = guardAccess({
        res,
        id: "technote-space",
        type: "username",
        colors: {},
      });

      expect(result.isPassed).toBe(false);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("Missing or empty id", () => {
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

  describe("Invalid type", () => {
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
