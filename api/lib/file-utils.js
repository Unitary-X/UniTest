'use strict';

const path = require('path');

function extractUploadFileName(input) {
  let raw = input;
  if (raw && typeof raw === 'object') {
    raw = raw.url || raw.src || raw.path || raw.name || '';
  }
  raw = String(raw || '').trim();
  if (!raw) return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      raw = parsed.pathname || '';
    } catch (_err) {
      // ignore and continue best effort
    }
  }

  raw = raw.split('?')[0].split('#')[0].replace(/\\/g, '/');

  const markers = ['/api/files/', '/api/uploads/', '/uploads/', 'uploads/'];
  for (const marker of markers) {
    const idx = raw.toLowerCase().lastIndexOf(marker);
    if (idx >= 0) {
      const tail = raw.slice(idx + marker.length).replace(/^\/+/, '');
      return decodeURIComponent(path.basename(tail));
    }
  }

  return decodeURIComponent(path.basename(raw));
}

function toPublicImageUrl(input) {
  const fileName = extractUploadFileName(input);
  if (!fileName) return '';
  if (/^(data:|blob:)/i.test(fileName)) return fileName;
  return `/api/files/${encodeURIComponent(fileName)}`;
}

function normalizeImagesForStorage(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  const normalized = [];
  for (const item of value) {
    const fileName = extractUploadFileName(item);
    if (!fileName || /^(data:|blob:)/i.test(fileName)) continue;
    if (unique.has(fileName)) continue;
    unique.add(fileName);
    normalized.push(fileName);
  }
  return normalized;
}

function normalizeUploadUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const marker = '/uploads/';
      const idx = parsed.pathname.toLowerCase().lastIndexOf(marker);
      if (idx >= 0) {
        const tail = parsed.pathname.slice(idx + marker.length).replace(/^\/+/, '');
        return `/api/files/${encodeURIComponent(path.basename(tail))}`;
      }
    } catch (_err) {
      // Fall through to best-effort normalization below
    }
    return raw;
  }
  if (raw.startsWith('/api/files/')) return raw;
  if (raw.startsWith('/api/uploads/')) {
    return `/api/files/${encodeURIComponent(path.basename(raw))}`;
  }
  if (raw.startsWith('/uploads/')) {
    return `/api/files/${encodeURIComponent(path.basename(raw))}`;
  }
  if (raw.startsWith('uploads/')) {
    return `/api/files/${encodeURIComponent(path.basename(raw))}`;
  }

  // Handle Windows/local absolute paths by taking only file name.
  if (/^[a-zA-Z]:[/\\]/.test(raw) || raw.includes('\\')) {
    return `/api/files/${encodeURIComponent(path.basename(raw))}`;
  }

  // Handle any path that contains /uploads/ somewhere inside it.
  const marker = '/uploads/';
  const markerIdx = raw.toLowerCase().lastIndexOf(marker);
  if (markerIdx >= 0) {
    const tail = raw.slice(markerIdx + marker.length).replace(/^\/+/, '');
    return `/api/files/${encodeURIComponent(path.basename(tail))}`;
  }

  return `/api/files/${encodeURIComponent(path.basename(raw.replace(/^\/+/, '')))}`;
}

module.exports = {
  extractUploadFileName,
  toPublicImageUrl,
  normalizeImagesForStorage,
  normalizeUploadUrl,
};
