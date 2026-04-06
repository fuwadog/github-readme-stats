// @ts-check

import { jest } from "@jest/globals";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../src/common/envs.js", () => ({
  whitelist: ["anuraghazra"],
  gistWhitelist: [],
  excludeRepositories: [],
}));

import pin from "../api/pin.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderError } from "../src/common/render.js";

const mock = new MockAdapter(axios);
const mockRes = () => {
  const res = {};
  res.send = jest.fn((val) => val);
  res.setHeader = jest.fn((key, val) => val);
  return res;
};
const mockReq = (query = {}) => ({ query });

const repoData = {
  data: {
    user: {
      repository: {
        name: "convoychat",
        nameWithOwner: "anuraghazra/convoychat",
        isPrivate: false,
        isArchived: false,
        isTemplate: false,
        stargazers: { totalCount: 38000 },
        starCount: 38000,
        primaryLanguage: {
          name: "TypeScript",
          color: "#2b7489",
          id: "TypeScript",
        },
        description:
          "Help us take over the world! React + TS + GraphQL Chat App",
        forkCount: 100,
      },
    },
    organization: null,
  },
};

describe("/api/pin", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mock.onPost("https://api.github.com/graphql").reply(() => {
      console.log("MOCK CALLED!");
      return [200, repoData];
    });
  });

  afterEach(() => {
    mock.reset();
    // jest.resetModules();
    process.env = { ...envBackup };
  });

  it("should test the request", async () => {
    const req = mockReq({ username: "anuraghazra", repo: "convoychat" });
    const res = mockRes();

    await pin(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderRepoCard(repoData.data.user.repository, {
        ...req.query,
      }),
    );
  });

  it("should get the query options", async () => {
    const req = mockReq({
      username: "anuraghazra",
      repo: "convoychat",
      title_color: "#fff",
      text_color: "#fff",
      bg_color: "#fff",
      icon_color: "#fff",
      border_color: "#fff",
      hide_border: true,
    });
    const res = mockRes();

    await pin(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderRepoCard(repoData.data.user.repository, {
        title_color: "#fff",
        text_color: "#fff",
        bg_color: "#fff",
        icon_color: "#fff",
        border_color: "#fff",
        hide_border: true,
      }),
    );
  });

  it("should render error card if user repo not found", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: {
        user: {
          repository: null,
        },
        organization: null,
      },
    });

    const req = mockReq({ username: "anuraghazra", repo: "nonexistent" });
    const res = mockRes();

    await pin(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "User Repository Not found",
      }),
    );
  });

  it("should render error card if org repo not found", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: {
        user: null,
        organization: {
          repository: null,
        },
      },
    });

    const req = mockReq({ username: "anuraghazra", repo: "nonexistent" });
    const res = mockRes();

    await pin(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Organization Repository Not found",
      }),
    );
  });
});
