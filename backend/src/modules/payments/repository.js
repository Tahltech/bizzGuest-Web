import { db } from '../../db/knex.js';

export async function createPayment(data, trx = db) {
  const [id] = await trx('payments').insert(data);
  return id;
}

export async function findById(id, trx = db) {
  return trx('payments').where({ id }).first();
}

export async function findByIdForUpdate(id, trx) {
  return trx('payments').where({ id }).forUpdate().first();
}

export async function findByProviderReference(provider, providerReference, trx = db) {
  return trx('payments').where({ provider, provider_reference: providerReference }).first();
}

export async function listForBooking(bookingId, trx = db) {
  return trx('payments').where({ booking_id: bookingId }).orderBy('created_at', 'desc');
}

export async function listSucceededForBooking(bookingId, trx) {
  return trx('payments').where({ booking_id: bookingId, status: 'succeeded' });
}

/** The one payment attempt currently "in flight" for a booking via a given provider, if any — the guard against firing a second Campay collection request while the first hasn't resolved yet. */
export async function findActivePaymentForBooking(bookingId, provider, trx = db) {
  return trx('payments')
    .where({ booking_id: bookingId, provider })
    .whereIn('status', ['pending', 'processing'])
    .orderBy('created_at', 'desc')
    .first();
}

/** A manual payment recorded moments ago with identical terms — most likely a double-click/double-submit of the same staff action, not two genuine payments. */
export async function findRecentDuplicateManualPayment(bookingId, { method, amountMinor }, withinMs, trx = db) {
  return trx('payments')
    .where({ booking_id: bookingId, provider: 'manual', method, amount_minor: amountMinor })
    .where('created_at', '>', new Date(Date.now() - withinMs))
    .orderBy('created_at', 'desc')
    .first();
}

export async function updatePayment(id, data, trx = db) {
  return trx('payments').where({ id }).update({ ...data, updated_at: new Date() });
}

/** Append-only. A duplicate (provider, provider_reference, event_status) is a harmless no-op — that's the webhook-replay dedupe from architecture §11. */
export async function insertTransaction(data, trx = db) {
  try {
    await trx('payment_transactions').insert(data);
    return true;
  } catch (err) {
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) return false;
    throw err;
  }
}

export async function listPendingCampayPayments(olderThanMs, trx = db) {
  return trx('payments')
    .where({ provider: 'campay', status: 'pending' })
    .whereNotNull('provider_reference')
    .where('created_at', '<', new Date(Date.now() - olderThanMs));
}

export async function findBookingForUpdate(bookingId, trx) {
  return trx('bookings').where({ id: bookingId }).forUpdate().first();
}

export async function updateBookingPaymentState(bookingId, data, trx) {
  return trx('bookings').where({ id: bookingId }).update({ ...data, updated_at: new Date() });
}

export async function findBookingWithGuest(bookingId, trx = db) {
  return trx('bookings as bk')
    .leftJoin('guests as g', 'g.id', 'bk.guest_id')
    .leftJoin('apartments as a', 'a.id', 'bk.apartment_id')
    .where('bk.id', bookingId)
    .select(
      'bk.*',
      'g.full_name as guest_name', 'g.email as guest_email', 'g.user_id as guest_user_id',
      'a.name as apartment_name'
    )
    .first();
}

const LIST_COLUMNS = [
  'p.id', 'p.booking_id', 'p.method', 'p.provider', 'p.amount_minor', 'p.currency',
  'p.status', 'p.provider_reference', 'p.notes', 'p.created_at', 'p.updated_at',
  'bk.reference as booking_reference', 'a.name as apartment_name'
];

function withBookingAndApartment() {
  return db('payments as p')
    .join('bookings as bk', 'bk.id', 'p.booking_id')
    .leftJoin('apartments as a', 'a.id', 'bk.apartment_id');
}

/** Every payment across every booking made by this user's guest profile — powers the guest account "Payments" page. */
export async function listForUser(userId, { page = 1, perPage = 20 } = {}) {
  const guest = await db('guests').where({ user_id: userId }).first();
  if (!guest) return { rows: [], total: 0 };

  const query = withBookingAndApartment().where('bk.guest_id', guest.id);
  const totalRow = await query.clone().clearSelect().count({ count: 'p.id' }).first();
  const rows = await query.clone().select(LIST_COLUMNS).orderBy('p.created_at', 'desc').limit(perPage).offset((page - 1) * perPage);

  return { rows, total: Number(totalRow.count) };
}

/** Every payment in the system — the staff-facing payments overview. */
export async function listAll({ status, page = 1, perPage = 20 } = {}) {
  const query = withBookingAndApartment();
  if (status) query.where('p.status', status);

  const totalRow = await query.clone().clearSelect().count({ count: 'p.id' }).first();
  const rows = await query.clone().select(LIST_COLUMNS).orderBy('p.created_at', 'desc').limit(perPage).offset((page - 1) * perPage);

  return { rows, total: Number(totalRow.count) };
}

export async function findStaffUserIdsForNotification(trx = db) {
  const rows = await trx('users as u')
    .join('user_roles as ur', 'ur.user_id', 'u.id')
    .join('roles as r', 'r.id', 'ur.role_id')
    .whereIn('r.slug', ['super_admin', 'manager', 'accountant'])
    .where('u.is_active', true)
    .distinct('u.id');
  return rows.map((r) => r.id);
}
