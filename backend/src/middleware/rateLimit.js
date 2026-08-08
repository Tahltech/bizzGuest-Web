import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { fail } from '../lib/response.js';

function limiterResponse(req, res) {
  return fail(res, 429, 'RATE_LIMITED', 'Too many requests. Please slow down and try again shortly.');
}

export const generalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterResponse,
  // Payment webhooks are authenticated by signature, not by client IP volume
  // — see architecture §15. A burst of legitimate provider callbacks must
  // never get throttled.
  skip: (req) => req.path.startsWith('/api/v1/payments/webhook/')
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterResponse
});
