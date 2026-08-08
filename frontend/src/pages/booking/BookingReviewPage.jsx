import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apartmentsApi } from '../../api/apartments.js';
import { bookingsApi } from '../../api/bookings.js';
import { extractErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';

export function BookingReviewPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const checkIn = params.get('checkIn');
  const checkOut = params.get('checkOut');
  const guestsCount = Number(params.get('guests') || 1);

  const [additionalGuestNames, setAdditionalGuestNames] = useState(Array(Math.max(0, guestsCount - 1)).fill(''));
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');

  const { data: apartment, isLoading } = useQuery({
    queryKey: ['apartment', slug],
    queryFn: () => apartmentsApi.detail(slug)
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      bookingsApi.create({
        apartmentId: apartment.id,
        checkIn,
        checkOut,
        guestsCount,
        additionalGuestNames: additionalGuestNames.filter(Boolean)
      }),
    onSuccess: (booking) => navigate(`/account/bookings/${booking.reference}`, { replace: true }),
    onError: (err) => {
      if (err?.response?.data?.error?.code === 'BOOKING_CONFLICT') {
        setConflict(true);
      } else {
        setError(extractErrorMessage(err, 'Could not create your booking.'));
      }
    }
  });

  if (!checkIn || !checkOut) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-lg">Select your dates first.</p>
        <Link to={`/apartments/${slug}`} className="btn-primary mt-4 inline-flex">Back to apartment</Link>
      </div>
    );
  }

  if (isLoading || !apartment) {
    return <div className="mx-auto max-w-xl px-6 py-16"><div className="h-64 animate-pulse rounded-card bg-stone-line/40" /></div>;
  }

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const estimatedTotal = apartment.pricing.nightMinor * nights;

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <Link to={`/apartments/${slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsCount}`} className="text-sm text-ink-soft hover:text-ink">← Back</Link>
      <h1 className="mt-2 text-3xl">Review your reservation</h1>

      <div className="card mt-6 p-6">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{apartment.apartmentType?.name}</p>
        <h2 className="mt-1 text-xl">{apartment.name}</h2>

        <div className="mt-4 space-y-2 border-t border-stone-line pt-4 text-sm">
          <div className="flex justify-between text-ink-soft"><span>Check-in</span><span>{formatDate(checkIn)}</span></div>
          <div className="flex justify-between text-ink-soft"><span>Check-out</span><span>{formatDate(checkOut)}</span></div>
          <div className="flex justify-between text-ink-soft"><span>Nights</span><span>{nights}</span></div>
          <div className="flex justify-between text-ink-soft"><span>Guests</span><span>{guestsCount}</span></div>
        </div>

        <div className="mt-4 space-y-1 border-t border-stone-line pt-4 text-sm">
          <div className="flex justify-between"><span>Room ({nights} night{nights > 1 ? 's' : ''})</span><span className="font-mono tabular-nums">{formatXAF(estimatedTotal)}</span></div>
          <div className="mt-2 flex justify-between border-t border-stone-line pt-2 text-base font-medium"><span>Estimated total</span><span className="font-mono tabular-nums">{formatXAF(estimatedTotal)}</span></div>
          <p className="text-xs text-ink-soft">Taxes, discounts, and fees (if any) are finalized when your reservation is created.</p>
        </div>
      </div>

      <div className="card mt-4 p-6">
        <h3 className="text-sm uppercase tracking-wide text-ink-soft">Guest details</h3>
        <p className="mt-2 text-sm">{user?.fullName} <span className="text-ink-soft">(primary guest, you)</span></p>
        {additionalGuestNames.map((name, i) => (
          <div key={i} className="mt-2">
            <label className="label" htmlFor={`guest-${i}`}>Guest {i + 2} name (optional)</label>
            <input
              id={`guest-${i}`}
              className="input"
              value={name}
              onChange={(e) => setAdditionalGuestNames((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
            />
          </div>
        ))}
      </div>

      {conflict && (
        <div className="card mt-4 border-status-danger p-6 text-sm">
          <p className="font-medium text-status-danger">This apartment was just booked for these dates.</p>
          <p className="mt-1 text-ink-soft">Someone else completed a reservation moments ago. Please choose different dates or another apartment.</p>
          <Link to={`/apartments?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsCount}`} className="btn-secondary mt-3 inline-flex">
            See other available apartments
          </Link>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-status-danger">{error}</p>}

      <button
        type="button"
        onClick={() => { setConflict(false); setError(''); bookMutation.mutate(); }}
        disabled={bookMutation.isPending}
        className="btn-primary mt-6 w-full disabled:opacity-60"
      >
        {bookMutation.isPending ? 'Reserving…' : 'Confirm reservation'}
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft">Your apartment is held for 10 minutes to complete payment.</p>
    </div>
  );
}
