import { z } from 'zod';

const phoneRegex = /^(\+237)?[62]\d{8}$/;

export const initiateMobileMoneySchema = z.object({
  method: z.enum(['mtn_momo', 'orange_money']),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid Cameroon mobile money number, e.g. 6XXXXXXXX')
});

export const manualPaymentSchema = z.object({
  method: z.enum(['cash', 'bank_transfer']),
  amountMinor: z.coerce.number().int().positive(),
  notes: z.string().trim().max(500).optional()
});

export const refundSchema = z.object({
  reason: z.string().trim().min(2).max(255)
});
