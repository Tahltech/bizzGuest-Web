import { db } from '../db/knex.js';

/** Reads a single settings.value — full settings CRUD module lands in a later phase; this is the minimal read path other modules need now. */
export async function getSetting(key, fallback, trx = db) {
  const row = await trx('settings').where({ key }).first();
  if (!row) return fallback;
  return typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
}
