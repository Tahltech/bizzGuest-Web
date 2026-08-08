import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { db } from '../db/knex.js';
import { drainEmailQueue } from '../modules/email/service.js';
import { expireStaleHolds } from './expireHolds.js';
import { pollPendingCampayPayments } from '../modules/payments/service.js';

const EMAIL_INTERVAL_MS = 15_000;
const HOLDS_INTERVAL_MS = 60_000;
const PAYMENTS_POLL_INTERVAL_MS = 20_000;

logger.info(`${env.appName} worker started`);

async function tick(name, fn) {
  try {
    await fn();
  } catch (err) {
    logger.error({ err }, `[worker] ${name} tick failed`);
  }
}

const emailTimer = setInterval(() => tick('drainEmailQueue', () => drainEmailQueue()), EMAIL_INTERVAL_MS);
const holdsTimer = setInterval(() => tick('expireStaleHolds', () => expireStaleHolds()), HOLDS_INTERVAL_MS);
// Fallback confirmation path for mobile money payments — resolves them even
// before a public webhook URL is registered with Campay. See architecture §11.
const paymentsTimer = setInterval(() => tick('pollPendingCampayPayments', () => pollPendingCampayPayments()), PAYMENTS_POLL_INTERVAL_MS);

async function shutdown(signal) {
  logger.info(`${signal} received, stopping worker...`);
  clearInterval(emailTimer);
  clearInterval(holdsTimer);
  clearInterval(paymentsTimer);
  await db.destroy();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
