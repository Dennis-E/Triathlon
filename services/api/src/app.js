const express = require('express');
const { timingSafeEqual } = require('crypto');

const DEFAULT_ALLOWED_ORIGINS = [
  'https://example.invalid',
  'http://localhost:8000'
];

function parseAllowedOrigins(value) {
  return new Set((value || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean));
}

function parseCount(snapshot) {
  const count = snapshot.exists ? snapshot.data().count : 0;
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function parseClientKeys(value) {
  return (value || '').split(',').map(key => key.trim()).filter(Boolean);
}

function hasClientKey(clientKey, acceptedKeys) {
  if (!clientKey) return false;
  return acceptedKeys.some(acceptedKey => {
    const supplied = Buffer.from(clientKey);
    const expected = Buffer.from(acceptedKey);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

function isValidEventId(eventId) {
  return typeof eventId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
}

function createRateLimiter({ maxRequests = 20, windowMs = 600000, now = Date.now } = {}) {
  const requestsByIp = new Map();

  return function rateLimit(req, res, next) {
    const timestamp = now();
    const clientIp = req.ip || 'unknown';
    const recentRequests = (requestsByIp.get(clientIp) || [])
      .filter(requestTime => timestamp - requestTime < windowMs);

    if (recentRequests.length >= maxRequests) {
      res.status(429).json({ error: 'Too many analysis events. Please try again later.' });
      return;
    }

    recentRequests.push(timestamp);
    requestsByIp.set(clientIp, recentRequests);
    next();
  };
}

function createApp({ firestore, allowedOrigins, rateLimiter, clientKeys } = {}) {
  if (!firestore) throw new Error('Firestore is required');

  const app = express();
  const origins = allowedOrigins || parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
  const acceptedClientKeys = clientKeys || parseClientKeys(process.env.ANALYSIS_CLIENT_KEYS);
  const analysesRef = firestore.collection('metrics').doc('analyses');
  const analysisEvents = firestore.collection('analysisEvents');

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (!origin) {
      next();
      return;
    }

    if (!origins.has(origin)) {
      res.status(403).json({ error: 'Origin is not allowed' });
      return;
    }

    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Analysis-Key, X-Analysis-Event-Id');
    res.vary('Origin');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/v1/analyses/count', async (req, res, next) => {
    try {
      const snapshot = await analysesRef.get();
      res.json({ count: parseCount(snapshot) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/v1/analyses', rateLimiter || createRateLimiter(), async (req, res, next) => {
    try {
      const clientKey = req.get('X-Analysis-Key');
      const eventId = req.get('X-Analysis-Event-Id');
      if (!hasClientKey(clientKey, acceptedClientKeys)) {
        res.status(401).json({ error: 'Analysis key is invalid' });
        return;
      }
      if (!isValidEventId(eventId)) {
        res.status(400).json({ error: 'Analysis event ID is invalid' });
        return;
      }

      const count = await firestore.runTransaction(async transaction => {
        const eventRef = analysisEvents.doc(eventId);
        const existingEvent = await transaction.get(eventRef);
        if (existingEvent.exists) return parseCount(await transaction.get(analysesRef));

        const snapshot = await transaction.get(analysesRef);
        const nextCount = parseCount(snapshot) + 1;
        transaction.set(analysesRef, { count: nextCount }, { merge: true });
        transaction.set(eventRef, { createdAt: new Date() });
        return nextCount;
      });
      res.status(201).json({ count });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    console.error('API request failed', error);
    res.status(500).json({ error: 'Could not process request' });
  });

  return app;
}

module.exports = { createApp, createRateLimiter, hasClientKey, isValidEventId, parseAllowedOrigins, parseClientKeys };