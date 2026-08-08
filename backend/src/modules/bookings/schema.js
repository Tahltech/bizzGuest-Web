import { z } from 'zod';

export const createBookingSchema = z
  .object({
    apartmentId: z.coerce.number().int().positive(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guestsCount: z.coerce.number().int().positive().max(50),
    additionalGuestNames: z.array(z.string().trim().min(1).max(150)).max(20).default([])
  })
  .refine((v) => v.checkOut > v.checkIn, { message: 'Check-out must be after check-in.', path: ['checkOut'] })
  .refine((v) => v.checkIn >= new Date(new Date().toDateString()), { message: 'Check-in cannot be in the past.', path: ['checkIn'] });

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(2).max(255)
});

export const listQuerySchema = z.object({
  status: z.enum(['pending', 'awaiting_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'completed', 'expired']).optional(),
  apartmentId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(20)
});
