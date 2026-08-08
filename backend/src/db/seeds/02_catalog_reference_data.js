const APARTMENT_TYPES = [
  ['Standard Room', 'standard-room'],
  ['Deluxe Room', 'deluxe-room'],
  ['Studio', 'studio'],
  ['One Bedroom Apartment', 'one-bedroom'],
  ['Two Bedroom Apartment', 'two-bedroom'],
  ['VIP Apartment', 'vip-apartment'],
  ['Executive Apartment', 'executive-apartment']
];

const AMENITIES = [
  ['Wi-Fi', 'wifi'],
  ['Air Conditioning', 'ac'],
  ['Parking', 'parking'],
  ['Kitchen', 'kitchen'],
  ['TV', 'tv'],
  ['Generator (backup power)', 'generator'],
  ['Water Supply', 'water'],
  ['24/7 Security', 'security'],
  ['Cleaning Service', 'cleaning'],
  ['Hot Water', 'hot_water'],
  ['Balcony', 'balcony'],
  ['Workspace', 'workspace']
];

const EXPENSE_CATEGORIES = [
  'Electricity', 'Water', 'Internet', 'Staff Wages', 'Maintenance & Repairs',
  'Cleaning Supplies', 'Taxes', 'Marketing', 'Other'
];

export async function seed(knex) {
  await knex('apartment_types').del();
  await knex('apartment_types').insert(
    APARTMENT_TYPES.map(([name, slug]) => ({ name, slug }))
  );

  await knex('amenities').del();
  await knex('amenities').insert(
    AMENITIES.map(([label, icon_key]) => ({ label, icon_key }))
  );

  await knex('expense_categories').del();
  await knex('expense_categories').insert(
    EXPENSE_CATEGORIES.map((name) => ({ name }))
  );

  await knex('booking_reference_sequences').del();
  await knex('booking_reference_sequences').insert({ year: new Date().getFullYear(), next_value: 1 });

  await knex('settings').del();
  await knex('settings').insert([
    { key: 'guest_house_name', value: JSON.stringify('BizzGuest') },
    { key: 'currency', value: JSON.stringify('XAF') },
    { key: 'timezone', value: JSON.stringify('Africa/Douala') },
    { key: 'check_in_time', value: JSON.stringify('14:00') },
    { key: 'check_out_time', value: JSON.stringify('11:00') },
    { key: 'booking_hold_minutes', value: JSON.stringify(10) },
    { key: 'tax_percent', value: JSON.stringify(0) },
    { key: 'whatsapp_number', value: JSON.stringify('') },
    { key: 'cancellation_policy', value: JSON.stringify('Free cancellation up to 48 hours before check-in.') }
  ]);
}
