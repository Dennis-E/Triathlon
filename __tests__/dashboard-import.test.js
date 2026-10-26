const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dashboardImportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-import.js'),
  'utf8'
);
const importExperienceCatalog = require('../src/import-experience-catalog');
const countryCountUtils = require('../src/country-count-utils');

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
    'previewCardsContainer', 'enterDashboardContainer', 'emptyStateMessage'
  ].map(id => [id, { classList: { add() {}, remove() {} } }]));
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
  it('uses concise TrainingPeaks status during dataset application and preserves Strava wording', () => {
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

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', 'Imported Strava history: 2 activities');
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

  it('summarizes media reconciliation when no readable media tab will be shown', () => {
    const runtime = loadRuntimeDatasetApplicator();
    runtime.applyDataset({
      rawCsvData: [], activities: [], fitBestEffortsByActivityId: {}, gpsTracksByActivityId: {},
      sourceLabel: 'Strava ZIP import',
      mediaLibrary: {
        hasReadableMedia: false,
        counts: { readable: 0, matchedReferences: 0, missingReferences: 2, ambiguousReferences: 1, corrupt: 1, unsupported: 3 }
      }
    });

    expect(runtime.context.updateStatusBadge).toHaveBeenLastCalledWith('success', expect.stringContaining('no readable media found'));
    expect(runtime.context.updateStatusBadge.mock.calls.at(-1)[1]).toContain('2 unmatched');
    expect(runtime.context.updateStatusBadge.mock.calls.at(-1)[1]).toContain('1 ambiguous');
    expect(runtime.context.updateStatusBadge.mock.calls.at(-1)[1]).toContain('1 corrupt');
    expect(runtime.context.updateStatusBadge.mock.calls.at(-1)[1]).toContain('3 unsupported');
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
    expect(applyDataset).toHaveBeenCalledWith(dataset, { openDashboard: true });
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
