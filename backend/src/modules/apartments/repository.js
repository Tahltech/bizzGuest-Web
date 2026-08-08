import { db } from '../../db/knex.js';

const BASE_COLUMNS = [
  'a.id', 'a.apartment_type_id', 'a.code', 'a.name', 'a.slug', 'a.description',
  'a.price_night_minor', 'a.price_week_minor', 'a.price_month_minor',
  'a.max_guests', 'a.beds', 'a.bathrooms', 'a.floor', 'a.status',
  'a.is_featured', 'a.is_active', 'a.maintenance_notes',
  'a.created_at', 'a.updated_at',
  't.name as apartment_type_name', 't.slug as apartment_type_slug'
];

function withTypeJoin() {
  return db('apartments as a').leftJoin('apartment_types as t', 't.id', 'a.apartment_type_id').whereNull('a.deleted_at');
}

export async function list({ isActive, guests, apartmentTypeId, priceMinMinor, priceMaxMinor, amenityIds, page = 1, perPage = 20 }) {
  const query = withTypeJoin();

  if (isActive !== undefined) query.where('a.is_active', isActive);
  if (guests) query.where('a.max_guests', '>=', guests);
  if (apartmentTypeId) query.where('a.apartment_type_id', apartmentTypeId);
  if (priceMinMinor) query.where('a.price_night_minor', '>=', priceMinMinor);
  if (priceMaxMinor) query.where('a.price_night_minor', '<=', priceMaxMinor);
  if (amenityIds?.length) {
    query.whereIn('a.id', function () {
      this.select('apartment_id')
        .from('apartment_amenities')
        .whereIn('amenity_id', amenityIds)
        .groupBy('apartment_id')
        .havingRaw('COUNT(DISTINCT amenity_id) = ?', [amenityIds.length]);
    });
  }

  const totalRow = await query.clone().clearSelect().count({ count: 'a.id' }).first();
  const rows = await query
    .clone()
    .select(BASE_COLUMNS)
    .orderBy('a.is_featured', 'desc')
    .orderBy('a.id', 'desc')
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows, total: Number(totalRow.count) };
}

export async function findById(id) {
  return withTypeJoin().where('a.id', id).select(BASE_COLUMNS).first();
}

export async function findBySlug(slug) {
  return withTypeJoin().where('a.slug', slug).select(BASE_COLUMNS).first();
}

/** Batch-fetches amenities for a set of apartments in one query — avoids N+1 on list views. */
export async function getAmenitiesForApartments(apartmentIds) {
  if (!apartmentIds.length) return {};
  const rows = await db('apartment_amenities as aa')
    .join('amenities as am', 'am.id', 'aa.amenity_id')
    .whereIn('aa.apartment_id', apartmentIds)
    .select('aa.apartment_id', 'am.id', 'am.label', 'am.icon_key');

  return rows.reduce((acc, row) => {
    acc[row.apartment_id] = acc[row.apartment_id] || [];
    acc[row.apartment_id].push({ id: row.id, label: row.label, iconKey: row.icon_key });
    return acc;
  }, {});
}

export async function getFeaturedMediaForApartments(apartmentIds) {
  if (!apartmentIds.length) return {};
  const rows = await db('apartment_media')
    .whereIn('apartment_id', apartmentIds)
    .orderBy(['apartment_id', { column: 'is_featured', order: 'desc' }, 'sort_order']);

  const byApartment = {};
  for (const row of rows) {
    if (!byApartment[row.apartment_id]) byApartment[row.apartment_id] = row;
  }
  return byApartment;
}

export async function getMediaForApartment(apartmentId) {
  return db('apartment_media').where({ apartment_id: apartmentId }).orderBy(['sort_order']);
}

export async function findByCode(code) {
  return db('apartments').where({ code }).whereNull('deleted_at').first();
}

export async function findBySlugRaw(slug) {
  return db('apartments').where({ slug }).whereNull('deleted_at').first();
}

export async function create(data, trx = db) {
  const [id] = await trx('apartments').insert(data);
  return id;
}

export async function update(id, data, trx = db) {
  return trx('apartments').where({ id }).update({ ...data, updated_at: new Date() });
}

export async function softDelete(id, trx = db) {
  return trx('apartments').where({ id }).update({ deleted_at: new Date(), is_active: false });
}

export async function setAmenities(apartmentId, amenityIds, trx = db) {
  await trx('apartment_amenities').where({ apartment_id: apartmentId }).del();
  if (amenityIds.length) {
    await trx('apartment_amenities').insert(amenityIds.map((amenityId) => ({ apartment_id: apartmentId, amenity_id: amenityId })));
  }
}

export async function addMedia(apartmentId, mediaRows, trx = db) {
  if (!mediaRows.length) return [];
  await trx('apartment_media').insert(mediaRows.map((m) => ({ ...m, apartment_id: apartmentId })));
  return getMediaForApartment(apartmentId);
}

export async function findMediaById(mediaId, trx = db) {
  return trx('apartment_media').where({ id: mediaId }).first();
}

export async function deleteMedia(mediaId, trx = db) {
  return trx('apartment_media').where({ id: mediaId }).del();
}

export async function updateMedia(mediaId, data, trx = db) {
  return trx('apartment_media').where({ id: mediaId }).update(data);
}

export async function clearFeaturedMedia(apartmentId, trx = db) {
  return trx('apartment_media').where({ apartment_id: apartmentId }).update({ is_featured: false });
}

export async function addBlockedDate(data, trx = db) {
  const [id] = await trx('blocked_dates').insert(data);
  return id;
}

export async function listBlockedDates(apartmentId, trx = db) {
  return trx('blocked_dates').where({ apartment_id: apartmentId }).orderBy('starts_on');
}

export async function removeBlockedDate(id, trx = db) {
  return trx('blocked_dates').where({ id }).del();
}

export async function addPricingRule(data, trx = db) {
  const [id] = await trx('pricing_rules').insert(data);
  return id;
}

export async function listPricingRules(apartmentId, trx = db) {
  return trx('pricing_rules').where({ apartment_id: apartmentId }).orderBy('created_at', 'desc');
}

export async function removePricingRule(id, trx = db) {
  return trx('pricing_rules').where({ id }).del();
}
