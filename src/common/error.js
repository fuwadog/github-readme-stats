// @ts-check

import { generateCorrelationId } from "./logger.js";

/**
 * @type {string} A general message to ask user to try again later.
 */
const TRY_AGAIN_LATER = "Please try again later";

/**
 * @type {Object<string, string>} A map of error types to secondary error messages.
 */
const SECONDARY_ERROR_MESSAGES = {
  MAX_RETRY:
    "You can deploy own instance or wait until public will be no longer limited",
  NO_TOKENS:
    "Please add an env variable called PAT_1 with your GitHub API token in vercel",
  USER_NOT_FOUND: "Make sure the provided username is not an organization",
  GRAPHQL_ERROR: TRY_AGAIN_LATER,
  GITHUB_REST_API_ERROR: TRY_AGAIN_LATER,
  WAKATIME_USER_NOT_FOUND: "Make sure you have a public WakaTime profile",
};

/**
 * Custom error class to handle custom GRS errors with correlation IDs and retryable status.
 */
class CustomError extends Error {
  /**
   * Custom error constructor.
   *
   * @param {string} message - Error message.
   * @param {string} type - Error type.
   * @param {string} [correlationId] - Optional correlation ID for tracking.
   */
  constructor(message, type, correlationId = undefined) {
    super(message);
    this.type = type;
    this.correlationId = correlationId || generateCorrelationId();
    this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
    this.timestamp = new Date().toISOString();
    this.isRetryable = this.checkRetryable(type);
  }

  /**
   * Check if error is retryable based on type.
   *
   * @param {string} type - Error type.
   * @returns {boolean} True if retryable.
   */
  checkRetryable(type) {
    const retryableTypes = [
      CustomError.GRAPHQL_ERROR,
      CustomError.GITHUB_REST_API_ERROR,
      CustomError.MAX_RETRY,
    ];
    return retryableTypes.includes(type);
  }

  /**
   * Get error response object for API responses.
   *
   * @returns {Object} Error response object.
   */
  toResponse() {
    return {
      error: {
        message: this.message,
        type: this.type,
        correlationId: this.correlationId,
        timestamp: this.timestamp,
        secondaryMessage: this.secondaryMessage,
        isRetryable: this.isRetryable,
      },
    };
  }

  static MAX_RETRY = "MAX_RETRY";
  static NO_TOKENS = "NO_TOKENS";
  static USER_NOT_FOUND = "USER_NOT_FOUND";
  static GRAPHQL_ERROR = "GRAPHQL_ERROR";
  static GITHUB_REST_API_ERROR = "GITHUB_REST_API_ERROR";
  static WAKATIME_ERROR = "WAKATIME_ERROR";
}

/**
 * Missing query parameter class.
 */
class MissingParamError extends Error {
  /**
   * Missing query parameter error constructor.
   *
   * @param {string[]} missedParams An array of missing parameters names.
   * @param {string=} secondaryMessage Optional secondary message to display.
   */
  constructor(missedParams, secondaryMessage) {
    const msg = `Missing params ${missedParams
      .map((p) => `"${p}"`)
      .join(", ")} make sure you pass the parameters in URL`;
    super(msg);
    this.missedParams = missedParams;
    this.secondaryMessage = secondaryMessage;
  }
}

/**
 * Retrieve secondary message from an error object.
 *
 * @param {Error} err The error object.
 * @returns {string|undefined} The secondary message if available, otherwise undefined.
 */
const retrieveSecondaryMessage = (err) => {
  return "secondaryMessage" in err && typeof err.secondaryMessage === "string"
    ? err.secondaryMessage
    : undefined;
};

export {
  CustomError,
  MissingParamError,
  SECONDARY_ERROR_MESSAGES,
  TRY_AGAIN_LATER,
  retrieveSecondaryMessage,
};
