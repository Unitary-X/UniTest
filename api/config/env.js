'use strict';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.API_PORT || 3000);
const authPepper = requiredEnv('AUTH_PEPPER');
const fileUrlSigningSecret = requiredEnv('FILE_URL_SIGNING_SECRET');
const redisUrl = requiredEnv('REDIS_URL');
const resyncToken = process.env.RESYNC_TOKEN || '';

const sessionTtlHours = Number(process.env.AUTH_SESSION_TTL_HOURS || 24);
const sessionIdleMinutes = Math.max(Number(process.env.AUTH_SESSION_IDLE_MINUTES || 30), 5);
const retentionDays = Math.max(Number(process.env.RETENTION_DAYS || 90), 1);
const studentQuotaBytesDefault = Number(process.env.STUDENT_QUOTA_BYTES || 500 * 1024 * 1024);
const passwordHashRounds = Math.max(Number(process.env.PASSWORD_HASH_ROUNDS || 12), 10);

const syncStudentsOnStartup = String(process.env.STUDENTS_SYNC_ON_STARTUP || 'true').trim().toLowerCase() !== 'false';
const baselineAssignmentsOnStartup = String(process.env.BASELINE_ASSIGNMENTS_ON_STARTUP || 'false').trim().toLowerCase() !== 'false';
const uhvAssignmentsOnStartup = String(process.env.UHV_ASSIGNMENTS_ON_STARTUP || 'false').trim().toLowerCase() !== 'false';

// Database
const dbHost = requiredEnv('DB_HOST');
const dbPort = Number(requiredEnv('DB_PORT'));
const dbName = requiredEnv('DB_NAME');
const dbUser = requiredEnv('DB_USER');
const dbPassword = requiredEnv('DB_PASSWORD');

if (!Number.isFinite(dbPort) || dbPort <= 0) {
  throw new Error('Invalid DB_PORT. It must be a positive number.');
}

// Staff defaults
const staffDefaultEmail = requiredEnv('STAFF_DEFAULT_EMAIL').toLowerCase();
const staffDefaultPassword = requiredEnv('STAFF_DEFAULT_PASSWORD');
const staffDefaultName = process.env.STAFF_DEFAULT_NAME || 'System Admin';
const staffDefaultRole = process.env.STAFF_DEFAULT_ROLE || 'Chemistry Teacher';

// Super admin defaults
const superAdminDefaultEmail = requiredEnv('SUPERADMIN_DEFAULT_EMAIL').toLowerCase();
const superAdminDefaultPassword = requiredEnv('SUPERADMIN_DEFAULT_PASSWORD');
const superAdminDefaultName = process.env.SUPERADMIN_DEFAULT_NAME || 'Unitary X';
const superAdminDefaultRole = process.env.SUPERADMIN_DEFAULT_ROLE || 'Super Admin';

// UHV staff defaults
const uhvStaffEmail = requiredEnv('UHV_STAFF_EMAIL').toLowerCase();
const uhvStaffPassword = requiredEnv('UHV_STAFF_PASSWORD');
const uhvStaffName = process.env.UHV_STAFF_NAME || 'Vijayakumar';
const uhvStaffRole = process.env.UHV_STAFF_ROLE || 'UHV Teacher';

module.exports = {
  requiredEnv,
  port,
  authPepper,
  fileUrlSigningSecret,
  redisUrl,
  resyncToken,
  sessionTtlHours,
  sessionIdleMinutes,
  retentionDays,
  studentQuotaBytesDefault,
  passwordHashRounds,
  syncStudentsOnStartup,
  baselineAssignmentsOnStartup,
  uhvAssignmentsOnStartup,
  dbHost,
  dbPort,
  dbName,
  dbUser,
  dbPassword,
  staffDefaultEmail,
  staffDefaultPassword,
  staffDefaultName,
  staffDefaultRole,
  superAdminDefaultEmail,
  superAdminDefaultPassword,
  superAdminDefaultName,
  superAdminDefaultRole,
  uhvStaffEmail,
  uhvStaffPassword,
  uhvStaffName,
  uhvStaffRole,
};
