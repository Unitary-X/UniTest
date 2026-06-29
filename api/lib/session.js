'use strict';

const fs = require('fs');
const path = require('path');

const redisSessionKeyPrefix = 'auth:session:';

/**
 * Create a session module factory. Accepts dependencies for testability.
 */
function createSessionManager({ redisClient, authUtils, sessionStoreFilePath, sessionTtlHours, sessionIdleMinutes }) {

  async function createSession(payload) {
    const token = authUtils.createSessionToken();
    const now = Date.now();
    const expiresAt = now + (Math.max(sessionTtlHours, 1) * 60 * 60 * 1000);
    const ttlSec = Math.max(1, Math.floor((expiresAt - now) / 1000));
    const sessionPayload = { ...payload, expiresAt, lastSeenAt: now };
    await redisClient.setEx(`${redisSessionKeyPrefix}${token}`, ttlSec, JSON.stringify(sessionPayload));
    await writeLegacySessionSnapshot();
    return token;
  }

  async function resolveSessionByToken(token) {
    const cleanToken = String(token || '').trim();
    if (!cleanToken) return null;
    const key = `${redisSessionKeyPrefix}${cleanToken}`;
    const raw = await redisClient.get(key);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || Number(session.expiresAt || 0) <= Date.now()) {
      await redisClient.del(key);
      return null;
    }

    const now = Date.now();
    const absoluteExpiry = Number(session.expiresAt || 0);
    const idleExpiry = now + (sessionIdleMinutes * 60 * 1000);
    const nextExpiry = Math.min(absoluteExpiry, idleExpiry);
    const ttlSec = Math.max(1, Math.floor((nextExpiry - now) / 1000));
    const refreshed = { ...session, lastSeenAt: now };
    await redisClient.setEx(key, ttlSec, JSON.stringify(refreshed));
    return { token: cleanToken, ...refreshed };
  }

  function getBearerTokenFromRequest(req) {
    const header = req.header('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  }

  async function getSessionFromRequest(req) {
    const bearerToken = getBearerTokenFromRequest(req);
    if (bearerToken) {
      return resolveSessionByToken(bearerToken);
    }
    return null;
  }

  async function getLiveSessionsSnapshot() {
    const now = Date.now();
    const keys = await redisClient.keys(`${redisSessionKeyPrefix}*`);
    const rows = [];
    for (const key of keys) {
      const token = key.slice(redisSessionKeyPrefix.length);
      const raw = await redisClient.get(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session || Number(session.expiresAt || 0) <= now) continue;
      rows.push({
        token,
        role: session.role,
        regNo: session.regNo || null,
        email: session.email || null,
        name: session.name || null,
        expiresAt: session.expiresAt,
        lastSeenAt: session.lastSeenAt || null,
        ttlMs: Math.max(Number(session.expiresAt || 0) - now, 0),
      });
    }
    return rows;
  }

  async function writeLegacySessionSnapshot() {
    try {
      const keys = await redisClient.keys(`${redisSessionKeyPrefix}*`);
      const now = Date.now();
      const rows = [];
      for (const key of keys) {
        const token = key.slice(redisSessionKeyPrefix.length);
        const raw = await redisClient.get(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || Number(parsed.expiresAt || 0) <= now) continue;
        rows.push({ token, ...parsed });
      }

      const payload = {
        version: 2,
        generatedAt: new Date(now).toISOString(),
        sessions: rows,
      };

      fs.mkdirSync(path.dirname(sessionStoreFilePath), { recursive: true });
      fs.writeFileSync(sessionStoreFilePath, JSON.stringify(payload), 'utf8');
    } catch (_err) {
      // Best effort legacy snapshot to keep existing operational visibility.
    }
  }

  async function restoreLegacySessionSnapshotToRedis() {
    try {
      if (!fs.existsSync(sessionStoreFilePath)) return;
      const raw = fs.readFileSync(sessionStoreFilePath, 'utf8');
      if (!raw.trim()) return;
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed?.sessions) ? parsed.sessions : [];
      const now = Date.now();
      for (const row of rows) {
        const token = String(row?.token || '').trim();
        const expiresAt = Number(row?.expiresAt || 0);
        if (!token || expiresAt <= now) continue;
        const ttlSec = Math.max(1, Math.floor((expiresAt - now) / 1000));
        const payload = { ...row, expiresAt, lastSeenAt: row.lastSeenAt || now };
        delete payload.token;
        await redisClient.setEx(`${redisSessionKeyPrefix}${token}`, ttlSec, JSON.stringify(payload));
      }
    } catch (_err) {
      // Legacy snapshot migration should never block startup.
    }
  }

  return {
    createSession,
    resolveSessionByToken,
    getBearerTokenFromRequest,
    getSessionFromRequest,
    getLiveSessionsSnapshot,
    writeLegacySessionSnapshot,
    restoreLegacySessionSnapshotToRedis,
    redisSessionKeyPrefix,
  };
}

module.exports = { createSessionManager, redisSessionKeyPrefix };
