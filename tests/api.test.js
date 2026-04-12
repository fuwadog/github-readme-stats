// @ts-check

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Mock envs module BEFORE importing anything that uses it
jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra", "renovate-bot"],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import api from "../api/index.js";
import { calculateRank } from "../src/calculateRank.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

/**
 * @type {import("../src/fetchers/stats").StatsData}
 */
const stats = {
  name: "Anurag Hazra",
  totalStars: 100,
  totalCommits: 200,
  totalIssues: 300,
  totalPRs: 400,
  totalPRsMerged: 320,
  mergedPRsPercentage: 80,
  totalReviews: 50,
  totalDiscussionsStarted: 10,
  totalDiscussionsAnswered: 40,
  contributedTo: 50,
  rank: { level: "DEV", percentile: 0 },
};

stats.rank = calculateRank({
  all_commits: false,
  commits: stats.totalCommits,
  prs: stats.totalPRs,
  reviews: stats.totalReviews,
  issues: stats.totalIssues,
  repos: 1,
  stars: stats.totalStars,
  followers: 100,
});

const data = {
  data: {
    user: {
      name: "Anurag Hazra",
      login: "anuraghazra",
      commits: { totalCommitContributions: 200 },
      reviews: { totalPullRequestReviewContributions: 50 },
      repositoriesContributedTo: { totalCount: 50 },
      pullRequests: { totalCount: 400 },
      mergedPullRequests: { totalCount: 320 },
      openIssues: { totalCount: 150 },
      closedIssues: { totalCount: 150 },
      followers: { totalCount: 100 },
      repositories: {
        totalCount: 1,
        nodes: [
          {
            name: "test-repo",
            stargazers: { totalCount: 100 },
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "Could not fetch user",
    },
  ],
};

const mockRes = () => {
  const res = {};
  res.send = jest.fn((val) => val);
  res.setHeader = jest.fn((key, val) => {
    res[key] = val;
    return res;
  });
  return res;
};

const mockReq = (query = {}) => ({ query });

const mock = new MockAdapter(axios);

describe("Test /api/", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mock.onPost("https://api.github.com/graphql").reply(200, data);
  });

  afterEach(() => {
    mock.reset();
    jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should test the request", async () => {
    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderStatsCard(stats, { ...req.query }),
    );
  });

  it("should render error card on error", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Make sure the provided username is not an organization",
      }),
    );
  });

  it("should render error card in same theme as requested card", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    const req = mockReq({ username: "anuraghazra", theme: "tokyonight" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Make sure the provided username is not an organization",
        renderOptions: { theme: "tokyonight" },
      }),
    );
  });

  it("should get the query options", async () => {
    const req = mockReq({
      username: "anuraghazra",
      hide: "issues,prs,contribs",
      show_icons: true,
      theme: "tokyonight",
      hide_border: true,
      bg_color: "fff",
      title_color: "fff",
      icon_color: "fff",
      text_bold: true,
      disable_animations: true,
    });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderStatsCard(stats, {
        hide: "issues,prs,contribs",
        show_icons: true,
        theme: "tokyonight",
        hide_border: true,
        bg_color: "fff",
        title_color: "fff",
        icon_color: "fff",
        text_bold: true,
        disable_animations: true,
      }),
    );
  });

  it("should have proper cache", async () => {
    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        `max-age=${CACHE_TTL.STATS_CARD.DEFAULT}, s-maxage=${CACHE_TTL.STATS_CARD.DEFAULT}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      ],
    ]);
  });

  it("should set proper cache", async () => {
    const req = mockReq({ username: "anuraghazra", cache_seconds: 43200 });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        "max-age=43200, s-maxage=43200, stale-while-revalidate=86400",
      ],
    ]);
  });

  it("should set shorter cache when error", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        "max-age=600, s-maxage=600, stale-while-revalidate=86400",
      ],
    ]);
  });

  it("should properly set cache using CACHE_SECONDS env variable", async () => {
    process.env.CACHE_SECONDS = "10000";

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        "max-age=10000, s-maxage=10000, stale-while-revalidate=86400",
      ],
    ]);
  });

  it("should disable cache when CACHE_SECONDS is set to 0", async () => {
    process.env.CACHE_SECONDS = "0";

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      ],
      ["Pragma", "no-cache"],
      ["Expires", "0"],
    ]);
  });

  it("should set proper cache with clamped values", async () => {
    const testCases = [
      { input: 10000, expected: 43200 }, // Clamped to MIN: TWELVE_HOURS = 43200
      { input: 100000, expected: 100000 }, // Within range [43200, 172800]; stays as-is
    ];

    for (const { input, expected } of testCases) {
      const req = mockReq({ username: "anuraghazra", cache_seconds: input });
      const res = mockRes();

      await api(req, res);

      expect(res.setHeader.mock.calls).toEqual([
        ["Content-Type", "image/svg+xml"],
        [
          "Cache-Control",
          `max-age=${expected}, s-maxage=${expected}, stale-while-revalidate=86400`,
        ],
      ]);
    }
  });

  it("should allow changing ring_color", async () => {
    const req = mockReq({
      username: "anuraghazra",
      hide: "issues,prs,contribs",
      show_icons: true,
      theme: "tokyonight",
      hide_border: true,
      bg_color: "fff",
      title_color: "fff",
      icon_color: "fff",
      text_bold: true,
      disable_animations: true,
      ring_color: "0000ff",
    });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderStatsCard(stats, {
        hide: "issues,prs,contribs",
        show_icons: true,
        theme: "tokyonight",
        hide_border: true,
        bg_color: "fff",
        title_color: "fff",
        icon_color: "fff",
        text_bold: true,
        disable_animations: true,
        ring_color: "0000ff",
      }),
    );
  });

  it("should render error card if username in blacklist", async () => {
    const req = mockReq({ username: "technote-space" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "This username is blacklisted",
        secondaryMessage: "Please deploy your own instance",
        renderOptions: {
          show_repo_link: false,
        },
      }),
    );
  });

  it("should render error card when wrong locale is provided", async () => {
    const req = mockReq({ username: "anuraghazra", locale: "asdf" });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });

  it("should render error card when include_all_commits true and upstream API fails", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [
        {
          type: "NOT_FOUND",
          path: ["user"],
          locations: [],
          message: "Could not fetch user",
        },
      ],
    });

    const req = mockReq({ username: "anuraghazra", include_all_commits: true });
    const res = mockRes();

    await api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Could not fetch user",
        secondaryMessage:
          "Make sure the provided username is not an organization",
      }),
    );
  });
});
