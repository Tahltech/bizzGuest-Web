import { getSetting } from '../../lib/settings.js';

function nightsList(checkIn, checkOut) {
  const nights = [];
  const cursor = new Date(checkIn);
  const end = new Date(checkOut);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

function applyModifier(baseMinor, rule) {
  if (rule.modifier_type === 'percent') return Math.round(baseMinor * (1 + rule.modifier_value / 100));
  return Math.max(0, baseMinor + rule.modifier_value);
}

/** Seasonal rules take priority over the standing weekend rate when both would apply to the same night. */
function priceForNight(baseMinor, date, pricingRules) {
  const seasonal = pricingRules.find(
    (r) => r.rule_type === 'seasonal' && r.starts_on && r.ends_on && date >= new Date(r.starts_on) && date < new Date(r.ends_on)
  );
  if (seasonal) return applyModifier(baseMinor, seasonal);

  const isFridayOrSaturday = [5, 6].includes(date.getDay());
  if (isFridayOrSaturday) {
    const weekend = pricingRules.find((r) => r.rule_type === 'weekend');
    if (weekend) return applyModifier(baseMinor, weekend);
  }

  return baseMinor;
}

/**
 * Computes and freezes a booking's full price breakdown at creation time.
 * The result is stored verbatim on the `bookings` row — a later change to
 * pricing rules or tax settings must never alter an existing booking's
 * total, per architecture §5 ("frozen at booking time").
 */
export async function computeBookingPrice({ apartment, checkIn, checkOut, pricingRules }) {
  const nights = nightsList(checkIn, checkOut);
  const roomSubtotalMinor = nights.reduce((sum, night) => sum + priceForNight(apartment.price_night_minor, night, pricingRules), 0);

  const longStayRule = pricingRules.find((r) => r.rule_type === 'long_stay_discount' && r.min_nights && nights.length >= r.min_nights);
  const discountMinor = longStayRule
    ? longStayRule.modifier_type === 'percent'
      ? Math.round((roomSubtotalMinor * Math.abs(longStayRule.modifier_value)) / 100)
      : Math.min(roomSubtotalMinor, Math.abs(longStayRule.modifier_value))
    : 0;

  const taxPercent = await getSetting('tax_percent', 0);
  const taxableMinor = roomSubtotalMinor - discountMinor;
  const taxMinor = Math.round(taxableMinor * (taxPercent / 100));
  const feesMinor = 0;
  const depositMinor = 0;

  return {
    nights: nights.length,
    roomSubtotalMinor,
    discountMinor,
    taxMinor,
    feesMinor,
    depositMinor,
    totalMinor: taxableMinor + taxMinor + feesMinor
  };
}
