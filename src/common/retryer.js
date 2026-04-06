// @ts-check

import { CustomError } from "./error.js";
import { logger } from "./log.js";

// Script variables.

// Count the number of GitHub API tokens available (computed on-demand).
const countPATs = () =>
  Object.keys(process.env).filter((key) => /PAT_\d*$/.exec(key)).length;

// Export RETRIES as a getter that always returns the latest computed value.
const getRetries = () => (process.env.NODE_ENV === "test" ? 7 : countPATs());
const RETRIES = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === Symbol.toPrimitive) {
        return () => getRetries();
      }
      if (prop === "valueOf") {
        return getRetries;
      }
      return getRetries();
    },
  },
);

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse Axios response.
 * @typedef {(variables: any, token: string, retriesForTests?: number) => Promise<AxiosResponse>} FetcherFunction Fetcher function.
 */

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * @param {FetcherFunction} fetcher The fetcher function.
 * @param {any} variables Object with arguments to pass to the fetcher function.
 * @param {number} retries How many times to retry.
 * @returns {Promise<any>} The response from the fetcher function.
 */
const retryer = async (fetcher, variables, retries = 0) => {
  const retriesCount = countPATs();

  if (process.env.NODE_ENV !== "test" && !retriesCount) {
    throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
  }

  const maxRetries = process.env.NODE_ENV === "test" ? 7 : retriesCount;

  let currentRetry = retries;

  while (true) {
    if (currentRetry > maxRetries) {
      throw new CustomError(
        "Downtime due to GitHub API rate limiting",
        CustomError.MAX_RETRY,
      );
    }

    try {
      let response = await fetcher(
        variables,
        // @ts-ignore
        process.env[`PAT_${currentRetry + 1}`],
        currentRetry,
      );

      const errors = response?.data?.errors;
      const errorType = errors?.[0]?.type;
      const errorMsg = errors?.[0]?.message || "";
      const isRateLimited =
        (errors && errorType === "RATE_LIMITED") ||
        /rate limit/i.test(errorMsg);

      if (isRateLimited) {
        logger.log(`PAT_${currentRetry + 1} Failed`);
        currentRetry++;
        continue;
      }

      return response;
    } catch (err) {
      /** @type {any} */
      const e = err;

      if (!e?.response) {
        throw e;
      }

      const isBadCredential = e?.response?.data?.message === "Bad credentials";
      const isAccountSuspended =
        e?.response?.data?.message === "Sorry. Your account was suspended.";

      if (isBadCredential || isAccountSuspended) {
        logger.log(`PAT_${currentRetry + 1} Failed`);
        currentRetry++;
        continue;
      }

      return e.response;
    }
  }
};

export { retryer, RETRIES };
export default retryer;
