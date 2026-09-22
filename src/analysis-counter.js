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

  function createEventId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;
  }

  function createAnalysisCounter({ apiBaseUrl, clientKey, fetchImpl, eventIdFactory } = {}) {
    const baseUrl = normalizeApiBaseUrl(apiBaseUrl);
    const request = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    const createId = eventIdFactory || createEventId;

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
      isConfigured: () => Boolean(baseUrl && clientKey && request),
      getCount: () => call('/v1/analyses/count'),
      recordAnalysis: () => call('/v1/analyses', {
        method: 'POST',
        headers: {
          'X-Analysis-Key': clientKey,
          'X-Analysis-Event-Id': createId()
        }
      })
    };
  }

  return { createAnalysisCounter };
});