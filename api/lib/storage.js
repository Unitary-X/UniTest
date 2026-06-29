'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sanitize = (name) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);

function createStoredUploadName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = sanitize(path.basename(originalName || 'file', ext));
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base || 'file'}-${unique}${ext}`;
}

function sanitizePathSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

function writeFileToStorage(uploadDir, relativeFolder, storedName, buffer) {
  const safeFolder = String(relativeFolder || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const baseDir = path.resolve(uploadDir);
  const absoluteFolder = path.resolve(baseDir, safeFolder);
  if (!absoluteFolder.startsWith(baseDir)) {
    throw new Error('Invalid storage folder');
  }
  fs.mkdirSync(absoluteFolder, { recursive: true });
  const absolutePath = path.join(absoluteFolder, path.basename(storedName));
  fs.writeFileSync(absolutePath, buffer);
  return absolutePath;
}

function toUploadsPublicUrl(relativeFolder, storedName) {
  const fileName = encodeURIComponent(path.basename(String(storedName || 'file')));
  return `/api/files/${fileName}`;
}

function signFileAccessSignature(fileUrlSigningSecret, fileName, exp) {
  const payload = `${String(fileName || '')}.${Number(exp || 0)}`;
  return crypto.createHmac('sha256', fileUrlSigningSecret).update(payload).digest('hex');
}

function verifyFileAccessSignature(fileUrlSigningSecret, fileName, exp, sig) {
  const expiry = Number(exp || 0);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;
  const expected = signFileAccessSignature(fileUrlSigningSecret, fileName, expiry);
  const left = Buffer.from(String(expected));
  const right = Buffer.from(String(sig || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createSignedFileUrl(fileUrlSigningSecret, storedName, ttlMs = 5 * 60 * 1000) {
  const safeName = path.basename(String(storedName || ''));
  const exp = Date.now() + Math.max(Number(ttlMs || 0), 30 * 1000);
  const sig = signFileAccessSignature(fileUrlSigningSecret, safeName, exp);
  return `/api/files/${encodeURIComponent(safeName)}?exp=${exp}&sig=${sig}`;
}

function listFilesRecursively(baseDir) {
  const rows = [];
  if (!fs.existsSync(baseDir)) return rows;
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_err) {
      continue;
    }
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      rows.push(absolutePath);
    }
  }
  return rows;
}

function cleanupUploadDiskCopies(uploadDir, fileNames) {
  for (const rawName of fileNames || []) {
    const safeName = path.basename(String(rawName || ''));
    if (!safeName) continue;
    const filePath = path.join(uploadDir, safeName);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_err) {
      // Best effort: uploads are persisted in DB; disk cleanup failure should not fail request.
    }
  }
}

module.exports = {
  sanitize,
  createStoredUploadName,
  sanitizePathSegment,
  writeFileToStorage,
  toUploadsPublicUrl,
  signFileAccessSignature,
  verifyFileAccessSignature,
  createSignedFileUrl,
  listFilesRecursively,
  cleanupUploadDiskCopies,
};
