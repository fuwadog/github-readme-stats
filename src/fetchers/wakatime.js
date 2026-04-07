// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * WakaTime data fetcher.
 *
 * @param {{username: string, api_domain: string }} props Fetcher props.
 * @returns {Promise<import("./types").WakaTimeData>} WakaTime data response.
 */
const fetchWakatimeStats = async ({ username, api_domain }) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  try {
    const { data } = await axios.get(
      `https://${
        api_domain ? api_domain.replace(/\/$/gi, "") : "wakatime.com"
      }/api/v1/users/${username}/stats?is_including_today=true`,
    );

    return data.data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new CustomError(
        `WakaTime user not found: '${username}'`,
        "WAKATIME_USER_NOT_FOUND",
      );
    }
    if (err.response?.status === 401) {
      throw new CustomError(
        "WakaTime API authentication failed",
        "WAKATIME_AUTH_FAILED",
      );
    }
    throw new CustomError(
      `WakaTime API error: ${err.message || "Unknown error"}`,
      "WAKATIME_API_ERROR",
    );
  }
};

export { fetchWakatimeStats };
export default fetchWakatimeStats;
