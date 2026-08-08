import { db } from '../../db/knex.js';

/**
 * Records an audit trail entry. Called from service layers only — never from
 * controllers directly — so no write path can bypass the audit trail.
 */
export async function recordAuditLog({ userId = null, action, entityType, entityId = null, ip = null, metadata = null }, trx = db) {
  await trx('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip,
    metadata: metadata ? JSON.stringify(metadata) : null
  });
}
