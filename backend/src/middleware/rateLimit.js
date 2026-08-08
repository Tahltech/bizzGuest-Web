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
  handler: limiterResponse
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterResponse
});
