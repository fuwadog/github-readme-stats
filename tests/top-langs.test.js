// @ts-check

import { jest } from "@jest/globals";
import { afterEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra", "YourUsername"],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import topLangs from "../api/top-langs.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const mock = new MockAdapter(axios);
const mockRes = () => {
  const res = {};
  res.send = jest.fn((val) => val);
  res.setHeader = jest.fn((key, val) => val);
  return res;
};
const mockReq = (query = {}) => ({ query });

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            languages: {
              edges: [{ size: 150, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            languages: {
              edges: [
                { size: 120, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
        ],
      },
    },
  },
};

const processedLangs = {
  HTML: { name: "HTML", color: "#0f0", size: 150, count: 1 },
  javascript: { name: "javascript", color: "#0ff", size: 120, count: 1 },
};

describe("/api/top-langs", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    mock.reset();
    jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should test the request", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(renderTopLanguages(processedLangs));
  });

  it("should work with the query options", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({
      username: "anuraghazra",
      hide_title: true,
      card_width: 100,
      layout: "compact",
      hide_progress: true,
      langs_count: 8,
    });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderTopLanguages(processedLangs, {
        hide_title: true,
        card_width: 100,
        layout: "compact",
        hide_progress: true,
        langs_count: 8,
      }),
    );
  });

  it("should render error card on user data fetch error", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [
        {
          type: "NOT_FOUND",
          message: "Could not fetch user",
          locations: [{ line: 6, column: 3 }],
          path: ["user"],
        },
      ],
    });

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Could not fetch user",
        secondaryMessage:
          "Make sure the provided username is not an organization",
        renderOptions: {
          show_repo_link: true,
          title_color: undefined,
          text_color: undefined,
          bg_color: undefined,
          border_color: undefined,
          theme: undefined,
        },
      }),
    );
  });

  it("should render error card if incorrect layout input", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "anuraghazra", layout: "invalid" });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect layout input",
      }),
    );
  });

  it("should render error card if username in blacklist", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "YourUsername" });
    const res = mockRes();

    await topLangs(req, res);

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

  it("should render error card if username in blacklist but not whitelisted", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "renovate-bot" });
    const res = mockRes();

    await topLangs(req, res);

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

  it("should render error card if wrong locale provided", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "anuraghazra", locale: "incorrect" });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Locale not found",
      }),
    );
  });

  it("should have proper cache", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await topLangs(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        `max-age=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, s-maxage=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      ],
    ]);
  });
});
