import argon2 from 'argon2';
import crypto from 'node:crypto';
import { db } from '../../db/knex.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../../lib/errors.js';
import { recordAuditLog } from '../audit/service.js';
import { queueEmail } from '../email/service.js';
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
