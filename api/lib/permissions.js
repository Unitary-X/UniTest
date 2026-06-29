'use strict';

function isSuperAdminSession(session) {
  const roleRaw = String(session?.staffRole || session?.roleName || '').toLowerCase();
  return roleRaw === 'super admin' || roleRaw === 'superadmin';
}

function defaultPermissionsForRole(roleName) {
  const role = String(roleName || '').trim().toLowerCase();
  if (role === 'super admin' || role === 'superadmin') {
    return {
      manageStaff: true,
      manageSubjects: true,
      manageAssignments: true,
      manageDatabase: true,
      viewAuditLogs: true,
      manageFeatureFlags: true,
      sendAnnouncements: true,
      uploadMaterials: true,
    };
  }
  return {
    manageStaff: false,
    manageSubjects: false,
    manageAssignments: false,
    manageDatabase: false,
    viewAuditLogs: false,
    manageFeatureFlags: false,
    sendAnnouncements: true,
    uploadMaterials: true,
  };
}

async function getStaffPermissions(pool, email, roleName) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const result = await pool.query(
    `SELECT permissions_json
     FROM role_policies
     WHERE staff_email = $1`,
    [normalizedEmail]
  );
  const defaults = defaultPermissionsForRole(roleName);
  if (!result.rows.length || !result.rows[0].permissions_json) {
    return defaults;
  }
  return { ...defaults, ...result.rows[0].permissions_json };
}

async function hasPermission(pool, session, permissionKey) {
  if (!session || session.role !== 'staff') return false;
  if (isSuperAdminSession(session)) return true;
  const perms = await getStaffPermissions(pool, session.email, session.staffRole || session.roleName);
  return Boolean(perms?.[permissionKey]);
}

module.exports = {
  isSuperAdminSession,
  defaultPermissionsForRole,
  getStaffPermissions,
  hasPermission,
};
