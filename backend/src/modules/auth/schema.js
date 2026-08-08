import { z } from 'zod';

// Cameroon numbers: +237 6XXXXXXXX / +237 2XXXXXXXX, also accept local 9-digit form.
const phoneRegex = /^(\+237)?[62]\d{8}$/;

// An empty string (an unfilled optional form field) must count as "not
// provided", not "provide a value" — .optional() alone only exempts
// `undefined`, so a blank field still hit whatever validation followed it.
function optionalPhone(message = 'Enter a valid Cameroon phone number, e.g. 6XXXXXXXX') {
  return z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || phoneRegex.test(v), { message });
}

function optionalText(max) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: optionalPhone(),
  password: z.string().min(8).max(100)
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  phone: optionalPhone(),
  country: optionalText(80),
  address: optionalText(255),
  idType: optionalText(40),
  idNumber: optionalText(100),
  emergencyContactName: optionalText(150),
  emergencyContactPhone: optionalPhone('Enter a valid Cameroon phone number for the emergency contact, e.g. 6XXXXXXXX')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100)
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.string().refine((v) => v === 'DELETE', { message: 'Type DELETE to confirm.' })
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
