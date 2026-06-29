'use strict';

const { isSuperAdminSession } = require('../lib/permissions');

/**
 * Create auth middleware factory. Requires session manager dependency.
 */
function createAuthMiddleware(sessionManager) {
  const { getSessionFromRequest } = sessionManager;

  function requireAuth(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return async (req, res, next) => {
      try {
        const session = await getSessionFromRequest(req);
        if (!session) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        if (allowedRoles.length && !allowedRoles.includes(session.role)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        req.auth = session;
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  async function requireSuperAdmin(req, res, next) {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const role = String(session.role || '').toLowerCase();
      if ((role !== 'staff' && role !== 'superadmin') || !isSuperAdminSession(session)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.auth = session;
      next();
    } catch (err) {
      next(err);
    }
  }

  return { requireAuth, requireSuperAdmin };
}

module.exports = { createAuthMiddleware };
