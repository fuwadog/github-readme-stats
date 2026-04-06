// @ts-check

import { renderError } from "./render.js";
import { blacklist } from "./blacklist.js";
import { whitelist, gistWhitelist } from "./envs.js";

const NOT_WHITELISTED_USERNAME_MESSAGE = "This username is not whitelisted";
const NOT_WHITELISTED_GIST_MESSAGE = "This gist ID is not whitelisted";
const BLACKLISTED_MESSAGE = "This username is blacklisted";
const WHITELIST_NOT_CONFIGURED_MESSAGE =
  "Access Denied: Whitelist Not Configured";
const WHITELIST_NOT_CONFIGURED_DETAIL =
  "Set WHITELIST in your .env to allow access";
const MISSING_ID_MESSAGE = "Missing required parameter";
const MISSING_ID_DETAIL = "No username or ID provided in request";

/**
 * Guards access using whitelist/blacklist.
 *
 * @param {Object} args The parameters object.
 * @param {any} args.res The response object.
 * @param {string} args.id Resource identifier (username or gist id).
 * @param {"username"|"gist"|"wakatime"} args.type The type of identifier.
 * @param {{ title_color?: string, text_color?: string, bg_color?: string, border_color?: string, theme?: string }} args.colors Color options for the error card.
 * @returns {{ isPassed: boolean, result?: any }} The result object indicating success or failure.
 */
const guardAccess = ({ res, id, type, colors }) => {
  if (!["username", "gist", "wakatime"].includes(type)) {
    throw new Error(
      'Invalid type. Expected "username", "gist", or "wakatime".',
    );
  }

  if (!id || typeof id !== "string" || id.trim() === "") {
    res.status(400);
    const result = res.send(
      renderError({
        message: MISSING_ID_MESSAGE,
        secondaryMessage: MISSING_ID_DETAIL,
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  const currentWhitelist = type === "gist" ? gistWhitelist : whitelist;
  const notWhitelistedMsg =
    type === "gist"
      ? NOT_WHITELISTED_GIST_MESSAGE
      : NOT_WHITELISTED_USERNAME_MESSAGE;

  if (Array.isArray(currentWhitelist) && currentWhitelist.length === 0) {
    const result = res.send(
      renderError({
        message: WHITELIST_NOT_CONFIGURED_MESSAGE,
        secondaryMessage: WHITELIST_NOT_CONFIGURED_DETAIL,
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  if (blacklist.includes(id)) {
    const result = res.send(
      renderError({
        message: BLACKLISTED_MESSAGE,
        secondaryMessage: "Please deploy your own instance",
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  if (Array.isArray(currentWhitelist) && !currentWhitelist.includes(id)) {
    const result = res.send(
      renderError({
        message: notWhitelistedMsg,
        secondaryMessage: "Please deploy your own instance",
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  return { isPassed: true };
};

export { guardAccess };
