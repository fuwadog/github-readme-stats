// @ts-check

import { jest } from "@jest/globals";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra"],
  gistWhitelist: ["bbfce31e0217a3689c8d961a356cb10d"],
  excludeRepositories: [],
}));

import gist from "../api/gist.js";
import { renderGistCard } from "../src/cards/gist.js";
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

const gist_data = {
  data: {
    viewer: {
      gist: {
        description:
          "List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Lista de países y territorios en Inglés y Español: nombre, continente, capital, código de teléfono, códigos de país, dominio y área en km cuadrados. Updated 2023",
        owner: {
          login: "Yizack",
        },
        stargazerCount: 11,
        forks: {
          totalCount: 0,
        },
        files: [
          {
            name: "countries.json",
            language: {
              name: "JSON",
              color: "#29b0f6",
            },
            size: 1000,
          },
          {
            name: "countries.csv",
            language: {
              name: "CSV",
              color: "#237346",
            },
            size: 500,
          },
          {
            name: "README.md",
            language: {
              name: "Markdown",
              color: "#6e3ceb",
            },
            size: 200,
          },
        ],
      },
    },
  },
};

const processedGist = {
  name: "countries.json",
  nameWithOwner: "Yizack/countries.json",
  description:
    "List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Lista de países y territorios en Inglés y Español: nombre, continente, capital, código de teléfono, códigos de país, dominio y área en km cuadrados. Updated 2023",
  language: "JSON",
  starsCount: 11,
  forksCount: 0,
};

describe("/api/gist", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mock.onPost("https://api.github.com/graphql").reply(() => {
      return [200, gist_data];
    });
  });

  afterEach(() => {
    mock.reset();
    // jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should test the request", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    const req = mockReq({ id: "bbfce31e0217a3689c8d961a356cb10d" });
    const res = mockRes();

    await gist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderGistCard(processedGist, {
        ...req.query,
      }),
    );
  });

  it("should get the query options", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    const req = mockReq({
      id: "bbfce31e0217a3689c8d961a356cb10d",
      title_color: "#fff",
      icon_color: "#f9f9f9",
      text_color: "#9f9f9f",
      bg_color: "#151515",
    });
    const res = mockRes();

    await gist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderGistCard(processedGist, {
        title_color: "#fff",
        icon_color: "#f9f9f9",
        text_color: "#9f9f9f",
        bg_color: "#151515",
      }),
    );
  });

  it("should render error card on gist not found", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: {
        viewer: {
          gist: null,
        },
      },
    });

    const req = mockReq({ id: "bbfce31e0217a3689c8d961a356cb10d" });
    const res = mockRes();

    await gist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Gist not found",
      }),
    );
  });

  it("should render error card on GraphQL error", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [
        {
          message: "Could not fetch gist",
          locations: [{ line: 6, column: 3 }],
          path: ["viewer"],
        },
      ],
    });

    const req = mockReq({ id: "bbfce31e0217a3689c8d961a356cb10d" });
    const res = mockRes();

    await gist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Could not fetch gist",
      }),
    );
  });

  it("should have proper cache", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    const req = mockReq({ id: "bbfce31e0217a3689c8d961a356cb10d" });
    const res = mockRes();

    await gist(req, res);

    expect(res.setHeader.mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        `max-age=${CACHE_TTL.GIST_CARD.DEFAULT}, s-maxage=${CACHE_TTL.GIST_CARD.DEFAULT}, stale-while-revalidate=${DURATIONS.STALE_WHILE_REVALIDATE}`,
      ],
    ]);
  });
});
