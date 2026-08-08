import { db } from '../../db/knex.js';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { slugify } from '../../lib/slugify.js';
import { recordAuditLog } from '../audit/service.js';
import { toPublicRecord, deleteFile, assertWithinSizeLimit } from '../../lib/storageAdapter/index.js';
import * as repo from './repository.js';

function toApartmentDTO(row, amenitiesByApartment, featuredMediaByApartment) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    description: row.description,
    apartmentType: { id: row.apartment_type_id, name: row.apartment_type_name, slug: row.apartment_type_slug },
    pricing: {
      nightMinor: row.price_night_minor,
      weekMinor: row.price_week_minor,
      monthMinor: row.price_month_minor,
      currency: 'XAF'
    },
    maxGuests: row.max_guests,
    beds: row.beds,
    bathrooms: row.bathrooms,
    floor: row.floor,
    status: row.status,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    maintenanceNotes: row.maintenance_notes,
    amenities: amenitiesByApartment?.[row.id] || [],
    featuredMedia: featuredMediaByApartment?.[row.id]
      ? { url: featuredMediaByApartment[row.id].url, type: featuredMediaByApartment[row.id].type }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listApartments(query, { isStaffView }) {
  const filters = {
    guests: query.guests,
    apartmentTypeId: query.apartmentTypeId,
    priceMinMinor: query.priceMin,
    priceMaxMinor: query.priceMax,
    amenityIds: query.amenityIds,
    page: query.page,
    perPage: query.perPage,
    isActive: isStaffView && query.includeInactive ? undefined : true
  };

  const { rows, total } = await repo.list(filters);
  const ids = rows.map((r) => r.id);
  const [amenitiesByApartment, featuredMediaByApartment] = await Promise.all([
    repo.getAmenitiesForApartments(ids),
    repo.getFeaturedMediaForApartments(ids)
  ]);

  return {
    data: rows.map((row) => toApartmentDTO(row, amenitiesByApartment, featuredMediaByApartment)),
    meta: { page: query.page, perPage: query.perPage, total }
  };
}

async function loadFull(row) {
  const [amenities, media, pricingRules, blockedDates] = await Promise.all([
    repo.getAmenitiesForApartments([row.id]),
    repo.getMediaForApartment(row.id),
    repo.listPricingRules(row.id),
    repo.listBlockedDates(row.id)
  ]);

  const dto = toApartmentDTO(row, amenities, {});
  dto.media = media.map((m) => ({ id: m.id, type: m.type, url: m.url, sortOrder: m.sort_order, isFeatured: Boolean(m.is_featured) }));
  dto.pricingRules = pricingRules;
  dto.blockedDates = blockedDates;
  return dto;
}

export async function getApartment(idOrSlug) {
  const row = /^\d+$/.test(String(idOrSlug)) ? await repo.findById(idOrSlug) : await repo.findBySlug(idOrSlug);
  if (!row || !row.id) throw new NotFoundError('Apartment not found.');
  return loadFull(row);
}

async function ensureUniqueCodeAndSlug({ code, slug }, excludeId) {
  const byCode = await repo.findByCode(code);
  if (byCode && byCode.id !== excludeId) throw new ConflictError(`Apartment code "${code}" is already in use.`);
  const bySlug = await repo.findBySlugRaw(slug);
  if (bySlug && bySlug.id !== excludeId) throw new ConflictError('An apartment with a very similar name already exists.');
}

export async function createApartment(input, ctx) {
  const slug = slugify(input.name);
  await ensureUniqueCodeAndSlug({ code: input.code, slug });

  const apartmentId = await db.transaction(async (trx) => {
    const id = await repo.create(
      {
        apartment_type_id: input.apartmentTypeId,
        code: input.code,
        name: input.name,
        slug,
        description: input.description || null,
        price_night_minor: input.priceNightMinor,
        price_week_minor: input.priceWeekMinor ?? null,
        price_month_minor: input.priceMonthMinor ?? null,
        max_guests: input.maxGuests,
        beds: input.beds,
        bathrooms: input.bathrooms,
        floor: input.floor || null,
        is_featured: input.isFeatured
      },
      trx
    );

    if (input.amenityIds?.length) await repo.setAmenities(id, input.amenityIds, trx);
    await recordAuditLog({ userId: ctx.userId, action: 'apartment.created', entityType: 'apartment', entityId: id, ip: ctx.ip }, trx);
    return id;
  });

  return getApartment(apartmentId);
}

