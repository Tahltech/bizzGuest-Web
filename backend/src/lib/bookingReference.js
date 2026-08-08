/**
 * Generates the next booking reference in the form BG-2026-000001.
 * Must be called with the sequence number already reserved inside the
 * same transaction as the booking insert (see bookings/repository.js).
 */
export function formatBookingReference(year, sequence) {
  return `BG-${year}-${String(sequence).padStart(6, '0')}`;
}
