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

  const STORAGE_KEY = 'trianalytics:analysis-counter:recorded:v1';

  function createEventId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;
  }

  function getStoredEvent(storage) {
    try {
      const value = storage && storage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function storeEvent(storage, event) {
    try {
      storage && storage.setItem(STORAGE_KEY, JSON.stringify(event));
    } catch (error) {
      // Storage restrictions must not prevent a local analysis.
    }
  }

  function createAnalysisCounter({ apiBaseUrl, clientKey, fetchImpl, storage, eventIdFactory } = {}) {
    const baseUrl = normalizeApiBaseUrl(apiBaseUrl);
    const request = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    const browserStorage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
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
      recordAnalysis: async () => {
        const storedEvent = getStoredEvent(browserStorage);
        if (storedEvent && storedEvent.status === 'recorded') return storedEvent.count;

        const event = storedEvent && storedEvent.eventId
          ? storedEvent
          : { eventId: createId(), status: 'pending' };
        storeEvent(browserStorage, event);

        const count = await call('/v1/analyses', {
          method: 'POST',
          headers: {
            'X-Analysis-Key': clientKey,
            'X-Analysis-Event-Id': event.eventId
          }
        });
        storeEvent(browserStorage, { ...event, status: 'recorded', count });
        return count;
      }
    };
  }

  return { createAnalysisCounter, STORAGE_KEY };
});