/**
 * Creates (or promotes) the first Super Administrator account.
 * Deliberately NOT a seed file — seeds run automatically in dev and must
 * never contain real credentials. Run this once, explicitly, instead:
 *
 *   SUPER_ADMIN_EMAIL=you@bizzguest.example \
 *   SUPER_ADMIN_PASSWORD=a-strong-password \
 *   SUPER_ADMIN_NAME="Your Name" \
 *   npm run create-admin
 */
import argon2 from 'argon2';
import { db } from '../src/db/knex.js';

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME || 'BizzGuest Administrator';

  if (!email || !password) {
    console.error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running this script.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('SUPER_ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  const role = await db('roles').where({ slug: 'super_admin' }).first();
  if (!role) {
    console.error('super_admin role not found — run `npm run seed` first.');
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password);

  const existing = await db('users').where({ email }).first();
  let userId;

  if (existing) {
    await db('users').where({ id: existing.id }).update({ password_hash: passwordHash, is_active: true });
    userId = existing.id;
    console.log(`Updated existing user ${email} (id ${userId}).`);
  } else {
    [userId] = await db('users').insert({ full_name: fullName, email, password_hash: passwordHash, is_active: true });
    console.log(`Created user ${email} (id ${userId}).`);
  }

  const alreadyHasRole = await db('user_roles').where({ user_id: userId, role_id: role.id }).first();
  if (!alreadyHasRole) {
    await db('user_roles').insert({ user_id: userId, role_id: role.id });
  }

  console.log(`✔ ${email} is now a Super Administrator.`);
  await db.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await db.destroy();
  process.exit(1);
});
