'use strict';

function normalizeRegNo(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeStaffEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSubjectCode(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeManualAssessmentKey(value) {
  const raw = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw === 'AL1') return 'AL1';
  if (raw === 'AL2') return 'AL2';
  if (raw === 'SSA1') return 'SSA1';
  if (raw === 'SSA2' || raw === 'SSA') return 'SSA2';
  return null;
}

function clampManualMark(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < 0) return 0;
  if (num > 20) return 20;
  return Math.round(num * 100) / 100;
}

module.exports = {
  normalizeRegNo,
  normalizeStaffEmail,
  normalizeSubjectCode,
  normalizeManualAssessmentKey,
  clampManualMark,
};
