const rateLimitStore = new Map();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
const RATE_LIMIT_WINDOW_MINUTES = parseInt(
  process.env.RATE_LIMIT_WINDOW_MINUTES || "15",
  10,
);
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, RATE_LIMIT_WINDOW_MS);

const rateLimit = (req, res, next) => {
  const clientIp = getClientIp(req);
  const now = Date.now();

  if (!rateLimitStore.has(clientIp)) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  const clientData = rateLimitStore.get(clientIp);

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientIp, clientData);
    return next();
  }

  if (clientData.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).send("Too Many Requests");
  }

  clientData.count++;
  rateLimitStore.set(clientIp, clientData);
  return next();
};

export { rateLimit, rateLimitStore };
export default rateLimit;
