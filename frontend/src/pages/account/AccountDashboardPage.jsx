import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { bookingsApi } from '../../api/bookings.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';

const ACTIVE_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];

export function AccountDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', 'dashboard'],
    queryFn: () => bookingsApi.list({ perPage: 50 })
  });

  const bookings = data?.data || [];
  const upcoming = bookings
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))[0];
  const outstanding = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status) && b.pricing.balanceMinor > 0);

  return (
    <div>
      <h1 className="text-2xl">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-1 text-sm uppercase tracking-wide text-ink-soft">Upcoming reservation</h2>
          {isLoading && <div className="mt-3 h-16 animate-pulse rounded-md bg-cream-line/40" />}
          {!isLoading && !upcoming && <p className="mt-3 text-sm text-ink-soft">You have no upcoming reservations yet.</p>}
          {upcoming && (
            <Link to={`/account/bookings/${upcoming.reference}`} className="mt-3 block">
              <p className="font-medium">{upcoming.apartment.name}</p>
              <p className="text-sm text-ink-soft">{formatDate(upcoming.checkIn)} — {formatDate(upcoming.checkOut)}</p>
              <div className="mt-2"><StatusChip value={upcoming.status} /></div>
            </Link>
          )}
        </div>
        <div className="card p-6">
          <h2 className="mb-1 text-sm uppercase tracking-wide text-ink-soft">Outstanding payment</h2>
          {isLoading && <div className="mt-3 h-16 animate-pulse rounded-md bg-cream-line/40" />}
          {!isLoading && outstanding.length === 0 && <p className="mt-3 text-sm text-ink-soft">Nothing outstanding.</p>}
          {outstanding.length > 0 && (
            <ul className="mt-3 space-y-2">
              {outstanding.map((b) => (
                <li key={b.id}>
                  <Link to={`/account/bookings/${b.reference}`} className="flex justify-between text-sm hover:text-gold-dark">
                    <span>{b.apartment.name}</span>
                    <span className="font-mono tabular-nums">{formatXAF(b.pricing.balanceMinor)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
