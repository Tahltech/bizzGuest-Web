import { z } from 'zod';

const money = z.coerce.number().int().nonnegative().max(1_000_000_000);

export const createApartmentSchema = z.object({
  apartmentTypeId: z.coerce.number().int().positive(),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(4000).optional(),
  priceNightMinor: money,
  priceWeekMinor: money.optional(),
  priceMonthMinor: money.optional(),
  maxGuests: z.coerce.number().int().min(1).max(50).default(2),
  beds: z.coerce.number().int().min(1).max(20).default(1),
  bathrooms: z.coerce.number().int().min(1).max(20).default(1),
  floor: z.string().trim().max(20).optional(),
  isFeatured: z.coerce.boolean().default(false),
  amenityIds: z.array(z.coerce.number().int().positive()).default([])
});

export const updateApartmentSchema = createApartmentSchema.partial().extend({
  status: z.enum(['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service']).optional(),
  isActive: z.coerce.boolean().optional(),
  maintenanceNotes: z.string().trim().max(2000).optional()
});

export const listQuerySchema = z.object({
  guests: z.coerce.number().int().positive().optional(),
  apartmentTypeId: z.coerce.number().int().positive().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  amenityIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map(Number).filter(Boolean) : [])),
  includeInactive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(20)
});

export const setAmenitiesSchema = z.object({
  amenityIds: z.array(z.coerce.number().int().positive())
});

export const mediaUpdateSchema = z.object({
  sortOrder: z.coerce.number().int().nonnegative().optional(),
  isFeatured: z.coerce.boolean().optional()
});

export const blockedDateSchema = z.object({
  startsOn: z.coerce.date(),
  endsOn: z.coerce.date(),
  reason: z.string().trim().min(2).max(255)
});

export const pricingRuleSchema = z.object({
  ruleType: z.enum(['weekend', 'seasonal', 'long_stay_discount']),
  startsOn: z.coerce.date().optional(),
  endsOn: z.coerce.date().optional(),
  modifierType: z.enum(['percent', 'fixed']),
  modifierValue: z.coerce.number().int(),
  minNights: z.coerce.number().int().positive().optional()
});
