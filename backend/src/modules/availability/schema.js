import { z } from 'zod';

export const searchSchema = z
  .object({
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z.coerce.number().int().positive().default(1)
  })
  .refine((v) => v.checkOut > v.checkIn, { message: 'Check-out must be after check-in.', path: ['checkOut'] })
  .refine((v) => v.checkIn >= new Date(new Date().toDateString()), { message: 'Check-in cannot be in the past.', path: ['checkIn'] });
