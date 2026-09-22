const { createAnalysisCounter } = require('../src/analysis-counter');

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
      fetchImpl
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
      fetchImpl
    });

    await expect(counter.recordAnalysis()).rejects.toThrow('status 429');
  });

  it('stays disabled until an API URL is configured', async () => {
    const counter = createAnalysisCounter({ fetchImpl: jest.fn() });

    expect(counter.isConfigured()).toBe(false);
    await expect(counter.getCount()).rejects.toThrow('not configured');
  });

  it('records every successful upload, not just the first one in a browser', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 18 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 19 }) });
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      fetchImpl
    });

    await expect(counter.recordAnalysis()).resolves.toBe(18);
    await expect(counter.recordAnalysis()).resolves.toBe(19);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('uses a distinct event ID for each recorded analysis', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 1 }) });
    let nextId = 0;
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      fetchImpl,
      eventIdFactory: () => `event-${nextId++}`
    });

    await counter.recordAnalysis();
    await counter.recordAnalysis();

    const eventIds = fetchImpl.mock.calls.map(([, options]) => options.headers['X-Analysis-Event-Id']);
    expect(eventIds).toEqual(['event-0', 'event-1']);
  });

  it('records analyses without reading or writing any browser storage', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 5 }) });
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    const counter = createAnalysisCounter({
      apiBaseUrl: 'https://api.example.com',
      clientKey: 'public-client-key',
      fetchImpl,
      storage
    });

    await expect(counter.recordAnalysis()).resolves.toBe(5);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});