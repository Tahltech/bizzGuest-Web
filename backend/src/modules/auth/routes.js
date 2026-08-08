import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import * as controller from './controller.js';
import {
  registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema,
  updateProfileSchema, changePasswordSchema, deleteAccountSchema
} from './schema.js';

export const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), controller.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', authRateLimiter, validate({ body: refreshSchema }), controller.refresh);
router.post('/logout', validate({ body: refreshSchema }), controller.logout);
router.post('/forgot-password', authRateLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', authRateLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);
router.get('/me', authenticate, controller.me);

router.get('/profile', authenticate, controller.getProfile);
router.patch('/profile', authenticate, validate({ body: updateProfileSchema }), controller.updateProfile);
router.post('/change-password', authenticate, authRateLimiter, validate({ body: changePasswordSchema }), controller.changePassword);
router.delete('/account', authenticate, authRateLimiter, validate({ body: deleteAccountSchema }), controller.deleteAccount);
