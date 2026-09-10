(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.AnalysisCounter = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  function normalizeApiBaseUrl(apiBaseUrl) {
    return typeof apiBaseUrl === 'string' ? apiBaseUrl.trim().replace(/\/+$/, '') : '';
  }

  function parseCount(payload) {
    const count = payload && payload.count;
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Counter API returned an invalid count');
    }
    return count;
  }

  function createAnalysisCounter({ apiBaseUrl, fetchImpl } = {}) {
    const baseUrl = normalizeApiBaseUrl(apiBaseUrl);
    const request = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

    async function call(path, options) {
      if (!baseUrl || !request) {
        throw new Error('Counter API is not configured');
      }

      const response = await request(`${baseUrl}${path}`, options);
      if (!response.ok) {
        throw new Error(`Counter API request failed with status ${response.status}`);
      }
      return parseCount(await response.json());
    }

    return {
      isConfigured: () => Boolean(baseUrl && request),
      getCount: () => call('/v1/analyses/count'),
      recordAnalysis: () => call('/v1/analyses', { method: 'POST' })
    };
  }

  return { createAnalysisCounter };
});