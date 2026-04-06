import { blacklist as envBlacklist } from "./envs.js";

const defaultBlacklist = [
  "renovate-bot",
  "technote-space",
  "sw-yx",
  "YourUsername",
  "[YourUsername]",
];

const blacklist = envBlacklist.length > 0 ? envBlacklist : defaultBlacklist;

export { blacklist };
export default blacklist;
