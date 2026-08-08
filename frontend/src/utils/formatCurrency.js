/** XAF has no minor subunit in everyday use — amounts are stored and passed around as whole-unit integers. */
export function formatXAF(amountMinor) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amountMinor || 0) + ' XAF';
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
