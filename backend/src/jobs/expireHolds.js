import { db } from '../db/knex.js';
import { logger } from '../lib/logger.js';

/**
 * Releases booking holds that expired before the guest completed payment.
 * Runs on the row-lock-protected apartment the same way the booking-creation
 * transaction does (architecture §10), so it can never race a genuine payment
 * confirmation into a lost update.
 */
export async function expireStaleHolds() {
  const staleHolds = await db('booking_holds')
    .whereNull('released_at')
    .where('expires_at', '<', new Date())
    .select('id', 'booking_id', 'apartment_id');

  for (const hold of staleHolds) {
    await db.transaction(async (trx) => {
      await trx('apartments').where({ id: hold.apartment_id }).forUpdate().first();

      const booking = await trx('bookings').where({ id: hold.booking_id }).first();
      if (!booking || !['pending', 'awaiting_payment'].includes(booking.status)) {
        // Already paid/confirmed/cancelled in the meantime — nothing to expire.
        await trx('booking_holds').where({ id: hold.id }).update({ released_at: new Date() });
        return;
      }

      await trx('bookings').where({ id: hold.booking_id }).update({ status: 'expired' });
      await trx('booking_holds').where({ id: hold.id }).update({ released_at: new Date() });
      logger.info(`[holds] expired booking ${hold.booking_id} (apartment ${hold.apartment_id})`);
    });
  }

  return staleHolds.length;
}
