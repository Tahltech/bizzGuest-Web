const BOOKING_STATUS_STYLES = {
  pending: 'bg-status-warn/15 text-status-warn',
  awaiting_payment: 'bg-status-warn/15 text-status-warn',
  confirmed: 'bg-status-good/15 text-status-good',
  checked_in: 'bg-forest/15 text-forest',
  checked_out: 'bg-ink-soft/15 text-ink-soft',
  cancelled: 'bg-status-danger/15 text-status-danger',
  no_show: 'bg-status-danger/15 text-status-danger',
  completed: 'bg-status-good/15 text-status-good',
  expired: 'bg-ink-soft/15 text-ink-soft'
};

const PAYMENT_STATUS_STYLES = {
  unpaid: 'bg-status-warn/15 text-status-warn',
  partially_paid: 'bg-status-warn/15 text-status-warn',
  paid: 'bg-status-good/15 text-status-good',
  refunded: 'bg-ink-soft/15 text-ink-soft',
  failed: 'bg-status-danger/15 text-status-danger'
};

export function StatusChip({ value, kind = 'booking' }) {
  const styles = kind === 'payment' ? PAYMENT_STATUS_STYLES : BOOKING_STATUS_STYLES;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[value] || 'bg-ink-soft/15 text-ink-soft'}`}>
      {value?.replace('_', ' ')}
    </span>
  );
}
