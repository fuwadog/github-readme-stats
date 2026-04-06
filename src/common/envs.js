// @ts-check

const whitelist = process.env.WHITELIST
  ? process.env.WHITELIST.split(",").filter((s) => s.trim() !== "")
  : [];

const gistWhitelist = process.env.GIST_WHITELIST
  ? process.env.GIST_WHITELIST.split(",").filter((s) => s.trim() !== "")
  : [];

const excludeRepositories = process.env.EXCLUDE_REPO
  ? process.env.EXCLUDE_REPO.split(",")
  : [];

const blacklist = process.env.BLACKLIST
  ? process.env.BLACKLIST.split(",").filter((s) => s.trim() !== "")
  : [];

export { whitelist, gistWhitelist, excludeRepositories, blacklist };
