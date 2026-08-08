import { v4 as uuid } from 'uuid';
import { db } from '../../db/knex.js';
import { env } from '../../config/env.js';
import { AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { recordAuditLog } from '../audit/service.js';
import { queueEmail } from '../email/service.js';
import { getPaymentProvider } from '../../lib/paymentProviders/index.js';
import { logger } from '../../lib/logger.js';
import * as repo from './repository.js';

const PAYABLE_BOOKING_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];
// A pending Campay attempt older than this is treated as abandoned rather than blocking a retry forever.
const STALE_PAYMENT_ATTEMPT_MS = 5 * 60 * 1000;
// A manual payment with identical booking/method/amount recorded this recently is almost certainly a double-submit, not a second real payment.
const DUPLICATE_MANUAL_PAYMENT_WINDOW_MS = 15 * 1000;

function toPaymentDTO(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    method: row.method,
    provider: row.provider,
    amountMinor: row.amount_minor,
    currency: row.currency,
    status: row.status,
    providerReference: row.provider_reference,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveBookingId(idOrReference) {
  if (/^\d+$/.test(String(idOrReference))) return Number(idOrReference);
  const row = await db('bookings').where({ reference: idOrReference }).select('id').first();
  if (!row) throw new NotFoundError('Booking not found.');
  return row.id;
}

function assertPayableStatus(booking) {
  if (!PAYABLE_BOOKING_STATUSES.includes(booking.status)) {
    throw new ConflictError(`A booking that is ${booking.status.replace('_', ' ')} can no longer accept payment.`);
  }
}

/** Recomputes the aggregate payment state for a booking from its succeeded payments — never trusts a single payment event's amount in isolation. */
async function recomputeAggregate(bookingId, trx) {
  const succeeded = await repo.listSucceededForBooking(bookingId, trx);
  const paidMinor = succeeded.reduce((sum, p) => sum + p.amount_minor, 0);
  const booking = await repo.findBookingForUpdate(bookingId, trx);
  const paymentStatus = paidMinor <= 0 ? 'unpaid' : paidMinor >= booking.total_minor ? 'paid' : 'partially_paid';
  return { paidMinor, paymentStatus, booking };
}

async function notifyStaffOfPayment(booking, amountMinor, trx) {
  const staffIds = await repo.findStaffUserIdsForNotification(trx);
  if (!staffIds.length) return;
  const body = `${amountMinor.toLocaleString('en-US')} XAF received for ${booking.reference} (${booking.apartment_name}).`;
  await trx('notifications').insert(
    staffIds.map((userId) => ({
      user_id: userId,
      type: 'payment.succeeded',
      title: 'Payment received',
      body,
      related_type: 'booking',
      related_id: booking.id
    }))
  );
}

/** Applies a confirmed successful payment to its booking: recomputes the aggregate, transitions pending/awaiting_payment -> confirmed on full payment, and fires the guest email + staff notification. Called from the webhook handler, the poller, and manual payment recording — the one path all money-received events flow through. */
async function applySuccessfulPayment(bookingId, trx) {
  const { paidMinor, paymentStatus, booking } = await recomputeAggregate(bookingId, trx);
  const updates = { paid_minor: paidMinor, payment_status: paymentStatus };
  const justConfirmed = paymentStatus === 'paid' && ['pending', 'awaiting_payment'].includes(booking.status);
  if (justConfirmed) updates.status = 'confirmed';

  await repo.updateBookingPaymentState(bookingId, updates, trx);
  await recordAuditLog({ action: 'payment.applied', entityType: 'booking', entityId: bookingId, metadata: { paidMinor, paymentStatus } }, trx);

  const fullBooking = await repo.findBookingWithGuest(bookingId, trx);
  await notifyStaffOfPayment(fullBooking, paidMinor, trx);

  if (justConfirmed && fullBooking.guest_email) {
    await queueEmail(
      'booking_confirmation',
      fullBooking.guest_email,
      {
        guestName: fullBooking.guest_name,
        reference: fullBooking.reference,
        apartmentName: fullBooking.apartment_name,
        checkIn: new Date(fullBooking.check_in).toDateString(),
        checkOut: new Date(fullBooking.check_out).toDateString(),
        totalFormatted: `${fullBooking.total_minor.toLocaleString('en-US')} XAF`,
        paidFormatted: `${paidMinor.toLocaleString('en-US')} XAF`
      },
      trx
    );
  }

  return { paidMinor, paymentStatus, justConfirmed };
}

/**
 * Records one provider status event for a payment, idempotently (a replay of
 * the identical status is a no-op via the unique constraint), and applies it
 * if it represents money actually received. Shared by the webhook handler,
 * the polling fallback, and the manual-refresh endpoint — three different
 * ways the same confirmation can arrive, one code path that acts on it.
 */
async function applyProviderStatus(payment, providerStatus, source, trx) {
  const inserted = await repo.insertTransaction(
    {
      payment_id: payment.id,
      provider: payment.provider,
      provider_reference: payment.provider_reference,
      event_status: providerStatus,
      raw_payload: JSON.stringify({ source })
    },
    trx
  );
  if (!inserted) return { applied: false }; // already processed this exact status event

  if (providerStatus === 'succeeded' && payment.status !== 'succeeded') {
    await repo.updatePayment(payment.id, { status: 'succeeded' }, trx);
    const result = await applySuccessfulPayment(payment.booking_id, trx);
    return { applied: true, ...result };
  }

  if (providerStatus === 'failed' && payment.status === 'pending') {
    await repo.updatePayment(payment.id, { status: 'failed' }, trx);
  }

  return { applied: true };
}

export async function initiateMobileMoneyPayment(bookingIdOrReference, { method, phone }, ctx) {
  const bookingId = await resolveBookingId(bookingIdOrReference);
  const booking = await repo.findBookingWithGuest(bookingId);
  if (!booking) throw new NotFoundError('Booking not found.');

  const isOwner = booking.guest_user_id === ctx.userId;
  const isStaff = ctx.permissions?.includes('payments.manage');
  if (!isOwner && !isStaff) throw new ForbiddenError('You do not have permission to pay for this booking.');

  assertPayableStatus(booking);
  const balanceMinor = booking.total_minor - booking.paid_minor;
  if (balanceMinor <= 0) throw new ConflictError('This booking is already fully paid.');

  if (!env.campay.isConfigured) {
    throw new AppError(
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      'Online payment isn’t set up yet. Please contact BizzGuest to arrange payment for this booking.',
      503
    );
  }

  // Reserve the right to start a new attempt before ever touching Campay.
  // The booking row acts as a mutex (same pattern as booking creation, §10):
  // two near-simultaneous "Pay" clicks — a double-click, a network retry, two
  // open tabs — must never both reach the point of firing a collection
  // request. Whichever gets the lock first either hands back the attempt
  // that's already in flight, or reserves a fresh payment row; the loser
  // waits for that transaction to commit and then sees the same result.
  const { reused, existingPayment, paymentId, idempotencyKey } = await db.transaction(async (trx) => {
    await repo.findBookingForUpdate(bookingId, trx);

    const active = await repo.findActivePaymentForBooking(bookingId, 'campay', trx);
    if (active) {
      const ageMs = Date.now() - new Date(active.created_at).getTime();
      if (ageMs < STALE_PAYMENT_ATTEMPT_MS) {
        return { reused: true, existingPayment: active };
      }
      // Stale — superseded, so a fresh attempt isn't blocked forever behind
      // one Campay never confirmed (guest closed the prompt, lost signal, etc).
      await repo.updatePayment(active.id, { status: 'failed' }, trx);
      await repo.insertTransaction(
        {
          payment_id: active.id,
          provider: 'campay',
          provider_reference: active.provider_reference || active.idempotency_key,
          event_status: 'failed',
          raw_payload: JSON.stringify({ reason: 'superseded_by_new_attempt' })
        },
        trx
      );
    }

    const key = uuid();
    const id = await repo.createPayment(
      { booking_id: bookingId, method, provider: 'campay', amount_minor: balanceMinor, currency: 'XAF', status: 'pending', idempotency_key: key },
      trx
    );
    return { reused: false, paymentId: id, idempotencyKey: key };
  });

  if (reused) {
    return toPaymentDTO(existingPayment);
  }

  const campay = getPaymentProvider('campay');

  try {
    const { providerReference, raw } = await campay.createCollection({
      amountMinor: balanceMinor,
      phone,
      description: `BizzGuest booking ${booking.reference}`,
      externalReference: idempotencyKey
    });

    await repo.updatePayment(paymentId, { provider_reference: providerReference });
    await repo.insertTransaction({
      payment_id: paymentId,
      provider: 'campay',
      provider_reference: providerReference,
      event_status: 'created',
      raw_payload: JSON.stringify(raw)
    });

    if (booking.status === 'pending') {
      await db('bookings').where({ id: bookingId }).update({ status: 'awaiting_payment', updated_at: new Date() });
    }

    await recordAuditLog({ userId: ctx.userId, action: 'payment.initiated', entityType: 'payment', entityId: paymentId, ip: ctx.ip, metadata: { bookingId, amountMinor: balanceMinor } });

    return toPaymentDTO(await repo.findById(paymentId));
  } catch (err) {
    logger.error({ err }, `[payments] Campay collection failed for booking ${booking.reference}`);
    await repo.updatePayment(paymentId, { status: 'failed' });
    await repo.insertTransaction({
      payment_id: paymentId,
      provider: 'campay',
      provider_reference: idempotencyKey,
      event_status: 'failed',
      raw_payload: JSON.stringify({ error: String(err.message || err) })
    });
    throw new AppError('PAYMENT_INITIATION_FAILED', 'Could not start the mobile money payment. Please try again in a moment.', 502);
  }
}

export async function recordManualPayment(bookingIdOrReference, { method, amountMinor, notes }, ctx) {
  const bookingId = await resolveBookingId(bookingIdOrReference);

  const { paymentId, duplicate } = await db.transaction(async (trx) => {
    const booking = await repo.findBookingForUpdate(bookingId, trx);
    if (!booking) throw new NotFoundError('Booking not found.');
    assertPayableStatus(booking);

    // Locking the booking row above already serializes concurrent submissions
    // for this booking; this catches the case where two identical requests
    // both land inside that window (double-click, retried request) — each
    // individually valid against the balance, but not two real payments.
    const recent = await repo.findRecentDuplicateManualPayment(bookingId, { method, amountMinor }, DUPLICATE_MANUAL_PAYMENT_WINDOW_MS, trx);
    if (recent) {
      return { paymentId: recent.id, duplicate: true };
    }

    const balanceMinor = booking.total_minor - booking.paid_minor;
    if (amountMinor > balanceMinor) {
      throw new ValidationError(`Amount exceeds the outstanding balance of ${balanceMinor.toLocaleString('en-US')} XAF.`);
    }

    const idempotencyKey = uuid();
    const id = await repo.createPayment(
      {
        booking_id: bookingId,
        method,
        provider: 'manual',
        amount_minor: amountMinor,
        currency: 'XAF',
        status: 'succeeded',
        idempotency_key: idempotencyKey,
        recorded_by: ctx.userId,
        notes
      },
      trx
    );

    await repo.insertTransaction(
      { payment_id: id, provider: 'manual', provider_reference: idempotencyKey, event_status: 'succeeded', raw_payload: JSON.stringify({ recordedBy: ctx.userId }) },
      trx
    );

    await applySuccessfulPayment(bookingId, trx);
    await recordAuditLog({ userId: ctx.userId, action: 'payment.recorded_manual', entityType: 'payment', entityId: id, ip: ctx.ip, metadata: { bookingId, amountMinor, method } }, trx);

    return { paymentId: id, duplicate: false };
  });

  // Idempotent, same as the mobile-money path: a duplicate submission hands
  // back the payment that already exists rather than erroring or double-
  // counting the money.
  if (duplicate) logger.warn(`[payments] duplicate manual payment submission suppressed for booking ${bookingId}`);

  return toPaymentDTO(await repo.findById(paymentId));
}

export async function refundPayment(paymentId, { reason }, ctx) {
  await db.transaction(async (trx) => {
    const payment = await repo.findByIdForUpdate(paymentId, trx);
    if (!payment) throw new NotFoundError('Payment not found.');
    if (payment.status !== 'succeeded') throw new ConflictError('Only a succeeded payment can be refunded.');

    await repo.updatePayment(paymentId, { status: 'refunded', notes: reason }, trx);
    await repo.insertTransaction(
      {
        payment_id: paymentId,
        provider: payment.provider,
        // Manual payments never get a provider_reference (only Campay collections do) — fall back to the
        // always-present idempotency_key so this NOT NULL column is never violated.
        provider_reference: payment.provider_reference || payment.idempotency_key,
        event_status: 'refunded',
        raw_payload: JSON.stringify({ reason, refundedBy: ctx.userId })
      },
      trx
    );

    const { paidMinor, paymentStatus } = await recomputeAggregate(payment.booking_id, trx);
    const finalStatus = paidMinor === 0 ? 'refunded' : paymentStatus;
    await repo.updateBookingPaymentState(payment.booking_id, { paid_minor: paidMinor, payment_status: finalStatus }, trx);

    await recordAuditLog({ userId: ctx.userId, action: 'payment.refunded', entityType: 'payment', entityId: paymentId, ip: ctx.ip, metadata: { reason } }, trx);
  });

  return toPaymentDTO(await repo.findById(paymentId));
}

async function assertCanAccessPayment(payment, ctx) {
  const booking = await repo.findBookingWithGuest(payment.booking_id);
  const isOwner = booking.guest_user_id === ctx.userId;
  const isStaff = ctx.permissions?.includes('payments.view');
  if (!isOwner && !isStaff) throw new ForbiddenError('You do not have permission to view this payment.');
}

export async function refreshPaymentStatus(paymentId, ctx) {
  const payment = await repo.findById(paymentId);
  if (!payment) throw new NotFoundError('Payment not found.');
  await assertCanAccessPayment(payment, ctx);

  if (payment.provider !== 'campay' || payment.status !== 'pending') {
    return toPaymentDTO(payment);
  }

  const campay = getPaymentProvider('campay');
  const { status } = await campay.getTransactionStatus(payment.provider_reference);
  if (status !== 'pending') {
    await db.transaction((trx) => applyProviderStatus(payment, status, 'manual-refresh', trx));
  }

  return toPaymentDTO(await repo.findById(paymentId));
}

export async function listPaymentsForBooking(bookingIdOrReference, ctx) {
  const bookingId = await resolveBookingId(bookingIdOrReference);
  const booking = await repo.findBookingWithGuest(bookingId);
  if (!booking) throw new NotFoundError('Booking not found.');

  const isOwner = booking.guest_user_id === ctx.userId;
  const isStaff = ctx.permissions?.includes('payments.view');
  if (!isOwner && !isStaff) throw new ForbiddenError('You do not have permission to view these payments.');

  const rows = await repo.listForBooking(bookingId);
  return rows.map(toPaymentDTO);
}

function toPaymentListDTO(row) {
  return { ...toPaymentDTO(row), bookingReference: row.booking_reference, apartmentName: row.apartment_name };
}

/** Every payment the signed-in guest has ever made, across all their bookings — powers the account "Payments" page. */
export async function listMyPayments(query, ctx) {
  const { rows, total } = await repo.listForUser(ctx.userId, query);
  return { data: rows.map(toPaymentListDTO), meta: { page: query.page, perPage: query.perPage, total } };
}

/** Every payment in the system — the staff payments overview, gated by payments.view at the route level. */
export async function listAllPayments(query) {
  const { rows, total } = await repo.listAll(query);
  return { data: rows.map(toPaymentListDTO), meta: { page: query.page, perPage: query.perPage, total } };
}

/** Handles a Campay webhook delivery: verifies the shared signing key, then re-confirms a claimed "succeeded" via the authoritative status endpoint before trusting it (see CampayProvider's documentation for why). */
export async function handleCampayWebhook(req) {
  const campay = getPaymentProvider('campay');

  let signatureValid;
  try {
    signatureValid = campay.verifyWebhookSignature(req);
  } catch (err) {
    // CAMPAY_WEBHOOK_KEY not set yet — a real config gap, not a forged
    // request, but the response must stay generic either way.
    logger.warn(`[payments] webhook received but Campay isn't fully configured: ${err.message}`);
    throw new AppError('PAYMENT_PROVIDER_NOT_CONFIGURED', 'Webhook signature verification is not configured.', 503);
  }
  if (!signatureValid) {
    throw new AppError('INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed.', 401);
  }

  const event = campay.parseWebhookEvent(req.body);
  const payment = await repo.findByProviderReference('campay', event.providerReference);
  if (!payment) {
    logger.warn(`[payments] webhook for unknown provider_reference=${event.providerReference}`);
    return { received: true };
  }

  let finalStatus = event.status;
  if (finalStatus === 'succeeded') {
    const confirmed = await campay.getTransactionStatus(event.providerReference);
    finalStatus = confirmed.status;
  }

  await db.transaction((trx) => applyProviderStatus(payment, finalStatus, 'webhook', trx));
  return { received: true };
}

/** Fallback for when Campay's dashboard isn't (yet) pointed at a public webhook URL — polled by the worker so payments still resolve automatically. */
export async function pollPendingCampayPayments() {
  if (!env.campay.isConfigured) return 0;

  const campay = getPaymentProvider('campay');
  const pending = await repo.listPendingCampayPayments(2 * 60 * 1000);

  for (const payment of pending) {
    try {
      const { status } = await campay.getTransactionStatus(payment.provider_reference);
      if (status === 'pending') continue;
      await db.transaction((trx) => applyProviderStatus(payment, status, 'poll', trx));
    } catch (err) {
      logger.warn({ err }, `[payments] poll failed for payment ${payment.id}`);
    }
  }

  return pending.length;
}
