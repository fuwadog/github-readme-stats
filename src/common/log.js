// @ts-check

const noop = () => {};

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
};

const shouldLog = (level) => {
  return getLogLevel() <= LOG_LEVELS[level];
};

const createLogger = (requestId) => {
  const baseLogger =
    process.env.NODE_ENV === "test"
      ? { log: noop, error: noop, warn: noop, debug: noop }
      : console;

  return {
    debug: (...args) => {
      if (shouldLog("debug")) {
        baseLogger.log(`[${requestId}] [DEBUG]`, ...args);
      }
    },
    info: (...args) => {
      if (shouldLog("info")) {
        baseLogger.log(`[${requestId}] [INFO]`, ...args);
      }
    },
    warn: (...args) => {
      if (shouldLog("warn")) {
        baseLogger.log(`[${requestId}] [WARN]`, ...args);
      }
    },
    error: (...args) => {
      if (shouldLog("error")) {
        baseLogger.log(`[${requestId}] [ERROR]`, ...args);
      }
    },
    log: (...args) => {
      baseLogger.log(`[${requestId}]`, ...args);
    },
  };
};

const logger =
  process.env.NODE_ENV === "test" ? { log: noop, error: noop } : console;

export { logger, createLogger, LOG_LEVELS };
export default logger;
