import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

/** Verifies the JWT access token and attaches { id, email, roles, permissions } to req.user. */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorizedError('Sign in to continue.'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || []
    };
    next();
  } catch {
    next(new UnauthorizedError('Your session has expired. Please sign in again.'));
  }
}

/** Like `authenticate`, but does not fail the request when no/invalid token is present. */
export function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || []
    };
  } catch {
    // ignore invalid token on optional routes
  }
  next();
}

/**
 * RBAC gate. Permissions are resolved at login time and embedded in the access
 * token, so this is a pure in-memory check — the authoritative grant still lives
 * in role_permissions and is re-resolved on every new token issuance.
 */
export function requirePermission(...permissionSlugs) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Sign in to continue.'));
    const has = permissionSlugs.some((slug) => req.user.permissions.includes(slug));
    if (!has) return next(new ForbiddenError('You do not have permission to do this.'));
    next();
  };
}

export function requireRole(...roleSlugs) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Sign in to continue.'));
    const has = roleSlugs.some((slug) => req.user.roles.includes(slug));
    if (!has) return next(new ForbiddenError('You do not have permission to do this.'));
    next();
  };
}
