const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dashboardImportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-import.js'),
  'utf8'
);
const importExperienceCatalog = require('../src/import-experience-catalog');
const countryCountUtils = require('../src/country-count-utils');
const appleHealthUtils = require('../src/apple-health-utils');

function deferredImport() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function loadImportOperationRuntime() {
  const context = {
    window: { importExperienceCatalog, appleHealthUtils },
    Papa: { parse: jest.fn() },
    WritableStream,
    location: { protocol: 'http:', hostname: '127.0.0.1' },
    isSecureContext: true,
    setTimeout: jest.fn(() => 2),
    clearTimeout: jest.fn(),
    setInterval: jest.fn(() => 1),
    clearInterval: jest.fn(),
    updateStatusBadge: jest.fn(),
    setSportFilter: jest.fn(),
    recordCompletedAnalysis: jest.fn(),
    console: { error: jest.fn() }
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}
    let importedDataset = null;
    let rawCsvData = [];
    let processedActivities = [];
    let fitBestEffortsByActivityId = {};
    let gpsTracksByActivityId = {};
    let heatmapActivitySummaryIndex = new Map();
    processData = () => [{ id: 'csv-test', sport: 'Run', distance: 5, duration: 1800 }];
    this.commitDataset = applyImportedDataset;
    applyImportedDataset = dataset => { this.applied.push(dataset); };
    this.applied = [];
    this.begin = beginImportOperation;
    this.isCurrent = isCurrentImportOperation;
    this.runTrainingPeaks = executeTrainingPeaksZipImport;
    this.runAppleHealth = executeAppleHealthZipImport;
    this.runAppleWorker = importAppleHealthInWorker;
    this.runCsv = importCsvText;
    this.runSample = handleSampleDataIngest;
  `, context);
  return context;
}

function loadAppleControllerRuntime() {
  const runtime = loadImportOperationRuntime();
  runtime.testWorkers = [];
  runtime.Worker = class SyntheticWorker {
    constructor() {
      this.terminate = jest.fn();
      this.postMessage = jest.fn();
      runtime.testWorkers.push(this);
    }
  };
  return runtime;
}

function loadAppleWorkerRuntime(overrides = {}) {
  const runtime = {
    Date, Float64Array, Uint32Array, TextEncoder, TextDecoder, ReadableStream, WritableStream, AbortController,
    crypto: require('crypto').webcrypto, isSecureContext: true, location: { protocol: 'http:', hostname: '127.0.0.1' },
    appleHealthUtils, sax: require('sax'), zip: { ...require('@zip.js/zip.js/index-native.js'), configure: jest.fn() },
    extractGpxTrackpoints: require('../src/zip-importer').extractGpxTrackpoints,
    powerPbUtils: require('../src/power-pb-utils'), importScripts: jest.fn(), postMessage: jest.fn(), close: jest.fn(),
    appleHealthImporter: { importAppleHealthZip: jest.fn().mockResolvedValue({ activities: [], gpsTracksByActivityId: {}, fitBestEffortsByActivityId: {} }) },
    ...overrides
  };
  runtime.self = runtime;
  vm.createContext(runtime);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/apple-health-worker.js'), 'utf8'), runtime);
  return runtime;
}

describe('Apple worker initialization contract', () => {
  it('initializes the actual worker script before receiving a health file', async () => {
    const runtime = loadAppleWorkerRuntime();
    await runtime.onmessage({ data: { v: 1, type: 'init', generation: 3 } });
    expect(runtime.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ v: 1, type: 'ready', generation: 3 }));
    expect(runtime.appleHealthImporter.importAppleHealthZip).not.toHaveBeenCalled();
    expect(runtime.close).not.toHaveBeenCalled();
    await runtime.onmessage({ data: { v: 1, type: 'start', generation: 3, file: { name: 'synthetic.zip' } } });
    expect(runtime.appleHealthImporter.importAppleHealthZip).toHaveBeenCalledTimes(1);
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ importScripts: () => { throw new Error('private-filename'); } }, 'DEPENDENCY_LOAD_FAILED'],
    [{ sax: {} }, 'DEPENDENCY_INVALID'], [{ TextDecoder: undefined }, 'MISSING_CAPABILITY'],
    [{ crypto: { subtle: { digest: async () => { throw new Error('private-message'); } } } }, 'HASH_FAILED'],
    [{ crypto: { subtle: { digest: async () => new ArrayBuffer(32) } } }, 'HASH_FAILED']
  ])('reports safe worker initialization errors without processing a file', async (changes, code) => {
    const runtime = loadAppleWorkerRuntime(changes);
    await runtime.onmessage({ data: { v: 1, type: 'init', generation: 3 } });
    expect(runtime.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'error', v: 1, generation: 3, code,
      diagnostic: expect.objectContaining({ code, generation: 3, environment: { scheme: 'http', hostClass: 'loopback', secureContext: true, realm: 'worker' } }) }));
    expect(JSON.stringify(runtime.postMessage.mock.calls)).not.toContain('private');
    expect(runtime.appleHealthImporter.importAppleHealthZip).not.toHaveBeenCalled();
    expect(runtime.close).toHaveBeenCalledTimes(1);
    const component = code === 'HASH_FAILED' ? 'crypto' : code === 'MISSING_CAPABILITY' ? 'text' : code === 'DEPENDENCY_INVALID' ? 'sax' : 'importer';
    expect(runtime.postMessage.mock.calls.at(-1)[0].diagnostic.component).toBe(component);
  });

  it.each([
    ['runtime', 'WORKER_RUNTIME_FAILED'], ['messageerror', 'WORKER_PROTOCOL_ERROR'],
    ['bad-message', 'WORKER_PROTOCOL_ERROR'], ['timeout', 'WORKER_INIT_TIMEOUT']
  ])('cleans the window controller exactly once after %s', async (mode, code) => {
    const runtime = loadAppleControllerRuntime();
    const operation = runtime.begin('personal');
    const pending = runtime.runAppleWorker({ name: 'synthetic.zip' }, jest.fn(), operation).catch(error => error);
    const worker = runtime.testWorkers.at(-1);
    if (mode === 'runtime') worker.onerror({ message: 'private-error' });
    if (mode === 'messageerror') worker.onmessageerror?.({});
    if (mode === 'bad-message') worker.onmessage({ data: { v: 2, generation: operation.generation, type: 'ready' } });
    if (mode === 'timeout') runtime.setTimeout.mock.calls.find(call => call[1] === 30000)?.[0]();
    runtime.begin('sample');
    expect(await pending).toMatchObject({ code });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(runtime.clearInterval).toHaveBeenCalledTimes(1);
    expect(runtime.clearTimeout).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
    expect(worker.onmessageerror).toBeNull();
  });

  it('catches constructor and initial clone failures without exposing raw exceptions', async () => {
    for (const mode of ['constructor', 'clone']) {
      const runtime = loadAppleControllerRuntime();
      const terminate = jest.fn();
      runtime.Worker = class {
        constructor() { if (mode === 'constructor') throw new Error('private-error'); }
        terminate = terminate;
        postMessage() { throw new Error('private-error'); }
      };
      const result = await runtime.runAppleWorker({ name: 'synthetic.zip' }, jest.fn(), runtime.begin('personal')).catch(error => error);
      expect(result.code).toBe(mode === 'constructor' ? 'WORKER_START_FAILED' : 'WORKER_PROTOCOL_ERROR');
      expect(result.message).not.toContain('private');
      expect(terminate).toHaveBeenCalledTimes(mode === 'constructor' ? 0 : 1);
    }
  });

  it('does not apply an already-cleared initialization watchdog during processing', async () => {
    const runtime = loadAppleControllerRuntime();
    const operation = runtime.begin('personal');
    const outcome = runtime.runAppleWorker({ name: 'synthetic.zip' }, jest.fn(), operation).catch(error => error);
    const worker = runtime.testWorkers.at(-1);
    const onmessage = worker.onmessage;
    const watchdog = runtime.setTimeout.mock.calls.find(call => call[1] === 30000)[0];
    onmessage({ data: { v: 1, generation: operation.generation, type: 'ready' } });
    watchdog();
    onmessage({ data: { v: 1, generation: operation.generation, type: 'complete', result: {
      activities: [{ id: 'synthetic', sport: 'Run', startTime: Date.parse('2026-07-19T10:00:00Z'), sourceLocalStart: { year: 2026, month: 7, day: 19 } }],
      gpsTracksByActivityId: {}
    } } });
    expect(await outcome).toHaveProperty('activities');
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(runtime.clearTimeout).toHaveBeenCalledTimes(1);
  });

  it.each(['progress-before-ready', 'complete-before-ready', 'duplicate-ready', 'unsafe-diagnostic', 'invalid-result'])(
    'rejects %s without committing or forwarding unsafe content', async mode => {
      const runtime = loadAppleControllerRuntime();
      const operation = runtime.begin('personal');
      const progress = jest.fn();
      const outcome = runtime.runAppleWorker({ name: 'synthetic.zip' }, progress, operation).catch(error => error);
      const worker = runtime.testWorkers.at(-1);
      if (['duplicate-ready', 'invalid-result'].includes(mode)) worker.onmessage({ data: { v: 1, type: 'ready', generation: operation.generation } });
      const messages = {
        'progress-before-ready': { type: 'progress', phase: 'readingWorkouts', percent: 5 },
        'complete-before-ready': { type: 'complete', result: { activities: [] } },
        'duplicate-ready': { type: 'ready' },
        'unsafe-diagnostic': { type: 'error', code: 'INVALID_XML', diagnostic: { filename: 'private-value' } },
        'invalid-result': { type: 'complete', result: { activities: [{ sport: 'Run', startTime: 0, sourceLocalStart: { year: 2026, month: 13, day: 1 } }] } }
      };
      worker.onmessage({ data: { v: 1, generation: operation.generation, ...messages[mode] } });
      runtime.begin('sample');
      const result = await outcome;
      expect(result.code).toBe('WORKER_PROTOCOL_ERROR');
      expect(JSON.stringify(result.diagnostic)).not.toContain('private');
      expect(progress).not.toHaveBeenCalled();
      expect(runtime.applied).toEqual([]);
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    }
  );

  it('preserves the previous dashboard on worker failure and commits only a fresh successful retry', async () => {
    const runtime = loadAppleControllerRuntime();
    const previous = { activities: [{ id: 'previous' }] };
    runtime.applied.push(previous);
    const first = runtime.runAppleHealth({ name: 'synthetic.zip' }).catch(error => error);
    const oldWorker = runtime.testWorkers.at(-1);
    const lateHandler = oldWorker.onmessage;
    oldWorker.onerror({ message: 'private-value' });
    expect((await first).code).toBe('WORKER_RUNTIME_FAILED');
    expect(runtime.applied).toEqual([previous]);
    expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
    const second = runtime.runAppleHealth({ name: 'synthetic.zip' });
    const worker = runtime.testWorkers.at(-1);
    const generation = worker.postMessage.mock.calls[0][0].generation;
    worker.onmessage({ data: { v: 1, generation: generation + 10, type: 'ready' } });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    worker.onmessage({ data: { v: 1, generation, type: 'ready' } });
    lateHandler({ data: { v: 1, generation: generation - 1, type: 'complete', result: { activities: [] } } });
    worker.onmessage({ data: { v: 1, generation, type: 'complete', result: {
      activities: [{ id: 'synthetic-retry', sport: 'Run', startTime: Date.parse('2026-07-19T10:00:00Z'), sourceLocalStart: { year: 2026, month: 7, day: 19 } }],
      gpsTracksByActivityId: {}, diagnostics: {}
    } } });
    const dataset = await second;
    expect(runtime.applied).toEqual([previous, dataset]);
    expect(runtime.recordCompletedAnalysis).toHaveBeenCalledTimes(1);
    expect(worker).not.toBe(oldWorker);
    expect(oldWorker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it.each([['utilities', 'DEPENDENCY_LOAD_FAILED'], ['file', 'UNSUPPORTED_DEPLOYMENT'], ['remote', 'INSECURE_CONTEXT'], ['Worker', 'MISSING_CAPABILITY']])(
    'rejects missing or unsupported window prerequisite %s before starting a worker', async (mode, code) => {
      const runtime = loadAppleControllerRuntime();
      if (mode === 'utilities') runtime.window.appleHealthUtils = undefined;
      if (mode === 'file') runtime.location = { protocol: 'file:', hostname: '' };
      if (mode === 'remote') { runtime.location = { protocol: 'http:', hostname: 'example.invalid' }; runtime.isSecureContext = false; }
      if (mode === 'Worker') runtime.Worker = undefined;
      const outcome = await runtime.runAppleHealth({ name: 'synthetic.zip' }).catch(error => error);
      expect(outcome.code).toBe(code);
      expect(runtime.testWorkers).toHaveLength(0);
      expect(runtime.applied).toEqual([]);
      expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
    }
  );

  it.each(['cancel', 'clone'])('cleans an already-ready worker after %s without a commit', async mode => {
    const runtime = loadAppleControllerRuntime();
    const operation = runtime.begin('personal');
    const outcome = runtime.runAppleWorker({ name: 'synthetic.zip' }, jest.fn(), operation).catch(error => error);
    const worker = runtime.testWorkers.at(-1);
    const lateHandler = worker.onmessage;
    if (mode === 'clone') worker.postMessage.mockImplementationOnce(() => { throw new Error('private-value'); });
    lateHandler({ data: { v: 1, generation: operation.generation, type: 'ready' } });
    if (mode === 'cancel') runtime.begin('sample');
    lateHandler({ data: { v: 1, generation: operation.generation, type: 'complete', result: { activities: [] } } });
    expect(await outcome).toMatchObject({ code: mode === 'cancel' ? 'CANCELLED' : 'WORKER_PROTOCOL_ERROR' });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(runtime.clearTimeout).toHaveBeenCalledTimes(1);
    expect(runtime.applied).toEqual([]);
  });

  it('cancels initialization without emitting late ready or processing a file', async () => {
    const probe = deferredImport();
    const runtime = loadAppleWorkerRuntime({ crypto: { subtle: { digest: () => probe.promise } } });
    const handle = runtime.onmessage;
    const initializing = handle({ data: { v: 1, type: 'init', generation: 3 } });
    await handle({ data: { v: 1, type: 'cancel', generation: 3 } });
    probe.resolve(await require('crypto').webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('abc')));
    await initializing;
    expect(runtime.postMessage).toHaveBeenCalledTimes(1);
    expect(runtime.postMessage.mock.calls[0][0]).toMatchObject({ type: 'error', code: 'CANCELLED' });
    expect(runtime.appleHealthImporter.importAppleHealthZip).not.toHaveBeenCalled();
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });
});

function prepareStravaOperationRuntime(runtime, archive) {
  let input;
  const node = { textContent: '', classList: { add() {}, remove() {} } };
  runtime.document = { createElement: () => (input = { click() {} }),
    getElementById: id => id === 'sampleDataBtn' || id === 'sampleDataStatus' ? null : node };
  runtime.importStravaZip = jest.fn(() => archive.promise);
  runtime.showImportProgressModal = jest.fn();
  runtime.setImportModalVisualState = jest.fn();
  runtime.updateImportProgress = jest.fn();
  runtime.hideImportProgressModal = jest.fn();
  runtime.setTimeout = jest.fn();
  runtime.handleStravaIngest();
  return input.onchange({ target: { files: [{ name: 'synthetic-strava.zip' }] } });
}

describe('shared dashboard import operations', () => {
  it('sanitizes Apple UI failures and retries explicitly with a new import generation', async () => {
    const runtime = loadImportOperationRuntime();
    let input;
    const nodes = Object.fromEntries(['importProgressError', 'importProgressDetail', 'appleHealthImportStatus', 'appleHealthRetryBtn']
      .map(id => [id, { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } }]));
    runtime.document = { createElement: () => (input = { click() {} }), getElementById: id => nodes[id] || null };
    runtime.showImportProgressModal = jest.fn();
    runtime.hideImportProgressModal = jest.fn();
    runtime.setImportModalVisualState = jest.fn();
    runtime.updateImportProgress = jest.fn();
    runtime.executeAppleHealthZipImport = jest.fn()
      .mockRejectedValueOnce(Object.assign(new Error('private-filename-and-message'), { code: 'DEPENDENCY_LOAD_FAILED' }))
      .mockResolvedValueOnce({ activities: [{ id: 'synthetic-retry' }], diagnostics: {} });
    runtime.handleAppleHealthIngest();
    await input.onchange({ target: { files: [{ name: 'synthetic.zip' }] } });
    expect(nodes.importProgressDetail.textContent).toContain('DEPENDENCY_LOAD_FAILED');
    expect(nodes.importProgressDetail.textContent).not.toContain('private');
    expect(nodes.appleHealthRetryBtn.classList.remove).toHaveBeenCalledWith('hidden');
    expect(runtime.executeAppleHealthZipImport).toHaveBeenCalledTimes(1);
    await runtime.retryAppleHealthImport();
    expect(runtime.executeAppleHealthZipImport).toHaveBeenCalledTimes(2);
    const generations = runtime.executeAppleHealthZipImport.mock.calls.map(([, options]) => options.operation.generation);
    expect(generations[1]).toBeGreaterThan(generations[0]);
    expect(runtime.hideImportProgressModal).toHaveBeenCalledTimes(1);
  });

  it('keeps average-only and field-specific heart-rate import notes reachable without the extrema tab', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const heartRate = require('../src/heart-rate-utils');
    const dataset = { rawCsvData: [], activities: [{ id: 'notes', date: new Date(2026, 6, 19), sport: 'Run', avgHeartRate: 145,
      ...heartRate.resolveHeartRateExtrema(heartRate.inspectCsvHeartRateExtrema([], [])) }] };
    dataset.heartRateCoverage = heartRate.summarizeHeartRateCoverage(dataset.activities);
    runtime.applyDataset(dataset);
    const note = runtime.context.document.getElementById('heartRateImportNote');
    expect(note.textContent).toMatch(/Average heart rate available/i);
    expect(note.textContent).toMatch(/no usable minimum\/maximum/i);
    expect(note.classList.remove).toHaveBeenCalledWith('hidden');
    runtime.applyDataset({ ...dataset, heartRateCoverage: { average: 1, minimum: { records: 1 }, maximum: { summary: 1 } } });
    expect(note.textContent).toMatch(/recorded measurements/i);
    expect(note.textContent).toMatch(/direct/i);
    runtime.applyDataset({ ...dataset, sourceType: 'sample' });
    expect(note.textContent).toBe('');
    expect(note.classList.add).toHaveBeenCalledWith('hidden');
  });

  it('retains aggregate heart-rate coverage in existing CSV and Apple dataset diagnostics', () => {
    const runtime = loadImportOperationRuntime();
    const heartRate = require('../src/heart-rate-utils');
    runtime.window.heartRateUtils = heartRate;
    runtime.processData = () => [{ id: 'coverage', date: new Date(2026, 6, 19), sport: 'Run', distance: 5, duration: 1800,
      avgHeartRate: 145, ...heartRate.resolveHeartRateExtrema(heartRate.inspectCsvHeartRateExtrema(['Max. Herzfrequenz'], ['180'])) }];
    const csv = runtime.createImportedDataset([], 'Synthetic');
    expect(csv.heartRateCoverage).toMatchObject({ average: 1, minimum: { missing: 1 }, maximum: { summary: 1 } });
    const apple = runtime.createAppleHealthImportedDataset({ activities: csv.activities, diagnostics: { importedCount: 1 } }, 'synthetic.zip');
    expect(apple.diagnostics).toMatchObject({ importedCount: 1, heartRateCoverage: csv.heartRateCoverage });
  });

  it.each([['', '180', 180], ['180', '', 180], ['180', '180', 180], ['180', '190', null], ['180', 'bad', null]])(
    'uses actual browser Strava alias normalization %s / %s with CommonJS parity', (first, second, expected) => {
      const rows = [
        ['ID', 'Activity Date', 'Activity Type', 'Distance', 'Distance', 'Average Heart Rate', 'Max. Herzfrequenz', 'Max. Herzfrequenz'],
        ['alias', '19.07.2026, 14:52:02', 'Run', '10', '10000', '145', first, second]
      ];
      const browser = processRuntimeData(rows)[0];
      const common = require('../src/dashboard-utils').processData(rows)[0];
      expect(browser).toMatchObject({ id: 'alias', distance: 10, avgHeartRate: 145, minHeartRate: null, maxHeartRate: expected });
      expect([browser.minHeartRate, browser.maxHeartRate]).toEqual([common.minHeartRate, common.maxHeartRate]);
    }
  );

  it('keeps actual browser and CommonJS Strava alias provenance equal', () => {
    const rows = [
      ['ID', 'Activity Date', 'Activity Type', 'Distance', 'Max. Herzfrequenz', 'Average Heart Rate'],
      ['alias', '19.07.2026, 14:52:02', 'Run', '10', '180', '145']
    ];
    const browser = processRuntimeData(rows)[0];
    const common = require('../src/dashboard-utils').processData(rows)[0];
    expect(browser.heartRateProvenance).toMatchObject({ minimum: { status: 'missing' }, maximum: { value: 180, status: 'valid', source: 'summary' } });
    expect(browser.heartRateProvenance).toEqual(common.heartRateProvenance);
  });

  it('uses the real browser CSV normalizer for explicit heart-rate extrema with CommonJS parity', () => {
    const context = vm.createContext({ Date, window: { scatterUtils: require('../src/scatter-utils'), heartRateUtils: require('../src/heart-rate-utils') } });
    for (const file of ['dashboard-state.js', 'dashboard-core.js', 'dashboard-import.js']) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
    }
    const rows = [
      ['ID', 'Activity Date', 'Activity Type', 'Distance', 'Distance', 'Average Heart Rate', 'Min Heart Rate', 'Max Heart Rate'],
      ['original-id', '19.07.2026, 14:52:02', 'Run', '10', '10000', '145', '75,5', '180']
    ];
    const browser = context.processData(rows)[0];
    const common = require('../src/dashboard-utils').processData(rows)[0];
    expect(browser).toMatchObject({ id: 'original-id', distance: 10, avgHeartRate: 145, minHeartRate: 75.5, maxHeartRate: 180 });
    expect([browser.minHeartRate, browser.maxHeartRate]).toEqual([common.minHeartRate, common.maxHeartRate]);
  });

  it('hydrates validated worker activity times and forwards progress through the worker message contract', async () => {
    const runtime = loadImportOperationRuntime();
    class SyntheticWorker {
      static latest = null;
      constructor(url) { this.url = url; this.terminate = jest.fn(); SyntheticWorker.latest = this; }
      postMessage(message) { this.message = message; }
    }
    runtime.Worker = SyntheticWorker;
    const operation = runtime.begin('personal');
    const progress = jest.fn();
    const workerResult = runtime.runAppleWorker({ name: 'synthetic.zip' }, progress, operation);
    const worker = SyntheticWorker.latest;
    expect(worker.url).toBe('./src/apple-health-worker.js');
    expect(worker.message).toEqual({ v: 1, type: 'init', generation: operation.generation });
    worker.onmessage({ data: { v: 1, type: 'ready', generation: operation.generation } });
    expect(worker.message).toMatchObject({ v: 1, type: 'start', generation: operation.generation, file: { name: 'synthetic.zip' } });
    worker.onmessage({ data: { v: 1, type: 'progress', generation: operation.generation, phase: 'readingWorkouts', percent: 45 } });
    worker.onmessage({ data: { v: 1, type: 'complete', generation: operation.generation, result: {
      activities: [{ id: 'ah-worker', sport: 'Run', startTime: Date.parse('2025-03-01T07:00:00Z'),
        sourceLocalStart: { year: 2025, month: 3, day: 1, hour: 8, minute: 0, second: 0, offsetMinutes: 60 } }],
      gpsTracksByActivityId: {}, fitBestEffortsByActivityId: {}, diagnostics: {}
    } } });
    const result = await workerResult;
    expect(worker.terminate).toHaveBeenCalledTimes(1);

    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ percent: 45, stage: 'Reading Apple Health workouts...' }));
    for (const field of ['startTime', 'date', 'monday']) {
      expect(Object.prototype.toString.call(result.activities[0][field])).toBe('[object Date]');
      expect(Number.isFinite(result.activities[0][field].getTime())).toBe(true);
    }
  });

  it('terminates a running Apple worker when a newer import starts', async () => {
    const runtime = loadImportOperationRuntime();
    class SyntheticWorker {
      static latest = null;
      constructor() { this.terminate = jest.fn(); SyntheticWorker.latest = this; }
      postMessage(message) { this.message = message; }
    }
    runtime.Worker = SyntheticWorker;
    const operation = runtime.begin('personal');
    const pending = runtime.runAppleWorker({ name: 'synthetic.zip' }, jest.fn(), operation);
    const worker = SyntheticWorker.latest;

    runtime.begin('sample');

    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(runtime.isCurrent(operation)).toBe(false);
  });

  it('resets the actual sport filter and invalidates the old export preview only on dataset replacement', () => {
    const runtime = loadImportOperationRuntime();
    const nodes = new Map();
    runtime.document = { getElementById: id => {
      if (!nodes.has(id)) nodes.set(id, { textContent: '', classList: {
        add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: () => false
      } });
      return nodes.get(id);
    } };
    runtime.window.heatmapUtils = { buildActivitySummaryIndex: jest.fn(() => new Map()) };
    runtime.window.heartRateDashboard = { reset: jest.fn() };
    runtime.setSportFilter = jest.fn();
    runtime.setBtnActive = jest.fn();
    runtime.closeExportPreviewModal = jest.fn();
    runtime.closePbDetail = jest.fn();
    runtime.refreshCountryCountSummary = jest.fn();
    runtime.hideHeatmapActivityTooltip = jest.fn();
    runtime.closePreviewGateModal = jest.fn();
    runtime.initPaceMetricsControls = jest.fn();
    runtime.renderTimeframeButtons = jest.fn();
    runtime.initScatterDateSlider = jest.fn();
    runtime.initDistributionsDateSlider = jest.fn();
    runtime.initTrainingCalendarControls = jest.fn();
    runtime.refreshHeatmapYearControls = jest.fn();
    runtime.refreshVisualizationTabs = jest.fn();
    runtime.renderDashboard = jest.fn();
    runtime.renderPaceMetricsChart = jest.fn();
    runtime.renderEquipmentChart = jest.fn();
    runtime.renderPbChart = jest.fn();
    runtime.renderTrainingCalendar = jest.fn();

    runtime.commitDataset({ kind: 'tri-activities-v1', rawCsvData: [], activities: [], sourceLabel: 'First import' });
    expect(runtime.closeExportPreviewModal).not.toHaveBeenCalled();
    runtime.commitDataset({ kind: 'tri-activities-v1', rawCsvData: [], activities: [], sourceLabel: 'Replacement import' });

    expect(runtime.setSportFilter).toHaveBeenLastCalledWith('All', false);
    expect(runtime.setBtnActive).not.toHaveBeenCalled();
    expect(runtime.initScatterDateSlider).toHaveBeenCalledTimes(2);
    expect(runtime.initDistributionsDateSlider).toHaveBeenCalledTimes(2);
    expect(runtime.initTrainingCalendarControls).toHaveBeenCalledTimes(2);
    expect(runtime.refreshVisualizationTabs).toHaveBeenCalledTimes(2);
    expect(runtime.closeExportPreviewModal).toHaveBeenCalledTimes(1);
    expect(runtime.window.heartRateDashboard.reset).toHaveBeenCalledTimes(2);
  });

  it('preserves the current export preview when replacement preparation fails before commit', async () => {
    const runtime = loadImportOperationRuntime();
    runtime.closeExportPreviewModal = jest.fn();
    const previousDataset = { sourceLabel: 'Previous source', activities: [{ id: 'previous' }] };
    runtime.applied.push(previousDataset);

    await expect(runtime.runAppleHealth({ name: 'invalid.zip' }, {
      importFile: async () => { throw new Error('Invalid synthetic archive'); }
    })).rejects.toThrow('Invalid synthetic archive');

    expect(runtime.applied).toEqual([previousDataset]);
    expect(runtime.closeExportPreviewModal).not.toHaveBeenCalled();
  });

  it('commits Apple normalized data and counts once without inventing media', async () => {
    const runtime = loadImportOperationRuntime();
    const activities = [{ id: 'ah-synthetic', sport: 'Run', date: new Date('2025-03-01'), distance: 5, duration: 1800 }];
    const result = await runtime.runAppleHealth({ name: 'synthetic.zip' }, {
      importFile: async () => ({ activities, diagnostics: { importedCount: 1 }, gpsTracksByActivityId: {} })
    });
    expect(result).toMatchObject({ kind: 'tri-activities-v1', sourceLabel: 'Apple Health ZIP import', importedFileCount: 1 });
    expect(result.activities).toBe(activities);
    expect(result.mediaLibrary).toBeUndefined();
    expect(runtime.applied).toEqual([result]);
    expect(runtime.recordCompletedAnalysis).toHaveBeenCalledTimes(1);
  });

  it('rejects empty Apple histories before applying or counting', async () => {
    const runtime = loadImportOperationRuntime();
    await expect(runtime.runAppleHealth({ name: 'empty.zip' }, { importFile: async () => ({ activities: [] }) }))
      .rejects.toThrow('No valid running');
    expect(runtime.applied).toEqual([]);
    expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
  });

  it('ignores a superseded Apple result and its progress', async () => {
    const runtime = loadImportOperationRuntime();
    const pending = deferredImport();
    const progress = jest.fn();
    let report;
    const old = runtime.runAppleHealth({ name: 'old.zip' }, {
      importFile: (file, callback) => { report = callback; return pending.promise; }, reportProgress: progress
    });
    runtime.begin('sample');
    report({ percent: 40 });
    pending.resolve({ activities: [{ id: 'old' }] });
    expect(await old).toBeNull();
    expect(progress).not.toHaveBeenCalled();
    expect(runtime.applied).toEqual([]);
  });

  it('discards an old Strava archive and its media after a newer CSV commits', async () => {
    const runtime = loadImportOperationRuntime();
    const archive = deferredImport();
    const release = jest.fn();
    const strava = prepareStravaOperationRuntime(runtime, archive);
    const personal = runtime.runCsv('newer synthetic CSV');
    runtime.Papa.parse.mock.calls[0][1].complete({ data: [['header'], ['row']] });
    await personal;
    archive.resolve({ csvText: 'old synthetic CSV', mediaLibrary: { release } });
    await strava;
    expect(runtime.applied).toHaveLength(1);
    expect(runtime.recordCompletedAnalysis).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(runtime.setTimeout).not.toHaveBeenCalled();
  });

  it.each([true, false])('lets a newer Strava replace a pending sample (sample completes first: %s)', async sampleFirst => {
    const runtime = loadImportOperationRuntime();
    const pending = deferredImport();
    const sample = runtime.runSample({ loadPayload: () => pending.promise, hydrateDataset: () => ({ activities: [] }) });
    const archive = deferredImport();
    const strava = prepareStravaOperationRuntime(runtime, archive);
    if (sampleFirst) { pending.resolve({}); expect(await sample).toBeNull(); }
    archive.resolve({ csvText: 'latest synthetic Strava' });
    await new Promise(resolve => setImmediate(resolve));
    runtime.Papa.parse.mock.calls[0][1].complete({ data: [['header'], ['row']] });
    await strava;
    if (!sampleFirst) { pending.resolve({}); expect(await sample).toBeNull(); }
    expect(runtime.applied).toHaveLength(1);
    expect(runtime.applied[0].sourceLabel).toBe('Strava ZIP import');
    expect(runtime.recordCompletedAnalysis).toHaveBeenCalledTimes(1);
    const hideOldDialog = runtime.setTimeout.mock.calls[0][0];
    runtime.begin('personal');
    hideOldDialog();
    expect(runtime.hideImportProgressModal).not.toHaveBeenCalled();
  });

  it('loads one sample candidate for repeated clicks and never counts a personal analysis', async () => {
    const runtime = loadImportOperationRuntime();
    const pending = deferredImport();
    const loadPayload = jest.fn(() => pending.promise);
    const dataset = { activities: [{ id: 'sample-1', sport: 'Run', distance: 5, duration: 1800 }], sourceType: 'sample' };
    const hydrateDataset = jest.fn(() => dataset);
    const first = runtime.runSample({ loadPayload, hydrateDataset });
    const duplicate = runtime.runSample({ loadPayload, hydrateDataset });
    pending.resolve({ synthetic: true });
    expect(await first).toBe(dataset);
    await duplicate;
    expect(loadPayload).toHaveBeenCalledTimes(1);
    expect(runtime.applied).toEqual([dataset]);
    expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
  });

  it('does not let a delayed sample replace a newer personal CSV', async () => {
    const runtime = loadImportOperationRuntime();
    const pending = deferredImport();
    const sample = runtime.runSample({ loadPayload: () => pending.promise, hydrateDataset: () => ({ activities: [] }) });
    const personal = runtime.runCsv('personal synthetic CSV');
    runtime.Papa.parse.mock.calls[0][1].complete({ data: [['header'], ['row']] });
    await personal;
    pending.resolve({});
    expect(await sample).toBeNull();
    expect(runtime.applied).toHaveLength(1);
    expect(runtime.applied[0].activities[0].id).toBe('csv-test');
  });

  it('keeps the previous history on a sample error and allows retry', async () => {
    const runtime = loadImportOperationRuntime();
    const previous = { activities: [{ id: 'previous' }] };
    runtime.applied.push(previous);
    expect(await runtime.runSample({ loadPayload: async () => { throw new Error('Unavailable sample'); } })).toBeNull();
    expect(runtime.applied).toEqual([previous]);
    const replacement = { activities: [] };
    await runtime.runSample({ loadPayload: async () => ({}), hydrateDataset: () => replacement });
    expect(runtime.applied).toEqual([previous, replacement]);
    expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
  });

  it('supersedes prior operations without reviving them after a later failure', () => {
    const runtime = loadImportOperationRuntime();
    const previous = runtime.begin('sample');
    const latest = runtime.begin('personal');
    latest.failed = true;
    expect(runtime.isCurrent(previous)).toBe(false);
    expect(runtime.isCurrent(latest)).toBe(true);
    expect(latest.generation).toBeGreaterThan(previous.generation);
  });

  it('does not start an operation for an empty TrainingPeaks selection', async () => {
    const runtime = loadImportOperationRuntime();
    const current = runtime.begin('sample');
    await expect(runtime.runTrainingPeaks([])).resolves.toBeNull();
    expect(runtime.isCurrent(current)).toBe(true);
  });

  it.each([true, false])('accepts only the latest TrainingPeaks result (older completes first: %s)', async olderFirst => {
    const runtime = loadImportOperationRuntime();
    const older = deferredImport();
    const newer = deferredImport();
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn();
    const staleRelease = jest.fn();
    const previous = runtime.runTrainingPeaks([{ name: 'older.zip' }], {
      importZips: () => older.promise, applyDataset, recordAnalysis
    });
    const latest = runtime.runTrainingPeaks([{ name: 'newer.zip' }], {
      importZips: () => newer.promise, applyDataset, recordAnalysis
    });
    const oldResult = { activities: [], mediaLibrary: { release: staleRelease } };
    if (olderFirst) {
      older.resolve(oldResult);
      await previous;
      newer.resolve({ activities: [] });
    } else {
      newer.resolve({ activities: [] });
      await latest;
      older.resolve(oldResult);
    }
    expect(await previous).toBeNull();
    await latest;
    expect(applyDataset).toHaveBeenCalledTimes(1);
    expect(recordAnalysis).toHaveBeenCalledTimes(1);
    expect(staleRelease).toHaveBeenCalledTimes(1);
  });

  it('ignores stale progress and does not commit an older result when the latest fails', async () => {
    const runtime = loadImportOperationRuntime();
    const pending = deferredImport();
    let reportOldProgress;
    const reportProgress = jest.fn();
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn();
    const older = runtime.runTrainingPeaks([{ name: 'old.zip' }], {
      importZips: (files, progress) => { reportOldProgress = progress; return pending.promise; },
      reportProgress, applyDataset, recordAnalysis
    });
    await expect(runtime.runTrainingPeaks([{ name: 'invalid.zip' }], {
      importZips: async () => { throw new Error('Invalid archive'); }
    })).rejects.toThrow('Invalid archive');
    reportOldProgress({ percent: 99 });
    pending.resolve({ activities: [] });
    expect(await older).toBeNull();
    expect(reportProgress).not.toHaveBeenCalled();
    expect(applyDataset).not.toHaveBeenCalled();
    expect(recordAnalysis).not.toHaveBeenCalled();
  });

  it('lets a newer standalone CSV supersede an older archive', async () => {
    const runtime = loadImportOperationRuntime();
    const archive = deferredImport();
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn();
    const older = runtime.runTrainingPeaks([{ name: 'old.zip' }], {
      importZips: () => archive.promise, applyDataset, recordAnalysis
    });
    const csv = runtime.runCsv('synthetic CSV');
    runtime.Papa.parse.mock.calls[0][1].complete({ data: [['header'], ['row']] });
    await csv;
    archive.resolve({ activities: [] });
    expect(await older).toBeNull();
    expect(runtime.applied).toHaveLength(1);
    expect(runtime.recordCompletedAnalysis).toHaveBeenCalledTimes(1);
    expect(applyDataset).not.toHaveBeenCalled();
    expect(recordAnalysis).not.toHaveBeenCalled();
  });

  it('drops stale CSV errors and releases an uncommitted media candidate once', async () => {
    const runtime = loadImportOperationRuntime();
    const release = jest.fn();
    const older = runtime.runCsv('old CSV', { mediaLibrary: { release } });
    const oldCallbacks = runtime.Papa.parse.mock.calls[0][1];
    runtime.begin('sample');
    oldCallbacks.error(new Error('Delayed parser failure'));
    expect(await older).toBeNull();
    expect(runtime.updateStatusBadge).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('reuses an inherited CSV operation without incrementing its generation or counting sample work', async () => {
    const runtime = loadImportOperationRuntime();
    const operation = runtime.begin('sample');
    const pending = runtime.runCsv('synthetic CSV', { operation });
    runtime.Papa.parse.mock.calls[0][1].complete({ data: [['header'], ['row']] });
    await pending;
    expect(runtime.isCurrent(operation)).toBe(true);
    expect(operation.committed).toBe(true);
    expect(runtime.recordCompletedAnalysis).not.toHaveBeenCalled();
  });

  it('does not supersede a pending selection when standalone CSV input is empty', async () => {
    const runtime = loadImportOperationRuntime();
    const operation = runtime.begin('personal');
    await expect(runtime.runCsv('  ')).rejects.toThrow('CSV is empty or invalid');
    expect(runtime.isCurrent(operation)).toBe(true);
  });

  it('counts an accepted personal operation once even when post-commit rendering throws', async () => {
    const runtime = loadImportOperationRuntime();
    const recordAnalysis = jest.fn();
    await expect(runtime.runTrainingPeaks([{ name: 'valid.zip' }], {
      importZips: async () => ({ activities: [] }),
      applyDataset: (dataset, options) => {
        options.operation.committed = true;
        throw new Error('Rendering failed');
      },
      recordAnalysis
    })).rejects.toThrow('Rendering failed');
    expect(recordAnalysis).toHaveBeenCalledTimes(1);
  });
});

function loadRuntimeProcessData() {
  const context = {
    parseGermanDate(value) {
      const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})?$/);
      if (!match) return null;
      return new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      );
    },
    getMonday(date) {
      return new Date(date.getTime());
    },
    window: {
      heartRateUtils: require('../src/heart-rate-utils'),
      scatterUtils: {
        parseLocalizedNumber: value => Number(value)
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__processData = processData;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return context.__processData;
}

const processRuntimeData = loadRuntimeProcessData();
const headers = ['Activity Date', 'Activity Type', 'Activity Name', 'Moving Time', 'Distance', 'Distance'];

function loadRuntimeProgress() {
  const nodes = {
    importProgressBar: { style: {} },
    importProgressPercent: { textContent: '' },
    importProgressStage: { textContent: '' },
    importProgressDetail: { textContent: '', parentElement: { classList: { toggle() {} } } },
    importProgressError: { classList: { add() {}, remove() {} } },
    importProgressPreview: { classList: { add() {}, remove() {} } },
    importProgressMessage: { textContent: '' },
    importExperienceIllustration: {
      src: '', alt: '', style: {},
      setAttribute() {},
      removeAttribute(attribute) { if (attribute === 'src') this.src = ''; }
    },
    importProgressModal: {
      classList: { add() {}, remove() {} },
      querySelector() { return null; }
    }
  };
  const activeIntervals = new Set();
  const removedListeners = [];
  let nextInterval = 1;
  const context = {
    document: {
      hidden: false,
      getElementById: id => nodes[id] || null,
      addEventListener() {},
      removeEventListener: (event, handler) => removedListeners.push({ event, handler })
    },
    window: { importExperienceCatalog },
    setInterval: () => { const id = nextInterval++; activeIntervals.add(id); return id; },
    clearInterval: id => activeIntervals.delete(id),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {}
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__updateProgress = updateImportProgress; this.__renderMessage = renderImportExperienceMessage; this.__showModal = showImportProgressModal; this.__hideModal = hideImportProgressModal; this.__activeSession = () => importExperienceSession;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return { updateProgress: context.__updateProgress, renderMessage: context.__renderMessage, showModal: context.__showModal, hideModal: context.__hideModal, activeSession: context.__activeSession, nodes, activeIntervals, removedListeners };
}

function activityRow(name, duration, km, meters) {
  return ['19.07.2026, 14:52:02', 'Run', name, duration, km, meters];
}

describe('runtime dashboard-import metric availability', () => {
  it('marks positive and zero source values available without changing existing numeric fields', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Positive values', '3600', '10', '10000'),
      activityRow('Recorded zeroes', '0', '0', '0')
    ]);
    expect(result.map(activity => activity.distance)).toEqual([10, 0]);
    expect(result.map(activity => activity.duration)).toEqual([3600, 0]);
    expect(result.map(activity => activity.distanceAvailable)).toEqual([true, true]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([true, true]);
  });

  it('marks missing, invalid, and negative source values unavailable', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Missing', '', '10', ''),
      activityRow('Invalid', 'not-a-number', '10', 'not-a-number'),
      activityRow('Negative', '-60', '10', '-1000')
    ]);

    expect(result.map(activity => activity.distanceAvailable)).toEqual([false, false, false]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([false, false, false]);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
    expect(result[2].distance).toBe(-1);
    expect(result[2].duration).toBe(-60);
  });

  it('marks a metric unavailable when its source column is absent', () => {
    const result = processRuntimeData([
      ['Activity Date', 'Activity Type', 'Activity Name'],
      ['19.07.2026, 14:52:02', 'Run', 'No optional metrics']
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].distanceAvailable).toBe(false);
    expect(result[0].durationAvailable).toBe(false);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
  });
});

function loadRuntimeDatasetApplicator() {
  const nodes = Object.fromEntries([
    'previewCardsContainer', 'enterDashboardContainer', 'emptyStateMessage', 'sampleDataStatus', 'heartRateImportNote'
  ].map(id => [id, { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } }]));
  const context = {
    importedDataset: null,
    rawCsvData: [],
    processedActivities: [],
    fitBestEffortsByActivityId: {},
    gpsTracksByActivityId: {},
    countryCountSummary: null,
    countryCountRequestToken: 0,
    countryCountReady: Promise.resolve(null),
    window: {
      countryCountUtils,
      heatmapUtils: { buildActivitySummaryIndex: () => new Map() },
      mediaGalleryDashboard: { clear: jest.fn() }
    },
    document: { getElementById: id => nodes[id] || null },
    updateStatusBadge: jest.fn(),
    hideHeatmapActivityTooltip: jest.fn(),
    closePreviewGateModal: jest.fn(),
    setSportFilter: jest.fn(),
    setBtnActive: jest.fn(),
    initPaceMetricsControls: jest.fn(),
    renderTimeframeButtons: jest.fn(),
    initScatterDateSlider: jest.fn(),
    initDistributionsDateSlider: jest.fn(),
    initTrainingCalendarControls: jest.fn(),
    refreshVisualizationTabs: jest.fn(),
    renderDashboard: jest.fn(),
    renderPaceMetricsChart: jest.fn(),
    renderEquipmentChart: jest.fn(),
    renderPbChart: jest.fn(),
    renderTrainingCalendar: jest.fn()
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__applyDataset = applyImportedDataset; this.__getDataset = () => importedDataset;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return { applyDataset: context.__applyDataset, context, refreshVisualizationTabs: context.refreshVisualizationTabs };
}

function loadRuntimeTrainingPeaksImportStatus(importResult) {
  let input;
  const nodes = {
    importProgressBar: { style: {} },
    importProgressPercent: { textContent: '' },
    importProgressStage: { textContent: '' },
    importProgressError: { classList: { add() {}, remove() {} } },
    importProgressDetail: { textContent: '', parentElement: { classList: { toggle() {} } } }
  };
  const context = {
    importResult,
    document: {
      createElement: () => (input = { click() {} }),
      getElementById: id => nodes[id] || null
    },
    updateStatusBadge: jest.fn(),
    showImportProgressModal: jest.fn(),
    setImportModalVisualState: jest.fn(),
    updateImportProgress: jest.fn(),
    setTimeout: jest.fn(),
    console: { error: jest.fn() }
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nexecuteTrainingPeaksZipImport = async () => importResult; this.__handleTrainingPeaksIngest = handleTrainingPeaksIngest;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return { handleImport: context.__handleTrainingPeaksIngest, getInput: () => input, context };
}

describe('runtime import success status copy', () => {
  it('clears landing sample identification when personal data replaces it', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const status = runtime.context.document.getElementById('sampleDataStatus');
    status.textContent = 'Synthetic sample training data';
    runtime.applyDataset({ rawCsvData: [], activities: [], sourceLabel: 'Strava ZIP import' });
    expect(status.textContent).toBe('');
  });

  it('uses source-only success labels for both import sources', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const trainingPeaksDataset = {
      rawCsvData: [],
      activities: [{ id: 'tp-1' }, { id: 'tp-2' }],
      fitBestEffortsByActivityId: {},
      gpsTracksByActivityId: {},
      sourceLabel: 'TrainingPeaks ZIP import',
      importedFileCount: 2,
      skippedUnsupportedSportCount: 1,
      skippedGpxRouteCount: 3
    };

    runtime.applyDataset(trainingPeaksDataset);

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported TrainingPeaks history');

    const stravaDataset = { ...trainingPeaksDataset, sourceLabel: 'Imported Strava history' };
    delete stravaDataset.importedFileCount;
    runtime.applyDataset(stravaDataset);

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported Strava history');

    runtime.applyDataset({ ...stravaDataset, activities: [] });

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported Strava history');
  });

  it('uses concise TrainingPeaks status after import completion with skipped items', async () => {
    const runtime = loadRuntimeTrainingPeaksImportStatus({
      activities: [{ id: 'tp-1' }, { id: 'tp-2' }],
      importedFileCount: 2,
      skippedUnsupportedSportCount: 1,
      skippedInvalidSessionCount: 1,
      skippedGpxRouteCount: 3
    });

    runtime.handleImport();
    await runtime.getInput().onchange({ target: { files: [{ name: 'period-a.zip' }, { name: 'period-b.zip' }] } });

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported TrainingPeaks history');
  });
});

describe('runtime imported dataset availability refresh', () => {
  it('leaves active references and media intact when index preparation fails', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const release = jest.fn();
    const previous = { rawCsvData: [], activities: [{ id: 'old' }], mediaLibrary: { release } };
    runtime.applyDataset(previous);
    runtime.context.window.heatmapUtils.buildActivitySummaryIndex = () => { throw new Error('Invalid candidate'); };
    expect(() => runtime.applyDataset({ rawCsvData: [], activities: [{ id: 'next' }] })).toThrow('Invalid candidate');
    expect(runtime.context.importedDataset).toBe(previous);
    expect(runtime.context.processedActivities).toBe(previous.activities);
    expect(release).not.toHaveBeenCalled();
  });

  it('closes the old PB detail on an accepted dataset change', () => {
    const runtime = loadRuntimeDatasetApplicator();
    runtime.context.closePbDetail = jest.fn();
    runtime.applyDataset({ rawCsvData: [], activities: [] });
    expect(runtime.context.closePbDetail).toHaveBeenCalledTimes(1);
  });

  it('clears the pinned detail before releasing live media and replacing the dataset', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const events = [];
    let pinned = null;
    runtime.context.window.dashboardTooltips = { invalidate: jest.fn(() => { pinned = null; events.push('clear'); }) };
    const first = { rawCsvData: [], activities: [], mediaLibrary: { release: jest.fn(() => {
      expect(pinned).toBeNull();
      expect(runtime.context.importedDataset).toBe(replacement);
      events.push('release');
    }) } };
    const replacement = { rawCsvData: [], activities: [] };
    runtime.applyDataset(first);
    pinned = { title: 'Old activity' };
    events.length = 0;
    runtime.applyDataset(replacement);
    expect(events).toEqual(['clear', 'release']);
    expect(runtime.context.importedDataset).toBe(replacement);
    expect(pinned).toBeNull();
    expect(first.mediaLibrary.release).toHaveBeenCalledTimes(1);
  });

  it('refreshes view visibility without modifying imported activity records', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const firstActivities = [{
      id: 'run-1', sport: 'Run', date: new Date('2026-07-19T14:52:02Z'),
      distance: 10, duration: 3600, equipment: 'Road shoe'
    }];
    const secondActivities = [{
      id: 'run-2', sport: 'Run', date: new Date('2026-07-20T14:52:02Z'),
      distance: 8, duration: 3000, equipment: ''
    }];
    const originalFirstActivities = structuredClone(firstActivities);
    const originalSecondActivities = structuredClone(secondActivities);
    const firstDataset = {
      rawCsvData: [],
      activities: firstActivities,
      fitBestEffortsByActivityId: {},
      gpsTracksByActivityId: {},
      sourceLabel: 'Imported Strava history'
    };
    const secondDataset = {
      ...firstDataset,
      activities: secondActivities,
      sourceLabel: 'TrainingPeaks ZIP import'
    };

    runtime.applyDataset(firstDataset);
    runtime.applyDataset(secondDataset);

    expect(runtime.refreshVisualizationTabs).toHaveBeenCalledTimes(2);
    expect(runtime.context.processedActivities).toEqual(originalSecondActivities);
    expect(firstDataset.activities).toEqual(originalFirstActivities);
    expect(secondDataset.activities).toEqual(originalSecondActivities);
  });

  it('releases the prior Strava media library when replacing the imported dataset', () => {
    const runtime = loadRuntimeDatasetApplicator();
    const release = jest.fn();
    const firstDataset = {
      rawCsvData: [], activities: [], fitBestEffortsByActivityId: {}, gpsTracksByActivityId: {},
      sourceLabel: 'Strava ZIP import', mediaLibrary: { hasReadableMedia: true, release }
    };
    const nextDataset = {
      rawCsvData: [], activities: [], fitBestEffortsByActivityId: {}, gpsTracksByActivityId: {},
      sourceLabel: 'TrainingPeaks ZIP import'
    };

    runtime.applyDataset(firstDataset);
    runtime.applyDataset(nextDataset);

    expect(release).toHaveBeenCalledTimes(1);
    expect(runtime.context.window.mediaGalleryDashboard.clear).toHaveBeenCalledTimes(1);
    expect(runtime.context.__getDataset()).toBe(nextDataset);
    expect(nextDataset.mediaLibrary).toBeUndefined();
  });

  it('keeps media reconciliation details out of the successful import status', () => {
    const runtime = loadRuntimeDatasetApplicator();
    runtime.applyDataset({
      rawCsvData: [], activities: [], fitBestEffortsByActivityId: {}, gpsTracksByActivityId: {},
      sourceLabel: 'Strava ZIP import',
      mediaLibrary: {
        hasReadableMedia: false,
        counts: { readable: 0, matchedReferences: 0, missingReferences: 2, ambiguousReferences: 1, corrupt: 1, unsupported: 3 }
      }
    });

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported Strava history');
  });
});

describe('runtime dashboard-import progress updates', () => {
  it('retains the last reported percentage when only the factual stage changes', () => {
    const runtime = loadRuntimeProgress();
    runtime.updateProgress(95, 'Extracting GPS tracks...');
    runtime.updateProgress(null, 'Processing data...');

    expect(runtime.nodes.importProgressBar.style.width).toBe('95%');
    expect(runtime.nodes.importProgressPercent.textContent).toBe('95%');
    expect(runtime.nodes.importProgressStage.textContent).toBe('Processing data...');
    expect(runtime.nodes.importProgressDetail.textContent).toBe('');
  });

  it('rounds Apple Health progress labels without changing the precise progress value', () => {
    const runtime = loadRuntimeProgress();
    [[0, '0%'], [42.375, '42%'], [42.5, '43%'], [100, '100%']].forEach(([percent, label]) => {
      runtime.updateProgress(percent, 'Reading Apple Health export...', false, true);
      expect(runtime.nodes.importProgressPercent.textContent).toBe(label);
      expect(runtime.nodes.importProgressBar.style.width).toBe(`${percent}%`);
    });

    runtime.updateProgress(null, 'Preparing visualizations...');
    expect(runtime.nodes.importProgressPercent.textContent).toBe('100%');
  });

  it('enables whole-percent label formatting for Apple Health progress updates', () => {
    expect(dashboardImportSource.includes(
      'reportProgress: progress => updateImportProgress(progress.percent, progress.stage, false, true)'
    )).toBe(true);
  });

  it('preserves fractional percentage labels for non-Apple Health imports', () => {
    const runtime = loadRuntimeProgress();
    runtime.updateProgress(42.375, 'Extracting GPS tracks...');

    expect(runtime.nodes.importProgressPercent.textContent).toBe('42.375%');
    expect(runtime.nodes.importProgressBar.style.width).toBe('42.375%');
  });

  it('excludes percentage-only eligibility and keeps the final message phase-gated', () => {
    const session = importExperienceCatalog.createSession({ phase: 'processing', random: () => 0 });
    expect(session.orderedMessageIds).not.toContain('message-20');
    importExperienceCatalog.setPhase(session, 'finalizing');
    expect(session.orderedMessageIds).toContain('message-20');
    expect(dashboardImportSource).toContain("setPhase(importExperienceSession, 'finalizing')");
    expect(dashboardImportSource).not.toContain('updateImportProgress(5,');
    expect(dashboardImportSource).not.toContain('updateImportProgress(70,');
  });

  it('cleans up the previous timer and session on error, modal close, and restart', () => {
    const runtime = loadRuntimeProgress();
    runtime.showModal();
    const firstSession = runtime.activeSession();
    expect(runtime.activeIntervals.size).toBe(1);

    runtime.updateProgress(null, 'Import failed', true);
    expect(runtime.activeIntervals.size).toBe(0);
    expect(firstSession.active).toBe(false);

    runtime.showModal();
    const secondSession = runtime.activeSession();
    expect(secondSession).not.toBe(firstSession);
    expect(runtime.activeIntervals.size).toBe(1);

    runtime.hideModal();
    expect(runtime.activeIntervals.size).toBe(0);
    expect(secondSession.active).toBe(false);
    expect(runtime.removedListeners.map(item => item.event)).toEqual(['visibilitychange', 'visibilitychange']);
  });
});

describe('runtime import illustration presentation', () => {
  it('pairs the current message with its PNG and same-message SVG fallback without changing status', () => {
    const runtime = loadRuntimeProgress();
    runtime.updateProgress(35, 'Processing data...');
    const first = {
      text: 'First message',
      illustrationPath: './assets/import-illustrations/01.png'
    };
    const second = {
      text: 'Second message',
      illustrationPath: './assets/import-illustrations/02.png'
    };

    runtime.renderMessage(first);
    const staleErrorHandler = runtime.nodes.importExperienceIllustration.onerror;
    runtime.renderMessage(second);
    staleErrorHandler();
    expect(runtime.nodes.importProgressMessage.textContent).toBe('Second message');
    expect(runtime.nodes.importExperienceIllustration.src).toBe(second.illustrationPath);

    const activeErrorHandler = runtime.nodes.importExperienceIllustration.onerror;
    activeErrorHandler();
    activeErrorHandler();
    expect(runtime.nodes.importExperienceIllustration.src).toBe('');
    expect(runtime.nodes.importExperienceIllustration.src).not.toMatch(/\.svg$/i);
    expect(runtime.nodes.importProgressStage.textContent).toBe('Processing data...');
    expect(runtime.nodes.importProgressBar.style.width).toBe('35%');
  });
});

function loadTrainingPeaksImportRunner() {
  const importExperienceCatalog = {
    createStatisticsAccumulator: () => ({ count: 0 }),
    accumulateActivityStatistics: accumulator => { accumulator.count += 1; },
    finalizeStatistics: accumulator => ({ activityCount: accumulator.count })
  };
  const context = { window: { importExperienceCatalog } };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__runTrainingPeaksImport = executeTrainingPeaksZipImport;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return context.__runTrainingPeaksImport;
}

describe('runtime TrainingPeaks import orchestration', () => {
  const activities = [
    { id: 'tp-1', date: new Date('2026-05-01T00:00:00Z'), sport: 'Run', distance: 10, distanceAvailable: true, duration: 3600, durationAvailable: true },
    { id: 'tp-2', date: new Date('2026-05-02T00:00:00Z'), sport: 'Bike', distance: 20, distanceAvailable: true, duration: 3600, durationAvailable: true }
  ];

  it('applies one normalized dataset and records the analysis only after a multi-file import succeeds', async () => {
    const runImport = loadTrainingPeaksImportRunner();
    const files = [{ name: 'period-a.zip' }, { name: 'period-b.zip' }];
    const importZips = jest.fn().mockResolvedValue({
      activities,
      skippedUnsupportedSportCount: 1,
      gpsTracksByActivityId: { 'tp-1': { sport: 'Run', points: [[48, 11]] } },
      fitBestEffortsByActivityId: { 'tp-2': { powerEfforts: [{ targetSeconds: 5, watts: 300 }] } },
      skippedUnsupportedSportCount: 1,
      skippedGpxRouteCount: 2
    });
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn().mockResolvedValue(undefined);

    const dataset = await runImport(files, { importZips, applyDataset, recordAnalysis });

    expect(importZips).toHaveBeenCalledTimes(1);
    expect(importZips).toHaveBeenCalledWith(files, expect.any(Function));
    expect(dataset).toEqual(expect.objectContaining({
      kind: 'tri-activities-v1',
      sourceLabel: 'TrainingPeaks ZIP import',
      importedFileCount: 2,
      importedSourceFiles: ['period-a.zip', 'period-b.zip'],
      activities,
      skippedUnsupportedSportCount: 1,
      skippedGpxRouteCount: 2,
      importExperienceStatistics: { activityCount: 2 }
    }));
    expect(dataset.gpsTracksByActivityId).toHaveProperty('tp-1');
    expect(dataset.fitBestEffortsByActivityId).toHaveProperty('tp-2');
    expect(applyDataset).toHaveBeenCalledTimes(1);
    expect(applyDataset).toHaveBeenCalledWith(dataset, expect.objectContaining({
      openDashboard: true,
      operation: expect.objectContaining({ sourceType: 'personal', committed: true, counted: true })
    }));
    expect(recordAnalysis).toHaveBeenCalledTimes(1);
  });

  it('does not import or count a cancelled empty file selection', async () => {
    const runImport = loadTrainingPeaksImportRunner();
    const importZips = jest.fn();
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn();

    await expect(runImport([], { importZips, applyDataset, recordAnalysis })).resolves.toBeNull();

    expect(importZips).not.toHaveBeenCalled();
    expect(applyDataset).not.toHaveBeenCalled();
    expect(recordAnalysis).not.toHaveBeenCalled();
  });

  it('leaves the current dataset and counter untouched when archive import fails', async () => {
    const runImport = loadTrainingPeaksImportRunner();
    const importZips = jest.fn().mockRejectedValue(new Error('bad.zip: corrupt FIT entry'));
    const applyDataset = jest.fn();
    const recordAnalysis = jest.fn();

    await expect(runImport([{ name: 'good.zip' }, { name: 'bad.zip' }], {
      importZips, applyDataset, recordAnalysis
    })).rejects.toThrow('bad.zip: corrupt FIT entry');

    expect(applyDataset).not.toHaveBeenCalled();
    expect(recordAnalysis).not.toHaveBeenCalled();
  });
});
