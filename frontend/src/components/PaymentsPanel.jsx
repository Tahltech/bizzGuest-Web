import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatXAF, formatDate } from '../utils/formatCurrency.js';

const PAYMENT_METHOD_LABELS = {
  mtn_momo: 'MTN Mobile Money',
  orange_money: 'Orange Money',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  manual: 'Manual'
};

const PAYMENT_STATUS_STYLES = {
  pending: 'bg-status-warn/15 text-status-warn',
  processing: 'bg-status-warn/15 text-status-warn',
  succeeded: 'bg-status-good/15 text-status-good',
  failed: 'bg-status-danger/15 text-status-danger',
  refunded: 'bg-ink-soft/15 text-ink-soft'
};

function MobileMoneyForm({ booking, onDone }) {
  const [method, setMethod] = useState('mtn_momo');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentsApi.initiateMobileMoney(booking.reference, { method, phone }),
    onSuccess: () => {
      setPhone('');
      onDone();
    },
    onError: (err) => setError(extractErrorMessage(err, 'Could not start this payment.'))
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }}
      className="card p-4"
    >
      <h4 className="text-sm font-medium">Pay with mobile money</h4>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="momoMethod">Provider</label>
          <select id="momoMethod" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="mtn_momo">MTN Mobile Money</option>
            <option value="orange_money">Orange Money</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="momoPhone">Phone number</label>
          <input id="momoPhone" className="input" placeholder="6XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-status-danger">{error}</p>}
      <button type="submit" disabled={mutation.isPending} className="btn-primary mt-3 w-full disabled:opacity-60">
        {mutation.isPending ? 'Sending request…' : `Pay ${formatXAF(booking.pricing.balanceMinor)}`}
      </button>
      <p className="mt-2 text-xs text-ink-soft">You'll get a prompt on your phone to approve the payment.</p>
    </form>
  );
}

function ManualPaymentForm({ booking, onDone }) {
  const [method, setMethod] = useState('cash');
  const [amountMinor, setAmountMinor] = useState(booking.pricing.balanceMinor);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentsApi.recordManual(booking.reference, { method, amountMinor: Number(amountMinor), notes: notes || undefined }),
    onSuccess: onDone,
    onError: (err) => setError(extractErrorMessage(err, 'Could not record this payment.'))
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }}
      className="card p-4"
    >
      <h4 className="text-sm font-medium">Record a manual payment</h4>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="manualMethod">Method</label>
          <select id="manualMethod" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="manualAmount">Amount (XAF)</label>
          <input id="manualAmount" type="number" min="1" max={booking.pricing.balanceMinor} className="input" value={amountMinor} onChange={(e) => setAmountMinor(e.target.value)} required />
        </div>
      </div>
      <div className="mt-3">
        <label className="label" htmlFor="manualNotes">Notes (optional)</label>
        <input id="manualNotes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="mt-2 text-sm text-status-danger">{error}</p>}
      <button type="submit" disabled={mutation.isPending} className="btn-secondary mt-3 w-full disabled:opacity-60">
        {mutation.isPending ? 'Recording…' : 'Record payment'}
      </button>
    </form>
  );
}

function PaymentRow({ payment, canRefund, onChanged }) {
  const [error, setError] = useState('');

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.refresh(payment.id),
    onSuccess: onChanged
  });

  const refundMutation = useMutation({
    mutationFn: (reason) => paymentsApi.refund(payment.id, reason),
    onSuccess: onChanged,
    onError: (err) => setError(extractErrorMessage(err, 'Could not refund this payment.'))
  });

  function onRefundClick() {
    const reason = window.prompt('Reason for refund:', 'Guest requested refund');
    if (reason) { setError(''); refundMutation.mutate(reason); }
  }

  return (
    <div className="flex flex-col gap-1 border-b border-cream-line py-3 last:border-0">
      <div className="flex items-center justify-between text-sm">
        <span>{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
        <span className="font-mono tabular-nums">{formatXAF(payment.amountMinor)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[payment.status] || ''}`}>
          {payment.status}
        </span>
        <span className="text-xs text-ink-faint">{formatDate(payment.createdAt)}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-3">
        {payment.status === 'pending' && payment.provider === 'campay' && (
          <button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} className="text-xs text-gold-dark hover:underline disabled:opacity-60">
            {refreshMutation.isPending ? 'Checking…' : "I've completed this payment — check status"}
          </button>
        )}
        {payment.status === 'succeeded' && canRefund && (
          <button onClick={onRefundClick} disabled={refundMutation.isPending} className="text-xs text-status-danger hover:underline disabled:opacity-60">
            {refundMutation.isPending ? 'Refunding…' : 'Refund'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}

const PAYABLE_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];

export function PaymentsPanel({ booking }) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission('payments.manage');
  const canRefund = hasPermission('payments.refund');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', booking.reference],
    queryFn: () => paymentsApi.listForBooking(booking.reference)
  });

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['payments', booking.reference] });
    queryClient.invalidateQueries({ queryKey: ['booking', booking.reference] });
  }

  const canPay = PAYABLE_STATUSES.includes(booking.status) && booking.pricing.balanceMinor > 0;

  return (
    <div className="mt-4">
      <h3 className="text-sm uppercase tracking-wide text-ink-soft">Payments</h3>

      {isLoading && <div className="mt-2 h-16 animate-pulse rounded-card bg-cream-line/40" />}

      {!isLoading && payments?.length > 0 && (
        <div className="card mt-2 p-4">
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} canRefund={canRefund} onChanged={refetchAll} />
          ))}
        </div>
      )}

      {!isLoading && payments?.length === 0 && (
        <p className="mt-2 text-sm text-ink-soft">No payments recorded yet.</p>
      )}

      {canPay && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MobileMoneyForm booking={booking} onDone={refetchAll} />
          {canManage && <ManualPaymentForm booking={booking} onDone={refetchAll} />}
        </div>
      )}
    </div>
  );
}
