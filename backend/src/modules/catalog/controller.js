import { asyncHandler, created, ok } from '../../lib/response.js';
import { ConflictError } from '../../lib/errors.js';
import { slugify } from '../../lib/slugify.js';
import { recordAuditLog } from '../audit/service.js';
import * as repo from './repository.js';

export const listApartmentTypes = asyncHandler(async (req, res) => {
  const rows = await repo.apartmentTypes.list();
  return ok(res, rows);
});

export const createApartmentType = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const existing = await repo.apartmentTypes.findBySlug(slug);
  if (existing) throw new ConflictError('An apartment type with this name already exists.');

  const [id] = await repo.apartmentTypes.create({ ...req.body, slug });
  await recordAuditLog({ userId: req.user.id, action: 'apartment_type.created', entityType: 'apartment_type', entityId: id, ip: req.ip });

  const row = await repo.apartmentTypes.findById(id);
  return created(res, row);
});

export const listAmenities = asyncHandler(async (req, res) => {
  const rows = await repo.amenities.list();
  return ok(res, rows);
});

export const createAmenity = asyncHandler(async (req, res) => {
  const [id] = await repo.amenities.create({ label: req.body.label, icon_key: req.body.iconKey });
  await recordAuditLog({ userId: req.user.id, action: 'amenity.created', entityType: 'amenity', entityId: id, ip: req.ip });

  const row = await repo.amenities.findById(id);
  return created(res, row);
});