export async function updateApartment(id, input, ctx) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Apartment not found.');

  const updates = {};
  if (input.apartmentTypeId !== undefined) updates.apartment_type_id = input.apartmentTypeId;
  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = slugify(input.name);
  }
  if (input.code !== undefined) updates.code = input.code;
  if (updates.code || updates.slug) await ensureUniqueCodeAndSlug({ code: updates.code || existing.code, slug: updates.slug || existing.slug }, Number(id));

  if (input.description !== undefined) updates.description = input.description;
  if (input.priceNightMinor !== undefined) updates.price_night_minor = input.priceNightMinor;
  if (input.priceWeekMinor !== undefined) updates.price_week_minor = input.priceWeekMinor;
  if (input.priceMonthMinor !== undefined) updates.price_month_minor = input.priceMonthMinor;
  if (input.maxGuests !== undefined) updates.max_guests = input.maxGuests;
  if (input.beds !== undefined) updates.beds = input.beds;
  if (input.bathrooms !== undefined) updates.bathrooms = input.bathrooms;
  if (input.floor !== undefined) updates.floor = input.floor;
  if (input.status !== undefined) updates.status = input.status;
  if (input.isFeatured !== undefined) updates.is_featured = input.isFeatured;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.maintenanceNotes !== undefined) updates.maintenance_notes = input.maintenanceNotes;

  await db.transaction(async (trx) => {
    if (Object.keys(updates).length) await repo.update(id, updates, trx);
    if (input.amenityIds !== undefined) await repo.setAmenities(id, input.amenityIds, trx);
    await recordAuditLog({ userId: ctx.userId, action: 'apartment.updated', entityType: 'apartment', entityId: Number(id), ip: ctx.ip, metadata: updates }, trx);
  });

  return getApartment(id);
}

export async function deleteApartment(id, ctx) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Apartment not found.');

  await db.transaction(async (trx) => {
    await repo.softDelete(id, trx);
    await recordAuditLog({ userId: ctx.userId, action: 'apartment.deleted', entityType: 'apartment', entityId: Number(id), ip: ctx.ip }, trx);
  });
}

export async function uploadMedia(apartmentId, files, ctx) {
  if (!files?.length) throw new ValidationError('No files were uploaded.');
  files.forEach(assertWithinSizeLimit);

  const existingMedia = await repo.getMediaForApartment(apartmentId);
  const startingSort = existingMedia.length ? Math.max(...existingMedia.map((m) => m.sort_order)) + 1 : 0;

  const records = files.map((file, index) => {
    const { storageKey, url, type } = toPublicRecord(file);
    return {
      type,
      storage_key: storageKey,
      url,
      sort_order: startingSort + index,
      is_featured: existingMedia.length === 0 && index === 0
    };
  });

  await repo.addMedia(apartmentId, records);
  await recordAuditLog({ userId: ctx.userId, action: 'apartment.media_uploaded', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip, metadata: { count: files.length } });

  return repo.getMediaForApartment(apartmentId);
}

export async function deleteMedia(apartmentId, mediaId, ctx) {
  const media = await repo.findMediaById(mediaId);
  if (!media || media.apartment_id !== Number(apartmentId)) throw new NotFoundError('Media not found.');

  await repo.deleteMedia(mediaId);
  deleteFile(media.storage_key);

  if (media.is_featured) {
    const remaining = await repo.getMediaForApartment(apartmentId);
    if (remaining.length) await repo.updateMedia(remaining[0].id, { is_featured: true });
  }

  await recordAuditLog({ userId: ctx.userId, action: 'apartment.media_deleted', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip });
}

export async function updateMedia(apartmentId, mediaId, input, ctx) {
  const media = await repo.findMediaById(mediaId);
  if (!media || media.apartment_id !== Number(apartmentId)) throw new NotFoundError('Media not found.');

  if (input.isFeatured) await repo.clearFeaturedMedia(apartmentId);

  const updates = {};
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.isFeatured !== undefined) updates.is_featured = input.isFeatured;
  await repo.updateMedia(mediaId, updates);

  await recordAuditLog({ userId: ctx.userId, action: 'apartment.media_updated', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip });
  return repo.getMediaForApartment(apartmentId);
}

export async function addBlockedDate(apartmentId, input, ctx) {
  if (input.endsOn <= input.startsOn) throw new ValidationError('End date must be after the start date.');

  const id = await repo.addBlockedDate({
    apartment_id: apartmentId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    reason: input.reason,
    created_by: ctx.userId
  });

  await recordAuditLog({ userId: ctx.userId, action: 'apartment.blocked', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip, metadata: input });
  return repo.listBlockedDates(apartmentId);
}

export async function removeBlockedDate(apartmentId, blockId, ctx) {
  await repo.removeBlockedDate(blockId);
  await recordAuditLog({ userId: ctx.userId, action: 'apartment.unblocked', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip });
  return repo.listBlockedDates(apartmentId);
}

export async function addPricingRule(apartmentId, input, ctx) {
  const id = await repo.addPricingRule({
    apartment_id: apartmentId,
    rule_type: input.ruleType,
    starts_on: input.startsOn || null,
    ends_on: input.endsOn || null,
    modifier_type: input.modifierType,
    modifier_value: input.modifierValue,
    min_nights: input.minNights || null
  });

  await recordAuditLog({ userId: ctx.userId, action: 'apartment.pricing_rule_added', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip, metadata: input });
  return repo.listPricingRules(apartmentId);
}

export async function removePricingRule(apartmentId, ruleId, ctx) {
  await repo.removePricingRule(ruleId);
  await recordAuditLog({ userId: ctx.userId, action: 'apartment.pricing_rule_removed', entityType: 'apartment', entityId: Number(apartmentId), ip: ctx.ip });
  return repo.listPricingRules(apartmentId);
}
