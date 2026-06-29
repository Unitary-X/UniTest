'use strict';

/**
 * Write a structured audit log entry to the database.
 */
async function writeAuditLog(pool, { actor, action, targetType, targetId, beforeJson = null, afterJson = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor, action, target_type, target_id, before_json, after_json)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
      [
        String(actor || ''),
        String(action || ''),
        String(targetType || ''),
        targetId === undefined || targetId === null ? null : String(targetId),
        beforeJson ? JSON.stringify(beforeJson) : null,
        afterJson ? JSON.stringify(afterJson) : null,
      ]
    );
  } catch (err) {
    console.warn('[AUDIT] Failed to write audit log:', err.message);
  }
}

module.exports = { writeAuditLog };
