import { jest } from "@jest/globals";
import { afterEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra"],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import wakatime from "../api/wakatime.js";
import { renderWakatimeCard } from "../src/cards/wakatime.js";
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

const wakaTimeData = {
  data: {
    categories: [
      {
        digital: "22:40",
        hours: 22,
        minutes: 40,
        name: "Other",
        percentage: 0.57,
        secondary: "#454545",
        text: "#ffffff",
      },
      {
        digital: "16:51",
        hours: 16,
        minutes: 51,
        name: "TypeScript",
        percentage: 0.41,
        secondary: "#2f80ed",
        text: "#ffffff",
      },
    ],
    grand_total: {
      total_seconds: 141000,
      hours: 39,
      minutes: 10,
    },
    languages: [
      {
        name: "TypeScript",
        total_seconds: 58800,
        hours: 16,
        minutes: 20,
        percentage: 41.7,
      },
      {
        name: "Other",
        total_seconds: 82200,
        hours: 22,
        minutes: 40,
        percentage: 58.3,
      },
    ],
    editors: [],
    operating_systems: [],
    dependencies: [],
  },
};

describe("/api/wakatime", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    mock.reset();
    jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should test the request", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {}),
    );
  });

  it("should have proper cache", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        `max-age=${CACHE_TTL.WAKATIME_CARD.DEFAULT}, s-maxage=${CACHE_TTL.WAKATIME_CARD.DEFAULT}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      ],
    ]);
  });

  it("should get the query options - title_color, icon_color, hide_border", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      title_color: "fff",
      icon_color: "fff",
      hide_border: "true",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        title_color: "fff",
        icon_color: "fff",
        hide_border: true,
      }),
    );
  });

  it("should get the query options - card_width, line_height, text_color, bg_color", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      card_width: "500",
      line_height: "50",
      text_color: "fff",
      bg_color: "000",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        card_width: 500,
        line_height: "50",
        text_color: "fff",
        bg_color: "000",
      }),
    );
  });

  it("should get the query options - theme, hide_title, hide_progress", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      theme: "tokyonight",
      hide_title: "true",
      hide_progress: "true",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        theme: "tokyonight",
        hide_title: true,
        hide_progress: true,
      }),
    );
  });

  it("should get the query options - custom_title, locale, layout", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      custom_title: "My Coding Stats",
      locale: "cn",
      layout: "compact",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        custom_title: "My Coding Stats",
        locale: "cn",
        layout: "compact",
      }),
    );
  });

  it("should get the query options - langs_count, hide", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      langs_count: "10",
      hide: "rust,go",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        langs_count: 10,
        hide: ["rust", "go"],
      }),
    );
  });

  it("should use custom api_domain", async () => {
    mock
      .onGet(
        `https://example.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      api_domain: "example.com",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        api_domain: "example.com",
      }),
    );
  });

  it("should get the query options - border_radius, border_color", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      border_radius: "10",
      border_color: "fff",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        border_radius: "10",
        border_color: "fff",
      }),
    );
  });

  it("should get the query options - display_format, disable_animations", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({
      username: "anuraghazra",
      display_format: "compact",
      disable_animations: "true",
    });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderWakatimeCard(wakaTimeData.data, {
        display_format: "compact",
        disable_animations: true,
      }),
    );
  });

  it("should render error card when wrong locale is provided", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const req = mockReq({ username: "anuraghazra", locale: "invalid" });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });

  it("should render error card when username is blacklisted", async () => {
    const req = mockReq({ username: "sw-yx" });
    const res = mockRes();

    await wakatime(req, res);

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

  it("should render error card when Wakatime API fails", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(404, { error: "User not found" });

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await wakatime(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalled();
    const sentCall = res.send.mock.calls[0][0];
    expect(sentCall).toContain("Something went wrong");
  });

  it("should set shorter cache when error", async () => {
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/anuraghazra/stats?is_including_today=true`,
      )
      .reply(500, { error: "Server error" });

    const req = mockReq({ username: "anuraghazra" });
    const res = mockRes();

    await wakatime(req, res);

    const cacheHeaderCalls = res.setHeader.mock.calls.filter(
      (call) => call[0] === "Cache-Control",
    );
    expect(cacheHeaderCalls[0][1]).toContain(`max-age=${CACHE_TTL.ERROR}`);
  });
});
