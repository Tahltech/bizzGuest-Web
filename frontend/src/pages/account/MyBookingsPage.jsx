import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';

export function MyBookingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list({ perPage: 50 })
  });

  const bookings = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl">My bookings</h1>

      {isLoading && <div className="mt-6 h-40 animate-pulse rounded-card bg-stone-line/40" />}

      {!isLoading && bookings.length === 0 && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-16 text-center">
          <p className="text-lg">You don't have any bookings yet.</p>
          <Link to="/apartments" className="btn-primary mt-2">Find an apartment</Link>
        </div>
      )}

      {!isLoading && bookings.length > 0 && (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} to={`/account/bookings/${b.reference}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-md">
              <div>
                <p className="font-mono text-xs text-ink-soft">{b.reference}</p>
                <p className="mt-0.5">{b.apartment.name}</p>
                <p className="text-sm text-ink-soft">{formatDate(b.checkIn)} — {formatDate(b.checkOut)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-sm tabular-nums">{formatXAF(b.pricing.totalMinor)}</span>
                <div className="flex gap-1.5">
                  <StatusChip value={b.status} />
                  <StatusChip value={b.paymentStatus} kind="payment" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
