import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../../api/payments.js';
import { formatXAF, formatDate } from '../../../utils/formatCurrency.js';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_STYLES } from '../../../utils/paymentLabels.js';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
];

export function PaymentsIndexPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'payments', status],
    queryFn: () => paymentsApi.listAll({ perPage: 50, ...(status ? { status } : {}) })
  });

  const payments = data?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl">Payments</h1>

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
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-cream-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Apartment</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">Loading…</td></tr>}
            {!isLoading && payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-soft">
                  {status ? 'No payments match this filter.' : "No payments have come in yet — they'll show up here as guests pay for their bookings."}
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-cream-line last:border-0 hover:bg-cream/60">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/reservations/${p.bookingReference}`} className="font-mono text-xs text-gold-dark hover:underline">{p.bookingReference}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.apartmentName}</td>
                <td className="px-4 py-3">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatXAF(p.amountMinor)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[p.status] || ''}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
