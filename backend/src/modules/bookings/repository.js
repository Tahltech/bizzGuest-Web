import { db } from '../../db/knex.js';
import { formatBookingReference } from '../../lib/bookingReference.js';

const ACTIVE_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];

/** Atomically reserves the next booking reference for the current year — locked, so two concurrent bookings can never collide on the same number. */
export async function nextBookingReference(trx) {
  const year = new Date().getFullYear();
  let row = await trx('booking_reference_sequences').where({ year }).forUpdate().first();

  if (!row) {
    await trx('booking_reference_sequences').insert({ year, next_value: 2 });
    row = { next_value: 1 };
  } else {
    await trx('booking_reference_sequences').where({ year }).update({ next_value: row.next_value + 1 });
  }

  return formatBookingReference(year, row.next_value);
}

export async function getUserContact(userId, trx = db) {
  return trx('users').where({ id: userId }).select('full_name', 'email', 'phone').first();
}

export async function findOrCreateGuestForUser({ userId, fullName, email, phone }, trx) {
  const existing = await trx('guests').where({ user_id: userId }).first();
  if (existing) return existing.id;
  const [id] = await trx('guests').insert({ user_id: userId, full_name: fullName, email, phone });
  return id;
}

export async function getApartmentForPricing(apartmentId, trx = db) {
  return trx('apartments').where({ id: apartmentId }).first();
}

export async function getActivePricingRules(apartmentId, trx = db) {
  return trx('pricing_rules').where({ apartment_id: apartmentId, is_active: true });
}

export async function getHoldMinutes(trx = db) {
  const row = await trx('settings').where({ key: 'booking_hold_minutes' }).first();
  if (!row) return 10;
  return typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
}

export async function insertBooking(data, trx) {
  const [id] = await trx('bookings').insert(data);
  return id;
}

export async function insertBookingGuests(bookingId, guests, trx) {
  if (!guests.length) return;
  await trx('booking_guests').insert(guests.map((g) => ({ booking_id: bookingId, full_name: g.fullName, is_primary: Boolean(g.isPrimary) })));
}

export async function insertBookingHold({ bookingId, apartmentId, expiresAt }, trx) {
  await trx('booking_holds').insert({ booking_id: bookingId, apartment_id: apartmentId, expires_at: expiresAt });
}

export async function releaseHoldForBooking(bookingId, trx) {
  await trx('booking_holds').where({ booking_id: bookingId }).whereNull('released_at').update({ released_at: new Date() });
}

const DETAIL_COLUMNS = [
  'bk.id', 'bk.reference', 'bk.apartment_id', 'bk.guest_id', 'bk.check_in', 'bk.check_out',
  'bk.nights', 'bk.guests_count', 'bk.status', 'bk.payment_status',
  'bk.room_subtotal_minor', 'bk.tax_minor', 'bk.discount_minor', 'bk.fees_minor', 'bk.deposit_minor',
  'bk.total_minor', 'bk.paid_minor', 'bk.currency', 'bk.source',
  'bk.checked_in_at', 'bk.checked_out_at', 'bk.cancelled_reason', 'bk.cancelled_at',
  'bk.created_at', 'bk.updated_at',
  'a.name as apartment_name', 'a.code as apartment_code', 'a.slug as apartment_slug',
  'g.full_name as guest_name', 'g.email as guest_email', 'g.phone as guest_phone', 'g.user_id as guest_user_id'
];

function baseDetailQuery(trx = db) {
  return trx('bookings as bk')
    .leftJoin('apartments as a', 'a.id', 'bk.apartment_id')
    .leftJoin('guests as g', 'g.id', 'bk.guest_id');
}

export async function findById(id, trx = db) {
  return baseDetailQuery(trx).where('bk.id', id).select(DETAIL_COLUMNS).first();
}

export async function findByReference(reference, trx = db) {
  return baseDetailQuery(trx).where('bk.reference', reference).select(DETAIL_COLUMNS).first();
}

export async function findRawById(id, trx) {
  return trx('bookings').where({ id }).first();
}

export async function list({ guestId, status, apartmentId, page = 1, perPage = 20 }, trx = db) {
  const query = baseDetailQuery(trx);
  if (guestId) query.where('bk.guest_id', guestId);
  if (status) query.where('bk.status', status);
  if (apartmentId) query.where('bk.apartment_id', apartmentId);

  const totalRow = await query.clone().clearSelect().count({ count: 'bk.id' }).first();
  const rows = await query
    .clone()
    .select(DETAIL_COLUMNS)
    .orderBy('bk.created_at', 'desc')
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows, total: Number(totalRow.count) };
}

export async function updateStatus(id, updates, trx) {
  return trx('bookings').where({ id }).update({ ...updates, updated_at: new Date() });
}

export { ACTIVE_STATUSES };
