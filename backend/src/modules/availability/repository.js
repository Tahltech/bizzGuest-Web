import { db } from '../../db/knex.js';

const ACTIVE_BOOKING_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];

/**
 * Adds the overlap-exclusion predicate from architecture §9 to a query
 * already scoped to `apartments as a`. Reused verbatim by the booking
 * transaction's in-lock re-check (§10) — the search and the guarantee must
 * run the exact same predicate, or a gap between them is exactly where a
 * double-booking slips through.
 */
export function excludeOverlapping(query, { checkIn, checkOut }) {
  query.whereNotExists(function () {
    this.select(1)
      .from('bookings as b')
      .whereRaw('b.apartment_id = a.id')
      .whereIn('b.status', ACTIVE_BOOKING_STATUSES)
      .where('b.check_in', '<', checkOut)
      .where('b.check_out', '>', checkIn);
  });

  query.whereNotExists(function () {
    this.select(1)
      .from('blocked_dates as d')
      .whereRaw('d.apartment_id = a.id')
      .where('d.starts_on', '<', checkOut)
      .where('d.ends_on', '>', checkIn);
  });

  return query;
}

const BASE_COLUMNS = [
  'a.id', 'a.code', 'a.name', 'a.slug', 'a.description',
  'a.price_night_minor', 'a.price_week_minor', 'a.price_month_minor',
  'a.max_guests', 'a.beds', 'a.bathrooms', 'a.status', 'a.is_featured',
  't.name as apartment_type_name', 't.slug as apartment_type_slug'
];

export async function searchAvailable({ checkIn, checkOut, guests }, trx = db) {
  const query = trx('apartments as a')
    .leftJoin('apartment_types as t', 't.id', 'a.apartment_type_id')
    .whereNull('a.deleted_at')
    .where('a.is_active', true)
    .whereNotIn('a.status', ['maintenance', 'out_of_service'])
    .where('a.max_guests', '>=', guests);

  excludeOverlapping(query, { checkIn, checkOut });

  return query.select(BASE_COLUMNS).orderBy(['a.is_featured', 'a.price_night_minor']);
}

export async function countActiveApartments(trx = db) {
  const row = await trx('apartments').whereNull('deleted_at').where('is_active', true).count({ count: 'id' }).first();
  return Number(row.count);
}

/** Row-locks the apartment for the booking-creation transaction — see architecture §10. */
export async function lockApartment(apartmentId, trx) {
  return trx('apartments').where({ id: apartmentId }).forUpdate().first();
}

/** Re-check inside the lock, using the identical predicate the public search used. */
export async function isApartmentAvailable(apartmentId, { checkIn, checkOut }, trx) {
  const query = trx('apartments as a').where('a.id', apartmentId).whereNull('a.deleted_at');
  excludeOverlapping(query, { checkIn, checkOut });
  const row = await query.first();
  return Boolean(row);
}
