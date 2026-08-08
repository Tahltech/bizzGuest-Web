import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../../api/payments.js';
import { formatXAF, formatDate } from '../../../utils/formatCurrency.js';
import { PAYMENT_METHOD_LABELS } from '../../../utils/paymentLabels.js';

export function ReceiptsIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'receipts'],
    queryFn: () => paymentsApi.listAll({ status: 'succeeded', perPage: 50 })
  });

  const receipts = data?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl">Receipts</h1>
      <p className="mt-1 text-sm text-ink-soft">Every confirmed payment, formatted as a receipt.</p>

      <div className="mt-6 overflow-x-auto rounded-card border border-cream-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-cream-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Apartment</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">Loading…</td></tr>}
            {!isLoading && receipts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-soft">
                  No granted receipts yet — a receipt is created the moment a guest's payment is confirmed.
                </td>
              </tr>
            )}
            {receipts.map((r) => (
              <tr key={r.id} className="border-b border-cream-line last:border-0 hover:bg-cream/60">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/reservations/${r.bookingReference}`} className="font-mono text-xs text-gold-dark hover:underline">{r.bookingReference}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.apartmentName}</td>
                <td className="px-4 py-3">{PAYMENT_METHOD_LABELS[r.method] || r.method}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatXAF(r.amountMinor)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
