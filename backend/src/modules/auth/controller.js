import { asyncHandler, created, ok } from '../../lib/response.js';
import * as authService from './service.js';

function ctxFrom(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, ctxFrom(req));
  return created(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, ctxFrom(req));
  return ok(res, result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body, ctxFrom(req));
  return ok(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  return ok(res, { loggedOut: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  return ok(res, { message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ok(res, { message: 'Password updated. You can now sign in.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return ok(res, user);
});
