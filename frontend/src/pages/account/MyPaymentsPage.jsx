import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments.js';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_STYLES } from '../../utils/paymentLabels.js';

export function MyPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsApi.listMine({ perPage: 50 })
  });

  const payments = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl">Payments</h1>

      {isLoading && <div className="mt-6 h-40 animate-pulse rounded-card bg-cream-line/40" />}

      {!isLoading && payments.length === 0 && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-16 text-center">
          <p className="text-lg">You don't have any payments yet.</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Once you make a payment toward a booking, it'll show up here with its status and receipt details.
          </p>
          <Link to="/apartments" className="btn-primary mt-2">Find an apartment</Link>
        </div>
      )}

      {!isLoading && payments.length > 0 && (
        <div className="mt-6 space-y-3">
          {payments.map((p) => (
            <Link
              key={p.id}
              to={`/account/bookings/${p.bookingReference}`}
              className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-gold/50 hover:shadow-lg"
            >
              <div>
                <p className="font-mono text-xs text-ink-soft">{p.bookingReference}</p>
                <p className="mt-0.5">{p.apartmentName}</p>
                <p className="text-sm text-ink-soft">{PAYMENT_METHOD_LABELS[p.method] || p.method} · {formatDate(p.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-sm tabular-nums">{formatXAF(p.amountMinor)}</span>
                <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[p.status] || ''}`}>
                  {p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
