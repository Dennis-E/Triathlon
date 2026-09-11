const { createAnalysisCounter, STORAGE_KEY } = require('../src/analysis-counter');

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
}

describe('analysis counter client', () => {
  it('loads the current total from the API', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 17 })
    });
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com/',
      fetchImpl
    });

    await expect(counter.getCount()).resolves.toBe(17);
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/v1/analyses/count', undefined);
  });

  it('records a completed analysis with one POST request', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 18 })
    });
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      eventIdFactory: () => '123e4567-e89b-42d3-a456-426614174000',
      fetchImpl,
      storage: createStorage()
    });

    await expect(counter.recordAnalysis()).resolves.toBe(18);
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/v1/analyses', {
      method: 'POST',
      headers: {
        'X-Analysis-Key': 'public-client-key',
        'X-Analysis-Event-Id': '123e4567-e89b-42d3-a456-426614174000'
      }
    });
  });

  it('rejects API failures without manufacturing a count', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429 });
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      fetchImpl,
      storage: createStorage()
    });

    await expect(counter.recordAnalysis()).rejects.toThrow('status 429');
  });

  it('stays disabled until an API URL is configured', async () => {
    const counter = createAnalysisCounter({ fetchImpl: jest.fn() });

    expect(counter.isConfigured()).toBe(false);
    await expect(counter.getCount()).rejects.toThrow('not configured');
  });

  it('does not record the same browser analysis twice', async () => {
    const storage = createStorage();
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 18 }) });
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      fetchImpl,
      storage,
      eventIdFactory: () => '123e4567-e89b-42d3-a456-426614174000'
    });

    await counter.recordAnalysis();
    await expect(counter.recordAnalysis()).resolves.toBe(18);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem(STORAGE_KEY))).toMatchObject({ status: 'recorded', count: 18 });
  });
});