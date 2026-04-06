/**
 * @file Tests for the status/up cloud function.
 */

import { jest } from "@jest/globals";
import { afterEach, describe, expect, it } from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra"],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import up, { RATE_LIMIT_SECONDS } from "../api/status/up.js";

const mock = new MockAdapter(axios);
const mockRes = () => {
  const res = {};
  res.send = jest.fn((val) => val);
  res.setHeader = jest.fn((key, val) => val);
  return res;
};
const mockReq = (query = {}) => ({ query });

const successData = {
  rateLimit: {
    remaining: 4986,
  },
};

describe("/api/status/up", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    mock.reset();
    jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should return boolean true when valid", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, successData);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await up(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith(true);
  });

  it("should return boolean false when invalid", async () => {
    mock.onPost("https://api.github.com/graphql").reply(500);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await up(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith(false);
  });

  it("should return JSON format when type=json", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, successData);

    const req = mockReq({ username: "anuraghazra", type: "json" });
    const res = mockRes();

    await up(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith({ up: true });
  });

  it("should return shields format when type=shields", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, successData);

    const req = mockReq({ username: "anuraghazra", type: "shields" });
    const res = mockRes();

    await up(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith({
      schemaVersion: 1,
      label: "Public Instance",
      message: "up",
      color: "brightgreen",
      isError: true,
    });
  });

  it("should have proper cache", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, successData);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await up(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "application/json"],
      ["Cache-Control", `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`],
    ]);
  });
});
