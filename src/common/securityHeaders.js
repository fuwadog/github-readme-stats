// @ts-check

/**
 * Set security headers for responses.
 *
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const setSecurityHeaders = (res) => {
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; img-src 'self' data: https://github.com https://*.githubusercontent.com; style-src 'unsafe-inline';",
  );

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  );

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
};

/**
 * CORS middleware (optional, if needed).
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
const corsMiddleware = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return next();
};

export { setSecurityHeaders, corsMiddleware };
