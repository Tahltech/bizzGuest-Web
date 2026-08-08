import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments.js';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';
import { PAYMENT_METHOD_LABELS } from '../../utils/paymentLabels.js';

export function ReceiptsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-receipts'],
    queryFn: () => paymentsApi.listMine({ status: 'succeeded', perPage: 50 })
  });

  const receipts = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl">Receipts</h1>

      {isLoading && <div className="mt-6 h-40 animate-pulse rounded-card bg-cream-line/40" />}

      {!isLoading && receipts.length === 0 && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-16 text-center">
          <p className="text-lg">You don't have any receipts yet.</p>
          <p className="max-w-sm text-sm text-ink-soft">
            A receipt appears here as soon as a payment toward one of your bookings is confirmed.
          </p>
          <Link to="/apartments" className="btn-primary mt-2">Find an apartment</Link>
        </div>
      )}

      {!isLoading && receipts.length > 0 && (
        <div className="mt-6 space-y-3">
          {receipts.map((r) => (
            <Link
              key={r.id}
              to={`/account/bookings/${r.bookingReference}`}
              className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-gold/50 hover:shadow-lg"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-gold-dark">Receipt</p>
                <p className="mt-0.5 font-mono text-xs text-ink-soft">{r.bookingReference}</p>
                <p className="mt-1">{r.apartmentName}</p>
                <p className="text-sm text-ink-soft">{PAYMENT_METHOD_LABELS[r.method] || r.method} · {formatDate(r.createdAt)}</p>
              </div>
              <span className="font-mono text-lg tabular-nums">{formatXAF(r.amountMinor)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
