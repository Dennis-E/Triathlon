const request = require('supertest');
const { createApp, createRateLimiter } = require('../src/app');

function createFirestore(initialCount = 0) {
  let count = initialCount;
  const ref = {
    id: 'analyses',
    get: async () => ({ exists: count > 0, data: () => ({ count }) })
  };

  return {
    collection: jest.fn(() => ({ doc: jest.fn(() => ref) })),
    runTransaction: async callback => callback({
      get: async () => ({ exists: count > 0, data: () => ({ count }) }),
      set: (documentRef, values) => { count = values.count; }
    }),
    getCount: () => count
  };
}

describe('analysis counter API', () => {
  const allowedOrigins = new Set(['https://example.invalid']);

  it('returns zero before the first recorded analysis', async () => {
    const firestore = createFirestore();
    const app = createApp({ firestore, allowedOrigins });

    await request(app)
      .get('/v1/analyses/count')
      .set('Origin', 'https://example.invalid')
      .expect(200, { count: 0 })
      .expect('Access-Control-Allow-Origin', 'https://example.invalid');
  });

  it('increments and returns the counter after a completed analysis', async () => {
    const firestore = createFirestore(4);
    const app = createApp({ firestore, allowedOrigins });

    await request(app)
      .post('/v1/analyses')
      .set('Origin', 'https://example.invalid')
      .expect(201, { count: 5 });

    expect(firestore.getCount()).toBe(5);
  });

  it('rejects origins outside the configured allowlist', async () => {
    const app = createApp({ firestore: createFirestore(), allowedOrigins });

    await request(app)
      .get('/v1/analyses/count')
      .set('Origin', 'https://untrusted.example')
      .expect(403, { error: 'Origin is not allowed' });
  });

  it('responds to allowed CORS preflight requests', async () => {
    const app = createApp({ firestore: createFirestore(), allowedOrigins });

    await request(app)
      .options('/v1/analyses')
      .set('Origin', 'https://example.invalid')
      .expect(204)
      .expect('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  });

  it('rate limits repeated analysis events from one client', async () => {
    const app = createApp({
      firestore: createFirestore(),
      allowedOrigins,
      rateLimiter: createRateLimiter({ maxRequests: 1, windowMs: 600000 })
    });

    await request(app).post('/v1/analyses').expect(201);
    await request(app).post('/v1/analyses').expect(429);
  });
});