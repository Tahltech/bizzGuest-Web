import argon2 from 'argon2';
import crypto from 'node:crypto';
import { db } from '../../db/knex.js';
import { env } from '../../config/env.js';
import { ConflictError, ForbiddenError, UnauthorizedError, ValidationError, NotFoundError } from '../../lib/errors.js';
import { recordAuditLog } from '../audit/service.js';
import { queueEmail } from '../email/service.js';
import { encryptField } from '../../lib/encryption.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js';
import * as repo from './repository.js';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function refreshTtlToDate() {
  const days = parseInt(env.jwt.refreshTtl, 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function buildAuthPayload(userRow) {
  const { roles, permissions } = await repo.getRolesAndPermissionsForUser(userRow.id);
  return {
    id: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
    roles,
    permissions
  };
}

async function issueTokenPair(userPayload, { userAgent, ip }) {
  const accessToken = signAccessToken(userPayload);

  // Create the session first with a placeholder hash, then sign the refresh
  // token with the real session id, then store its hash — the token content
  // (sid) and the session row must agree.
  const expiresAt = refreshTtlToDate();
  const sessionId = await repo.createSession({
    userId: userPayload.id,
    refreshTokenHash: 'pending',
    userAgent,
    ip,
    expiresAt
  });

  const refreshToken = signRefreshToken(userPayload, sessionId);
  await db('sessions').where({ id: sessionId }).update({ refresh_token_hash: sha256(refreshToken) });

  return { accessToken, refreshToken };
}

export async function register({ fullName, email, phone, password }, ctx) {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw new ConflictError('An account with this email already exists.', 'EMAIL_TAKEN');

  const passwordHash = await argon2.hash(password);

  const { userId } = await db.transaction(async (trx) => {
    const result = await repo.createUserWithGuestProfile({ fullName, email, phone, passwordHash }, trx);
    await recordAuditLog({ userId: result.userId, action: 'user.registered', entityType: 'user', entityId: result.userId, ip: ctx.ip }, trx);
    return result;
  });

  await queueEmail('welcome', email, { fullName });

  const userRow = await repo.findUserById(userId);
  const payload = await buildAuthPayload(userRow);
  const tokens = await issueTokenPair(payload, ctx);
  return { user: payload, ...tokens };
}

export async function login({ email, password }, ctx) {
  const userRow = await repo.findUserByEmail(email);
  if (!userRow) throw new UnauthorizedError('Incorrect email or password.');

  const validPassword = await argon2.verify(userRow.password_hash, password);
  if (!validPassword) throw new UnauthorizedError('Incorrect email or password.');

  if (!userRow.is_active) throw new UnauthorizedError('This account has been deactivated.');

  await repo.touchLastLogin(userRow.id);
  await recordAuditLog({ userId: userRow.id, action: 'user.login', entityType: 'user', entityId: userRow.id, ip: ctx.ip });

  const payload = await buildAuthPayload(userRow);
  const tokens = await issueTokenPair(payload, ctx);
  return { user: payload, ...tokens };
}

export async function refresh({ refreshToken }, ctx) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Your session has expired. Please sign in again.');
  }

  const session = await repo.findActiveSessionById(decoded.sid);
  if (!session || session.refresh_token_hash !== sha256(refreshToken)) {
    throw new UnauthorizedError('Your session has expired. Please sign in again.');
  }

  // Rotate: revoke the presented refresh token so it cannot be replayed.
  await repo.revokeSession(session.id);

  const userRow = await repo.findUserById(decoded.sub);
  if (!userRow || !userRow.is_active) throw new UnauthorizedError('Your session has expired. Please sign in again.');

  const payload = await buildAuthPayload(userRow);
  const tokens = await issueTokenPair(payload, ctx);
  return { user: payload, ...tokens };
}

export async function logout({ refreshToken }) {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await repo.revokeSession(decoded.sid);
  } catch {
    // Already invalid/expired — logout is idempotent either way.
  }
}

export async function forgotPassword({ email }) {
  const userRow = await repo.findUserByEmail(email);
  // Always behave the same whether or not the email exists, so this endpoint
  // can't be used to enumerate registered accounts.
  if (!userRow) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await repo.createPasswordResetToken({ userId: userRow.id, tokenHash: sha256(rawToken), expiresAt });

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  await queueEmail('password_reset', userRow.email, { fullName: userRow.full_name, resetUrl });
}

export async function resetPassword({ token, password }) {
  const record = await repo.findValidPasswordResetToken(sha256(token));
  if (!record) throw new ValidationError('This reset link is invalid or has expired.');

  const userRow = await repo.findUserById(record.user_id);
  if (!userRow) throw new NotFoundError('Account not found.');

  const passwordHash = await argon2.hash(password);

  await db.transaction(async (trx) => {
    await repo.updatePasswordHash(userRow.id, passwordHash, trx);
    await repo.markPasswordResetTokenUsed(record.id, trx);
    await repo.revokeAllSessionsForUser(userRow.id, trx);
    await recordAuditLog({ userId: userRow.id, action: 'user.password_reset', entityType: 'user', entityId: userRow.id }, trx);
  });
}

