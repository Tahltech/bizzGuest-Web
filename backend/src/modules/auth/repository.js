import { db } from '../../db/knex.js';

export async function findUserByEmail(email, trx = db) {
  return trx('users').where({ email }).whereNull('deleted_at').first();
}

export async function findUserById(id, trx = db) {
  return trx('users').where({ id }).whereNull('deleted_at').first();
}

export async function getRolesAndPermissionsForUser(userId, trx = db) {
  const roles = await trx('roles')
    .join('user_roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', userId)
    .select('roles.id', 'roles.slug');

  if (roles.length === 0) return { roles: [], permissions: [] };

  const permissionRows = await trx('permissions')
    .join('role_permissions', 'role_permissions.permission_id', 'permissions.id')
    .whereIn('role_permissions.role_id', roles.map((r) => r.id))
    .distinct('permissions.slug');

  return {
    roles: roles.map((r) => r.slug),
    permissions: permissionRows.map((p) => p.slug)
  };
}

export async function createUserWithGuestProfile({ fullName, email, phone, passwordHash }, trx) {
  const [userId] = await trx('users').insert({ full_name: fullName, email, phone, password_hash: passwordHash });

  const guestRole = await trx('roles').where({ slug: 'guest' }).first();
  if (guestRole) {
    await trx('user_roles').insert({ user_id: userId, role_id: guestRole.id });
  }

  const [guestId] = await trx('guests').insert({ user_id: userId, full_name: fullName, email, phone });

  return { userId, guestId };
}

export async function createSession({ userId, refreshTokenHash, userAgent, ip, expiresAt }, trx = db) {
  const [id] = await trx('sessions').insert({
    user_id: userId,
    refresh_token_hash: refreshTokenHash,
    user_agent: userAgent,
    ip,
    expires_at: expiresAt
  });
  return id;
}

export async function findActiveSessionById(sessionId, trx = db) {
  return trx('sessions')
    .where({ id: sessionId })
    .whereNull('revoked_at')
    .where('expires_at', '>', new Date())
    .first();
}

export async function revokeSession(sessionId, trx = db) {
  return trx('sessions').where({ id: sessionId }).update({ revoked_at: new Date() });
}

export async function revokeAllSessionsForUser(userId, trx = db) {
  return trx('sessions').where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: new Date() });
}

export async function touchLastLogin(userId, trx = db) {
  return trx('users').where({ id: userId }).update({ last_login_at: new Date() });
}

export async function createPasswordResetToken({ userId, tokenHash, expiresAt }, trx = db) {
  return trx('password_reset_tokens').insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
}

export async function findValidPasswordResetToken(tokenHash, trx = db) {
  return trx('password_reset_tokens')
    .where({ token_hash: tokenHash })
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();
}

export async function markPasswordResetTokenUsed(id, trx = db) {
  return trx('password_reset_tokens').where({ id }).update({ used_at: new Date() });
}

export async function updatePasswordHash(userId, passwordHash, trx = db) {
  return trx('users').where({ id: userId }).update({ password_hash: passwordHash });
}

export async function updateUserBasics(userId, { fullName, phone }, trx = db) {
  const updates = { updated_at: new Date() };
  if (fullName !== undefined) updates.full_name = fullName;
  if (phone !== undefined) updates.phone = phone;
  return trx('users').where({ id: userId }).update(updates);
}

export async function getGuestProfileForUser(userId, trx = db) {
  return trx('guests').where({ user_id: userId }).first();
}

/** Lazily creates the guests row on first save — most staff accounts never need one, most guest accounts get theirs at registration already. */
export async function upsertGuestProfile(userId, { fullName, email, phone, fields }, trx = db) {
  const existing = await trx('guests').where({ user_id: userId }).first();
  if (existing) {
    await trx('guests').where({ id: existing.id }).update({ ...fields, updated_at: new Date() });
    return existing.id;
  }
  const [id] = await trx('guests').insert({ user_id: userId, full_name: fullName, email, phone, ...fields });
  return id;
}

export async function countActiveUsersWithRole(roleSlug, trx = db) {
  const row = await trx('users as u')
    .join('user_roles as ur', 'ur.user_id', 'u.id')
    .join('roles as r', 'r.id', 'ur.role_id')
    .where('r.slug', roleSlug)
    .where('u.is_active', true)
    .whereNull('u.deleted_at')
    .countDistinct({ count: 'u.id' })
    .first();
  return Number(row.count);
}

/** Soft delete — preserves the row (and every booking/payment/audit record that references it) rather than purging history. */
export async function softDeleteUser(userId, trx = db) {
  return trx('users').where({ id: userId }).update({ deleted_at: new Date(), is_active: false });
}
