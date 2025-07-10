const rateLimit = require("express-rate-limit");

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Withdrawal rate limiter
const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 500 withdrawal requests per hour
  message: {
    success: false,
    message: "Too many withdrawal requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  withdrawalLimiter,
};
