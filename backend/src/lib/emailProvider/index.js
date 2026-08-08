import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.password }
    });
  }
  return transporter;
}

/**
 * Sends a single email. Returns without throwing when SMTP isn't configured
 * yet — the caller (the email worker) marks the job failed and retries later
 * rather than crashing the process. Fill in SMTP_* in .env to activate.
 */
export async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn(`[email] SMTP not configured — skipping send to ${to} ("${subject}"). Set SMTP_* in .env.`);
    throw new Error('SMTP is not configured.');
  }
  await t.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromAddress}>`,
    to,
    subject,
    html
  });
}
