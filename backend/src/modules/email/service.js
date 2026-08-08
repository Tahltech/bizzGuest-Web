import { db } from '../../db/knex.js';
import { sendMail } from '../../lib/emailProvider/index.js';
import { templates } from './templates.js';
import { logger } from '../../lib/logger.js';

/** Enqueues an email job — never sent inline during a request, see architecture §13. */
export async function queueEmail(template, toEmail, payload, trx = db) {
  await trx('email_jobs').insert({
    template,
    to_email: toEmail,
    payload: JSON.stringify(payload)
  });
}

const MAX_ATTEMPTS = 5;

/** Drains up to `limit` queued jobs. Called on an interval by the worker process. */
export async function drainEmailQueue(limit = 20) {
  const jobs = await db('email_jobs').where({ status: 'queued' }).orderBy('created_at').limit(limit);

  for (const job of jobs) {
    await db('email_jobs').where({ id: job.id }).update({ status: 'sending' });
    try {
      const build = templates[job.template];
      if (!build) throw new Error(`Unknown email template "${job.template}"`);

      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
      const { subject, html } = build(payload);
      await sendMail({ to: job.to_email, subject, html });

      await db('email_jobs').where({ id: job.id }).update({ status: 'sent', sent_at: new Date() });
    } catch (err) {
      const attempts = job.attempts + 1;
      const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'queued';
      await db('email_jobs').where({ id: job.id }).update({ status, attempts, last_error: String(err.message || err) });
      logger.warn(`[email] job ${job.id} (${job.template}) attempt ${attempts} failed: ${err.message}`);
    }
  }
}
