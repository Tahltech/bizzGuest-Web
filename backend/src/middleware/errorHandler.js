import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { fail } from '../lib/response.js';
import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Invalid request.', err.flatten());
  }

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, reqId: req.id }, err.message);
    return fail(res, err.status, err.code, err.message, err.details);
  }

  logger.error({ err, reqId: req.id }, 'Unhandled error');
  return fail(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

export function notFoundHandler(req, res) {
  return fail(res, 404, 'NOT_FOUND', `No route matches ${req.method} ${req.originalUrl}.`);
}
