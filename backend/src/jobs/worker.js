import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { db } from '../db/knex.js';
import { drainEmailQueue } from '../modules/email/service.js';
import { expireStaleHolds } from './expireHolds.js';

const EMAIL_INTERVAL_MS = 15_000;
const HOLDS_INTERVAL_MS = 60_000;

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

async function shutdown(signal) {
  logger.info(`${signal} received, stopping worker...`);
  clearInterval(emailTimer);
  clearInterval(holdsTimer);
  await db.destroy();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
