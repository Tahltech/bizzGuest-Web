import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings.js';
import { extractErrorMessage } from '../api/client.js';
import { StatusChip } from './StatusChip.jsx';
import { PaymentsPanel } from './PaymentsPanel.jsx';
import { formatXAF, formatDate } from '../utils/formatCurrency.js';

const CANCELLABLE = ['pending', 'awaiting_payment', 'confirmed'];

export function BookingDetail({ backTo, backLabel, showGuestContact = false }) {
  const { reference } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', reference],
    queryFn: () => bookingsApi.detail(reference)
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => bookingsApi.cancel(reference, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', reference] }),
    onError: (err) => setError(extractErrorMessage(err, 'Could not cancel this booking.'))
  });

  if (isLoading || !booking) {
    return <div className="h-64 animate-pulse rounded-card bg-cream-line/40" />;
  }

  function onCancel() {
    const reason = window.prompt('Reason for cancelling (visible in the booking history):', 'Change of plans');
    if (reason) cancelMutation.mutate(reason);
  }

  return (
    <div>
      <Link to={backTo} className="text-sm text-ink-soft hover:text-ink">← {backLabel}</Link>

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-ink-soft">{booking.reference}</p>
            <h1 className="mt-1 text-2xl">{booking.apartment.name}</h1>
            {showGuestContact && (
              <p className="mt-1 text-sm text-ink-soft">{booking.guest.name} · {booking.guest.email}{booking.guest.phone ? ` · ${booking.guest.phone}` : ''}</p>
            )}
          </div>
          <div className="flex gap-2">
            <StatusChip value={booking.status} />
            <StatusChip value={booking.paymentStatus} kind="payment" />
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:block"><span className="text-ink-soft">Check-in</span><span className="sm:block sm:font-medium">{formatDate(booking.checkIn)}</span></div>
          <div className="flex justify-between sm:block"><span className="text-ink-soft">Check-out</span><span className="sm:block sm:font-medium">{formatDate(booking.checkOut)}</span></div>
          <div className="flex justify-between sm:block"><span className="text-ink-soft">Nights</span><span className="sm:block sm:font-medium">{booking.nights}</span></div>
          <div className="flex justify-between sm:block"><span className="text-ink-soft">Guests</span><span className="sm:block sm:font-medium">{booking.guestsCount}</span></div>
        </div>

        <div className="mt-6 space-y-1 border-t border-cream-line pt-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Room subtotal</span><span className="font-mono tabular-nums">{formatXAF(booking.pricing.roomSubtotalMinor)}</span></div>
          {booking.pricing.discountMinor > 0 && <div className="flex justify-between"><span className="text-ink-soft">Discount</span><span className="font-mono tabular-nums">-{formatXAF(booking.pricing.discountMinor)}</span></div>}
          {booking.pricing.taxMinor > 0 && <div className="flex justify-between"><span className="text-ink-soft">Tax</span><span className="font-mono tabular-nums">{formatXAF(booking.pricing.taxMinor)}</span></div>}
          <div className="flex justify-between border-t border-cream-line pt-2 text-base font-medium"><span>Total</span><span className="font-mono tabular-nums">{formatXAF(booking.pricing.totalMinor)}</span></div>
          <div className="flex justify-between text-ink-soft"><span>Paid so far</span><span className="font-mono tabular-nums">{formatXAF(booking.pricing.paidMinor)}</span></div>
          <div className="flex justify-between font-medium"><span>Balance due</span><span className="font-mono tabular-nums">{formatXAF(booking.pricing.balanceMinor)}</span></div>
        </div>

        {booking.status === 'cancelled' && booking.cancelledReason && (
          <p className="mt-4 text-sm text-ink-soft">Cancelled: {booking.cancelledReason}</p>
        )}

        {error && <p className="mt-4 text-sm text-status-danger">{error}</p>}

        {CANCELLABLE.includes(booking.status) && (
          <button onClick={onCancel} disabled={cancelMutation.isPending} className="btn-secondary mt-6 !border-status-danger !text-status-danger hover:!bg-status-danger hover:!text-white">
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel reservation'}
          </button>
        )}
      </div>

      <PaymentsPanel booking={booking} />
    </div>
  );
}
