const VALID_NODE_ENV = ["development", "production", "test"];

const gistIdRegex = /^[a-f0-9]{20,}$/;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const validateEnv = () => {
  if (!process.env.PAT_1) {
    throw new ValidationError(
      "PAT_1 is required. Please set a GitHub Personal Access Token.",
    );
  }

  if (
    process.env.WHITELIST !== undefined &&
    process.env.WHITELIST.trim() === ""
  ) {
    console.warn(
      "Warning: WHITELIST is empty. Consider adding usernames for security.",
    );
  }

  if (process.env.GIST_WHITELIST) {
    const gistIds = process.env.GIST_WHITELIST.split(",").filter(
      (s) => s.trim() !== "",
    );
    for (const gistId of gistIds) {
      if (!gistIdRegex.test(gistId.trim())) {
        console.warn(
          `Warning: GIST_WHITELIST contains invalid gist ID format: ${gistId}`,
        );
      }
    }
  }

  if (
    process.env.CACHE_SECONDS !== undefined &&
    process.env.CACHE_SECONDS !== ""
  ) {
    const cacheSeconds = parseInt(process.env.CACHE_SECONDS, 10);
    if (isNaN(cacheSeconds) || cacheSeconds < 0 || cacheSeconds > 31536000) {
      throw new ValidationError(
        "CACHE_SECONDS must be a number between 0 and 31536000.",
      );
    }
  }

  if (process.env.PORT !== undefined && process.env.PORT !== "") {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new ValidationError("PORT must be a valid port number (1-65535).");
    }
  }

  if (
    process.env.NODE_ENV !== undefined &&
    !VALID_NODE_ENV.includes(process.env.NODE_ENV)
  ) {
    throw new ValidationError(
      `NODE_ENV must be one of: ${VALID_NODE_ENV.join(", ")}`,
    );
  }
};

export { validateEnv, ValidationError };
export default validateEnv;
