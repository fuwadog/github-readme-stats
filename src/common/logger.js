// @ts-check

import crypto from "crypto";

/**
 * Generate correlation ID for request tracking.
 *
 * @returns {string} Correlation ID.
 */
const generateCorrelationId = () => {
  return crypto.randomUUID();
};

/**
 * Structured logger class for consistent logging across the application.
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || "info";
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
  }

  /**
   * Log message with context.
   *
   * @param {string} level - Log level.
   * @param {string} message - Log message.
   * @param {Object} context - Additional context.
   */
  log(level, message, context = {}) {
    const levelValue = this.levels[level];
    const currentLevelValue = this.levels[this.level];

    if (levelValue === undefined || currentLevelValue === undefined) {
      return;
    }
    if (levelValue < currentLevelValue) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log debug message.
   *
   * @param {string} message - Log message.
   * @param {Object} context - Additional context.
   */
  debug(message, context) {
    this.log("debug", message, context);
  }

  /**
   * Log info message.
   *
   * @param {string} message - Log message.
   * @param {Object} context - Additional context.
   */
  info(message, context) {
    this.log("info", message, context);
  }

  /**
   * Log warning message.
   *
   * @param {string} message - Log message.
   * @param {Object} context - Additional context.
   */
  warn(message, context) {
    this.log("warn", message, context);
  }

  /**
   * Log error message.
   *
   * @param {string} message - Log message.
   * @param {Object} context - Additional context.
   */
  error(message, context) {
    this.log("error", message, context);
  }
}

const logger = new Logger();

export { logger, generateCorrelationId };
export default logger;
