import { z } from 'zod';

// Cameroon numbers: +237 6XXXXXXXX / +237 2XXXXXXXX, also accept local 9-digit form.
const phoneRegex = /^(\+237)?[62]\d{8}$/;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid Cameroon phone number, e.g. 6XXXXXXXX').optional(),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100)
});
