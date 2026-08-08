import { db } from '../../db/knex.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { recordAuditLog } from '../audit/service.js';
import * as availabilityRepo from '../availability/repository.js';
import * as repo from './repository.js';
import { computeBookingPrice } from './pricing.js';

function toBookingDTO(row) {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    paymentStatus: row.payment_status,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    guestsCount: row.guests_count,
    pricing: {
      currency: row.currency,
      roomSubtotalMinor: row.room_subtotal_minor,
      discountMinor: row.discount_minor,
      taxMinor: row.tax_minor,
      feesMinor: row.fees_minor,
      depositMinor: row.deposit_minor,
      totalMinor: row.total_minor,
      paidMinor: row.paid_minor,
      balanceMinor: row.total_minor - row.paid_minor
    },
    apartment: { id: row.apartment_id, name: row.apartment_name, code: row.apartment_code, slug: row.apartment_slug },
    guest: { id: row.guest_id, name: row.guest_name, email: row.guest_email, phone: row.guest_phone, userId: row.guest_user_id },
    source: row.source,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    cancelledReason: row.cancelled_reason,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * The one and only path that may create a booking. Implements architecture
 * §10: lock the apartment row, re-check the exact availability predicate
 * inside that lock, and only then write — so two concurrent requests for the
 * same apartment/dates can never both succeed.
 */
export async function createBooking(input, ctx) {
  const apartment = await repo.getApartmentForPricing(input.apartmentId);
  if (!apartment || apartment.deleted_at || !apartment.is_active) throw new NotFoundError('Apartment not found.');
  if (input.guestsCount > apartment.max_guests) {
    throw new ValidationError(`This apartment sleeps up to ${apartment.max_guests} guests.`);
  }

  const bookingId = await db.transaction(async (trx) => {
    await availabilityRepo.lockApartment(input.apartmentId, trx);

    const available = await availabilityRepo.isApartmentAvailable(input.apartmentId, { checkIn: input.checkIn, checkOut: input.checkOut }, trx);
    if (!available) {
      throw new ConflictError('This apartment was just booked for the selected dates. Please choose another apartment or dates.', 'BOOKING_CONFLICT');
    }

    const [freshApartment, pricingRules, guestId] = await Promise.all([
      repo.getApartmentForPricing(input.apartmentId, trx),
      repo.getActivePricingRules(input.apartmentId, trx),
      repo.findOrCreateGuestForUser({ userId: ctx.userId, fullName: ctx.fullName, email: ctx.email, phone: ctx.phone }, trx)
    ]);

    const pricing = await computeBookingPrice({ apartment: freshApartment, checkIn: input.checkIn, checkOut: input.checkOut, pricingRules });
    const reference = await repo.nextBookingReference(trx);

    const id = await repo.insertBooking(
      {
        reference,
        apartment_id: input.apartmentId,
        guest_id: guestId,
        check_in: input.checkIn,
        check_out: input.checkOut,
        nights: pricing.nights,
        guests_count: input.guestsCount,
        status: 'pending',
        payment_status: 'unpaid',
        room_subtotal_minor: pricing.roomSubtotalMinor,
        tax_minor: pricing.taxMinor,
        discount_minor: pricing.discountMinor,
        fees_minor: pricing.feesMinor,
        deposit_minor: pricing.depositMinor,
        total_minor: pricing.totalMinor,
        paid_minor: 0,
        currency: 'XAF',
        source: ctx.source || 'website'
      },
      trx
    );

    const guestNames = [{ fullName: ctx.fullName, isPrimary: true }, ...input.additionalGuestNames.map((name) => ({ fullName: name, isPrimary: false }))];
    await repo.insertBookingGuests(id, guestNames, trx);

    const holdMinutes = await repo.getHoldMinutes(trx);
    await repo.insertBookingHold({ bookingId: id, apartmentId: input.apartmentId, expiresAt: new Date(Date.now() + holdMinutes * 60 * 1000) }, trx);

    await recordAuditLog(
      { userId: ctx.userId, action: 'booking.created', entityType: 'booking', entityId: id, ip: ctx.ip, metadata: { reference, totalMinor: pricing.totalMinor } },
      trx
    );

    return id;
  });

  return toBookingDTO(await repo.findById(bookingId));
}

function assertCanView(booking, ctx) {
  const isOwner = booking.guest_user_id === ctx.userId;
  const isStaff = ctx.permissions?.includes('bookings.view');
  if (!isOwner && !isStaff) throw new ForbiddenError('You do not have permission to view this booking.');
}

export async function getBooking(idOrReference, ctx) {
  const isNumeric = /^\d+$/.test(String(idOrReference));
  const row = isNumeric ? await repo.findById(idOrReference) : await repo.findByReference(idOrReference);
  if (!row) throw new NotFoundError('Booking not found.');
  assertCanView(row, ctx);
  return toBookingDTO(row);
}

export async function listBookings(query, ctx) {
  const isStaff = ctx.permissions?.includes('bookings.view');
  let guestId = query.guestId;

  if (!isStaff) {
    const guest = await db('guests').where({ user_id: ctx.userId }).first();
    guestId = guest?.id ?? -1; // no guest profile yet -> guaranteed-empty result, not an error
  }

  const { rows, total } = await repo.list({ ...query, guestId });
  return { data: rows.map(toBookingDTO), meta: { page: query.page, perPage: query.perPage, total } };
}

const CANCELLABLE_STATUSES = ['pending', 'awaiting_payment', 'confirmed'];

export async function cancelBooking(idOrReference, { reason }, ctx) {
  const isNumeric = /^\d+$/.test(String(idOrReference));
  const existing = isNumeric ? await repo.findById(idOrReference) : await repo.findByReference(idOrReference);
  if (!existing) throw new NotFoundError('Booking not found.');

  const isOwner = existing.guest_user_id === ctx.userId;
  const canCancelAsStaff = ctx.permissions?.includes('bookings.cancel');
  if (!isOwner && !canCancelAsStaff) throw new ForbiddenError('You do not have permission to cancel this booking.');

  if (!CANCELLABLE_STATUSES.includes(existing.status)) {
    throw new ConflictError(`A booking that is ${existing.status.replace('_', ' ')} can no longer be cancelled.`);
  }

  await db.transaction(async (trx) => {
    await repo.updateStatus(
      existing.id,
      { status: 'cancelled', cancelled_reason: reason, cancelled_by: ctx.userId, cancelled_at: new Date() },
      trx
    );
    await repo.releaseHoldForBooking(existing.id, trx);
    await recordAuditLog({ userId: ctx.userId, action: 'booking.cancelled', entityType: 'booking', entityId: existing.id, ip: ctx.ip, metadata: { reason } }, trx);
  });

  return toBookingDTO(await repo.findById(existing.id));
}
