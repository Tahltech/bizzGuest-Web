import { z } from 'zod';

export const createApartmentTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional()
});

export const createAmenitySchema = z.object({
  label: z.string().trim().min(2).max(80),
  iconKey: z.string().trim().min(2).max(60)
});
