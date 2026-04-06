// @ts-check

import { jest } from "@jest/globals";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

describe("envs.js", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.WHITELIST;
    delete process.env.GIST_WHITELIST;
    delete process.env.EXCLUDE_REPO;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("should return empty array when WHITELIST not set", async () => {
    const { whitelist } = await import("../src/common/envs.js");
    expect(whitelist).toEqual([]);
  });

  it("should filter empty strings from whitelist", async () => {
    process.env.WHITELIST = "user1,,  ,user2,,";
    jest.resetModules();
    const { whitelist } = await import("../src/common/envs.js");
    expect(whitelist).toEqual(["user1", "user2"]);
  });

  it("should parse comma-separated whitelist to array", async () => {
    process.env.WHITELIST = "user1,user2,user3";
    jest.resetModules();
    const { whitelist } = await import("../src/common/envs.js");
    expect(whitelist).toEqual(["user1", "user2", "user3"]);
  });

  it("should handle whitespace in whitelist values", async () => {
    process.env.WHITELIST = "user1, user2 ,  user3";
    jest.resetModules();
    const { whitelist } = await import("../src/common/envs.js");
    // Note: envs.js only filters empty strings after trim, doesn't trim each element
    expect(whitelist).toEqual(["user1", " user2 ", "  user3"]);
  });

  it("should return empty array when GIST_WHITELIST not set", async () => {
    const { gistWhitelist } = await import("../src/common/envs.js");
    expect(gistWhitelist).toEqual([]);
  });

  it("should filter empty strings from gistWhitelist", async () => {
    process.env.GIST_WHITELIST = "gist1,,  ,gist2";
    jest.resetModules();
    const { gistWhitelist } = await import("../src/common/envs.js");
    expect(gistWhitelist).toEqual(["gist1", "gist2"]);
  });

  it("should parse comma-separated gistWhitelist to array", async () => {
    process.env.GIST_WHITELIST = "gist1,gist2";
    jest.resetModules();
    const { gistWhitelist } = await import("../src/common/envs.js");
    expect(gistWhitelist).toEqual(["gist1", "gist2"]);
  });

  it("should return empty array when EXCLUDE_REPO not set", async () => {
    const { excludeRepositories } = await import("../src/common/envs.js");
    expect(excludeRepositories).toEqual([]);
  });

  it("should parse comma-separated EXCLUDE_REPO to array", async () => {
    process.env.EXCLUDE_REPO = "repo1,repo2,repo3";
    jest.resetModules();
    const { excludeRepositories } = await import("../src/common/envs.js");
    expect(excludeRepositories).toEqual(["repo1", "repo2", "repo3"]);
  });

  it("should handle all environment variables together", async () => {
    process.env.WHITELIST = "user1,user2";
    process.env.GIST_WHITELIST = "gist1";
    process.env.EXCLUDE_REPO = "repo1,repo2";
    jest.resetModules();
    const { whitelist, gistWhitelist, excludeRepositories } =
      await import("../src/common/envs.js");
    expect(whitelist).toEqual(["user1", "user2"]);
    expect(gistWhitelist).toEqual(["gist1"]);
    expect(excludeRepositories).toEqual(["repo1", "repo2"]);
  });
});
