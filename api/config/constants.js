'use strict';

const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || (process.platform === 'win32'
  ? path.join(process.cwd(), 'data', 'uploads')
  : '/data/uploads');

const sessionStoreFilePath = process.env.AUTH_SESSION_STORE_FILE || path.join(uploadDir, '.auth-sessions.json');
const gradedReportFilePath = process.env.GRADED_REPORT_FILE || path.join(uploadDir, 'graded-report.xlsx');
const studentsFile = process.env.STUDENTS_FILE || '/app/students-db.js';

const allowedStudentUploadMimeTypes = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const allowedStudentUploadExtensions = new Set([
  '.pdf', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif',
]);

const allowedStudentPptMimeTypes = new Set([
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const allowedStudentPptExtensions = new Set(['.ppt', '.pptx']);

const backupTables = [
  'subjects',
  'staff_accounts',
  'students',
  'student_auth',
  'student_password_history',
  'staff_subject_assignments',
  'student_subject_assignments',
  'student_staff_subject_assignments',
  'broadcast_messages',
  'student_message_reads',
  'qa_threads',
  'qa_messages',
  'submissions',
  'official_materials',
  'student_storage_quotas',
];

module.exports = {
  uploadDir,
  sessionStoreFilePath,
  gradedReportFilePath,
  studentsFile,
  allowedStudentUploadMimeTypes,
  allowedStudentUploadExtensions,
  allowedStudentPptMimeTypes,
  allowedStudentPptExtensions,
  backupTables,
};