export async function getCurrentUser(userId) {
  const userRow = await repo.findUserById(userId);
  if (!userRow) throw new NotFoundError('Account not found.');
  return buildAuthPayload(userRow);
}

function toProfileDTO(userRow, roles, permissions, guestRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
    phone: userRow.phone,
    roles,
    permissions,
    isSuperAdmin: roles.includes('super_admin'),
    createdAt: userRow.created_at,
    lastLoginAt: userRow.last_login_at,
    guestDetails: {
      country: guestRow?.country ?? null,
      address: guestRow?.address ?? null,
      idType: guestRow?.id_type ?? null,
      hasIdNumberOnFile: Boolean(guestRow?.id_number_encrypted),
      emergencyContactName: guestRow?.emergency_contact_name ?? null,
      emergencyContactPhone: guestRow?.emergency_contact_phone ?? null,
      isVerified: Boolean(guestRow?.is_verified)
    }
  };
}

export async function getFullProfile(userId) {
  const userRow = await repo.findUserById(userId);
  if (!userRow) throw new NotFoundError('Account not found.');
  const { roles, permissions } = await repo.getRolesAndPermissionsForUser(userId);
  const guestRow = await repo.getGuestProfileForUser(userId);
  return toProfileDTO(userRow, roles, permissions, guestRow);
}

export async function updateProfile(userId, input, ctx) {
  const userRow = await repo.findUserById(userId);
  if (!userRow) throw new NotFoundError('Account not found.');

  const guestFields = {};
  if (input.country !== undefined) guestFields.country = input.country;
  if (input.address !== undefined) guestFields.address = input.address;
  if (input.idType !== undefined) guestFields.id_type = input.idType;
  if (input.idNumber !== undefined) guestFields.id_number_encrypted = encryptField(input.idNumber);
  if (input.emergencyContactName !== undefined) guestFields.emergency_contact_name = input.emergencyContactName;
  if (input.emergencyContactPhone !== undefined) guestFields.emergency_contact_phone = input.emergencyContactPhone;

  await db.transaction(async (trx) => {
    if (input.fullName !== undefined || input.phone !== undefined) {
      await repo.updateUserBasics(userId, { fullName: input.fullName, phone: input.phone }, trx);
    }
    if (Object.keys(guestFields).length > 0) {
      await repo.upsertGuestProfile(
        userId,
        { fullName: input.fullName ?? userRow.full_name, email: userRow.email, phone: input.phone ?? userRow.phone, fields: guestFields },
        trx
      );
    }
    await recordAuditLog({ userId, action: 'user.profile_updated', entityType: 'user', entityId: userId, ip: ctx.ip }, trx);
  });

  return getFullProfile(userId);
}

export async function changeOwnPassword(userId, { currentPassword, newPassword }, ctx) {
  const userRow = await repo.findUserById(userId);
  if (!userRow) throw new NotFoundError('Account not found.');

  const valid = await argon2.verify(userRow.password_hash, currentPassword);
  if (!valid) throw new ValidationError('Your current password is incorrect.');

  const passwordHash = await argon2.hash(newPassword);
  const payload = await buildAuthPayload(userRow);

  await db.transaction(async (trx) => {
    await repo.updatePasswordHash(userId, passwordHash, trx);
    // Revoke every other session — a password change is a signal that old
    // sessions (possibly on a device that shouldn't have access anymore)
    // must not survive it. The caller's own session continues via the fresh
    // token pair issued below instead of being caught in this revoke.
    await repo.revokeAllSessionsForUser(userId, trx);
    await recordAuditLog({ userId, action: 'user.password_changed', entityType: 'user', entityId: userId, ip: ctx.ip }, trx);
  });

  const tokens = await issueTokenPair(payload, ctx);
  return { user: payload, ...tokens };
}

/**
 * Self-service account deletion — deliberately restricted to super_admin.
 * Regular guests and other staff never see this option on their own profile;
 * removing a guest or staff member's account (as opposed to deleting your
 * own) is an administrative action for a future staff-management module, not
 * a self-service one. Soft-deletes so booking/payment/audit history tied to
 * the account stays intact.
 */
export async function deleteOwnAccount(userId, { password }, ctx) {
  const userRow = await repo.findUserById(userId);
  if (!userRow) throw new NotFoundError('Account not found.');

  const { roles } = await repo.getRolesAndPermissionsForUser(userId);
  if (!roles.includes('super_admin')) {
    throw new ForbiddenError('Only a Super Administrator can delete an account, and only their own from this page.');
  }

  const valid = await argon2.verify(userRow.password_hash, password);
  if (!valid) throw new ValidationError('Your password is incorrect.');

  const activeSuperAdmins = await repo.countActiveUsersWithRole('super_admin');
  if (activeSuperAdmins <= 1) {
    throw new ConflictError('This is the only active Super Administrator account — create another one before deleting this one.');
  }

  await db.transaction(async (trx) => {
    await repo.softDeleteUser(userId, trx);
    await repo.revokeAllSessionsForUser(userId, trx);
    await recordAuditLog({ userId, action: 'user.self_deleted', entityType: 'user', entityId: userId, ip: ctx.ip }, trx);
  });
}
