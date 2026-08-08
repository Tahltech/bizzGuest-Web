import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../../api/bookings.js';
import { StatusChip } from '../../../components/StatusChip.jsx';
import { formatXAF, formatDate } from '../../../utils/formatCurrency.js';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'cancelled', label: 'Cancelled' }
];

export function ReservationsIndexPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'reservations', status],
    queryFn: () => bookingsApi.list({ perPage: 50, ...(status ? { status } : {}) })
  });

  const bookings = data?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl">Reservations</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${status === f.value ? 'bg-navy text-cream' : 'bg-white text-ink-soft hover:bg-cream-line/50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-cream-line bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-cream-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Apartment</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">Loading…</td></tr>}
            {!isLoading && bookings.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No reservations match this filter.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-cream-line last:border-0 hover:bg-cream/60">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/reservations/${b.reference}`} className="font-mono text-xs text-gold-dark hover:underline">{b.reference}</Link>
                </td>
                <td className="px-4 py-3">{b.guest?.name}</td>
                <td className="px-4 py-3 text-ink-soft">{b.apartment?.name}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(b.checkIn)} — {formatDate(b.checkOut)}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatXAF(b.pricing.totalMinor)}</td>
                <td className="px-4 py-3"><StatusChip value={b.status} /></td>
                <td className="px-4 py-3"><StatusChip value={b.paymentStatus} kind="payment" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
