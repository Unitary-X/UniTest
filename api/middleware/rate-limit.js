'use strict';

/**
 * Create login rate-limit middleware using Redis.
 */
function createLoginRateLimitMiddleware(redisClient) {
  return async function loginRateLimitMiddleware(req, res, next) {
    try {
      const identifier = String(req.body?.regNo || req.body?.email || req.ip || '').toLowerCase().trim();
      if (!identifier) {
        return next();
      }

      const limiterKey = `login:ratelimit:${identifier}`;
      const current = await redisClient.incr(limiterKey);
      if (current === 1) {
        await redisClient.expire(limiterKey, 15 * 60); // 15-minute window
      }

      const maxAttempts = 5;
      if (current > maxAttempts) {
        return res.status(429).json({
          error: 'Too many login attempts. Try again in 15 minutes.',
        });
      }

      req.loginAttemptCount = current;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { createLoginRateLimitMiddleware };
