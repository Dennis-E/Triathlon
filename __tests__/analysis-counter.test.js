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
    const counter = createAnalysisCounter({ apiBaseUrl: 'https://api.example.com', fetchImpl });

    await expect(counter.recordAnalysis()).resolves.toBe(18);
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/v1/analyses', { method: 'POST' });
  });

  it('rejects API failures without manufacturing a count', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429 });
    const counter = createAnalysisCounter({ apiBaseUrl: 'https://api.example.com', fetchImpl });

    await expect(counter.recordAnalysis()).rejects.toThrow('status 429');
  });

  it('stays disabled until an API URL is configured', async () => {
    const counter = createAnalysisCounter({ fetchImpl: jest.fn() });

    expect(counter.isConfigured()).toBe(false);
    await expect(counter.getCount()).rejects.toThrow('not configured');
  });
});