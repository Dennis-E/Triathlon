const request = require('supertest');
const { createApp, createRateLimiter } = require('../src/app');

function createFirestore(initialCount = 0) {
  let count = initialCount;
  const eventIds = new Set();
  const ref = {
    id: 'analyses',
    get: async () => ({ exists: count > 0, data: () => ({ count }) })
  };

  return {
    collection: jest.fn(name => ({
      doc: jest.fn(id => name === 'metrics' ? ref : { id, collection: name })
    })),
    runTransaction: async callback => callback({
      get: async documentRef => documentRef === ref
        ? { exists: count > 0, data: () => ({ count }) }
        : { exists: eventIds.has(documentRef.id), data: () => ({}) },
      set: (documentRef, values) => {
        if (documentRef === ref) count = values.count;
        else eventIds.add(documentRef.id);
      }
    }),
    getCount: () => count
  };
}

describe('analysis counter API', () => {
  const allowedOrigin = 'https://app.example';
  const allowedOrigins = new Set([allowedOrigin]);
  const clientKeys = ['k2026-09.test-key'];
  const eventId = '123e4567-e89b-42d3-a456-426614174000';

  it('returns zero before the first recorded analysis', async () => {
    const firestore = createFirestore();
    const app = createApp({ firestore, allowedOrigins, clientKeys });

    await request(app)
      .get('/v1/analyses/count')
      .set('Origin', allowedOrigin)
      .expect(200, { count: 0 })
      .expect('Access-Control-Allow-Origin', allowedOrigin);
  });

  it('increments and returns the counter after a completed analysis', async () => {
    const firestore = createFirestore(4);
    const app = createApp({ firestore, allowedOrigins, clientKeys });

    await request(app)
      .post('/v1/analyses')
      .set('Origin', allowedOrigin)
      .set('X-Analysis-Key', clientKeys[0])
      .set('X-Analysis-Event-Id', eventId)
      .expect(201, { count: 5 });

    expect(firestore.getCount()).toBe(5);
  });

  it('rejects origins outside the configured allowlist', async () => {
    const app = createApp({ firestore: createFirestore(), allowedOrigins, clientKeys });

    await request(app)
      .get('/v1/analyses/count')
      .set('Origin', 'https://untrusted.example')
      .expect(403, { error: 'Origin is not allowed' });
  });

  it('responds to allowed CORS preflight requests', async () => {
    const app = createApp({ firestore: createFirestore(), allowedOrigins, clientKeys });

    await request(app)
      .options('/v1/analyses')
      .set('Origin', allowedOrigin)
      .expect(204)
      .expect('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .expect('Access-Control-Allow-Headers', 'Content-Type, X-Analysis-Key, X-Analysis-Event-Id');
  });

  it('rate limits repeated analysis events from one client', async () => {
    const app = createApp({
      firestore: createFirestore(),
      allowedOrigins,
      clientKeys,
      rateLimiter: createRateLimiter({ maxRequests: 1, windowMs: 600000 })
    });

    await request(app).post('/v1/analyses').set('X-Analysis-Key', clientKeys[0]).set('X-Analysis-Event-Id', eventId).expect(201);
    await request(app).post('/v1/analyses').set('X-Analysis-Key', clientKeys[0]).set('X-Analysis-Event-Id', '123e4567-e89b-42d3-a456-426614174001').expect(429);
  });

  it('rejects a missing or invalid client key', async () => {
    const app = createApp({ firestore: createFirestore(), allowedOrigins, clientKeys });

    await request(app).post('/v1/analyses').set('X-Analysis-Event-Id', eventId).expect(401);
    await request(app).post('/v1/analyses').set('X-Analysis-Key', 'wrong').set('X-Analysis-Event-Id', eventId).expect(401);
  });

  it('counts the same event ID only once', async () => {
    const firestore = createFirestore(4);
    const app = createApp({ firestore, allowedOrigins, clientKeys });

    const post = () => request(app).post('/v1/analyses')
      .set('X-Analysis-Key', clientKeys[0])
      .set('X-Analysis-Event-Id', eventId);
    await post().expect(201, { count: 5 });
    await post().expect(201, { count: 5 });
    expect(firestore.getCount()).toBe(5);
  });
});