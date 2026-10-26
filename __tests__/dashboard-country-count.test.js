const fs = require('fs');
const path = require('path');
const vm = require('vm');
const countryCountUtils = require('../src/country-count-utils');

const dashboardCoreSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-core.js'),
  'utf8'
);
const dashboardImportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-import.js'),
  'utf8'
);

function createCountryFeature(countryId, minLongitude, minLatitude, maxLongitude, maxLatitude) {
  return {
    type: 'Feature',
    properties: { ADM0_A3: countryId, NAME: countryId },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLongitude, minLatitude],
        [maxLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [minLongitude, maxLatitude],
        [minLongitude, minLatitude]
      ]]
    }
  };
}

function pointIsInCountry(point, feature) {
  const [longitude, latitude] = point;
  const coordinates = feature.geometry.coordinates[0];
  const longitudes = coordinates.map(coordinate => coordinate[0]);
  const latitudes = coordinates.map(coordinate => coordinate[1]);
  return longitude >= Math.min(...longitudes)
    && longitude <= Math.max(...longitudes)
    && latitude >= Math.min(...latitudes)
    && latitude <= Math.max(...latitudes);
}

function loadDashboardRuntime() {
  const nodes = Object.fromEntries([
    'previewCardsContainer', 'enterDashboardContainer', 'emptyStateMessage', 'statusText'
  ].map(id => [id, { textContent: '', classList: { add() {}, remove() {} } }]));
  nodes.statusBadge = {
    className: '',
    classList: { add() {}, remove() {} },
    querySelector: () => ({ className: '' })
  };
  const countryFeatures = [
    createCountryFeature('AAA', 0, 0, 2, 2),
    createCountryFeature('BBB', 4, 0, 6, 2)
  ];
  const geometryOperations = {
    booleanPointInPolygon: pointIsInCountry,
    booleanIntersects: (line, feature) => line.coordinates.some(point => pointIsInCountry(point, feature))
  };
  const lifetimeStatisticsRender = jest.fn();
  const context = {
    document: { getElementById: id => nodes[id] || null },
    window: {
      countryCountUtils,
      countryCountCountryFeatures: countryFeatures,
      countryCountGeometryOperations: geometryOperations,
      lifetimeStatisticsDashboard: { render: lifetimeStatisticsRender },
      heatmapUtils: { buildActivitySummaryIndex: () => new Map() }
    },
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
    renderPaceMetricsChart: jest.fn(),
    renderEquipmentChart: jest.fn(),
    renderPbChart: jest.fn(),
    renderTrainingCalendar: jest.fn(),
    fetch: jest.fn(async () => ({ ok: true, json: async () => ({ features: countryFeatures }) }))
  };
  vm.createContext(context);
  vm.runInContext(`
    let rawCsvData = [];
    let processedActivities = [];
    let fitBestEffortsByActivityId = {};
    let gpsTracksByActivityId = {};
    let importedDataset = null;
    let countryCountSummary = null;
    let countryCountRequestToken = 0;
    let countryCountReady = Promise.resolve(null);
    let selectedSportFilter = 'All';
    let selectedAggregationLevel = 'weekly';
    let selectedTimeframeByAggregation = { weekly: 'all' };
    ${dashboardCoreSource}
    renderDashboard = function() {
      if (typeof renderCountryCountMetric === 'function') renderCountryCountMetric();
    };
    ${dashboardImportSource}
    this.__applyImportedDataset = applyImportedDataset;
    this.__getCountryCountSummary = () => countryCountSummary;
    this.__renderDashboard = renderDashboard;
    this.__setFilters = (sport, timeframe) => {
      selectedSportFilter = sport;
      selectedTimeframeByAggregation.weekly = timeframe;
    };
  `, context, { filename: 'dashboard-country-count-runtime.js' });

  return { context, nodes, lifetimeStatisticsRender };
}

function createDataset(activities, gpsTracksByActivityId, sourceLabel = 'Strava ZIP import') {
  return {
    rawCsvData: [],
    activities,
    gpsTracksByActivityId,
    fitBestEffortsByActivityId: {},
    sourceLabel
  };
}

function createCountryCountResourcesLoader(runtime) {
  return async () => ({
    countryFeatures: runtime.context.window.countryCountCountryFeatures,
    geometryOperations: runtime.context.window.countryCountGeometryOperations
  });
}

describe('Lifetime Statistics country-count integration', () => {
  it('refreshes the lifetime view with an all-sport, all-time summary after dataset replacement', async () => {
    const runtime = loadDashboardRuntime();
    const initialDataset = createDataset([
      { id: 'run-old', sport: 'Run', date: new Date('2022-06-01T00:00:00Z') },
      { id: 'bike-mid', sport: 'Bike', date: new Date('2024-06-01T00:00:00Z') },
      { id: 'swim-new', sport: 'Swim', date: new Date('2026-06-01T00:00:00Z') }
    ], {
      'run-old': { sport: 'Run', points: [[1, 1]] },
      'bike-mid': { sport: 'Bike', points: [[1, 5]] },
      'swim-new': { sport: 'Swim', points: [[1.5, 1.5]] }
    });

    await runtime.context.__applyImportedDataset(initialDataset, {
      countryCountResourcesLoader: createCountryCountResourcesLoader(runtime)
    });

    expect(runtime.context.__getCountryCountSummary().countryCount).toBe(2);
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();
    expect(runtime.nodes.countryCountValue).toBeUndefined();

    runtime.context.__setFilters('Run', '3m');
    runtime.context.__renderDashboard();
    expect(runtime.context.__getCountryCountSummary().countryCount).toBe(2);

    const replacementDataset = createDataset([
      { id: 'replacement-run', sport: 'Run', date: new Date('2026-09-01T00:00:00Z') }
    ], {
      'replacement-run': { sport: 'Run', points: [[1, 1]] }
    });
    await runtime.context.__applyImportedDataset(replacementDataset, {
      countryCountResourcesLoader: createCountryCountResourcesLoader(runtime)
    });

    expect(runtime.context.__getCountryCountSummary().countryCount).toBe(1);
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();
  });

  it('distinguishes complete, partial, and unavailable route coverage', async () => {
    const runtime = loadDashboardRuntime();
    const resourceLoader = createCountryCountResourcesLoader(runtime);

    const completeDataset = createDataset([
      { id: 'complete-run', sport: 'Run' },
      { id: 'complete-bike', sport: 'Bike' }
    ], {
      'complete-run': { sport: 'Run', points: [[1, 1]] },
      'complete-bike': { sport: 'Bike', points: [[1, 5]] }
    });
    const completeSummary = await runtime.context.__applyImportedDataset(completeDataset, {
      countryCountResourcesLoader: resourceLoader
    });
    expect(completeSummary).toMatchObject({
      status: 'complete', countryCount: 2, trackedActivityCount: 2, totalActivityCount: 2
    });
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();

    const partialDataset = createDataset([
      { id: 'tracked-run', sport: 'Run' },
      { id: 'untracked-run', sport: 'Run' }
    ], {
      'tracked-run': { sport: 'Run', points: [[1, 1]] }
    });
    const partialSummary = await runtime.context.__applyImportedDataset(partialDataset, {
      countryCountResourcesLoader: resourceLoader
    });
    expect(partialSummary).toMatchObject({
      status: 'partial', countryCount: 1, trackedActivityCount: 1, totalActivityCount: 2
    });
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();

    const unavailableDataset = createDataset([
      { id: 'no-route', sport: 'Swim' }
    ], {});
    const unavailableSummary = await runtime.context.__applyImportedDataset(unavailableDataset, {
      countryCountResourcesLoader: jest.fn(resourceLoader)
    });
    expect(unavailableSummary).toMatchObject({
      status: 'unavailable', countryCount: null, trackedActivityCount: 0, totalActivityCount: 1
    });
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();

    const failedBoundaryDataset = createDataset([
      { id: 'boundary-error-route', sport: 'Run' }
    ], {
      'boundary-error-route': { sport: 'Run', points: [[1, 1]] }
    });
    const failedBoundarySummary = await runtime.context.__applyImportedDataset(failedBoundaryDataset, {
      countryCountResourcesLoader: async () => { throw new Error('Boundary data unavailable'); }
    });
    expect(failedBoundarySummary).toMatchObject({ status: 'unavailable', countryCount: null });
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();
  });

  it('does not let a late result from a replaced dataset overwrite the current summary', async () => {
    const runtime = loadDashboardRuntime();
    let resolveStaleResources;
    const staleResult = runtime.context.__applyImportedDataset(createDataset([
      { id: 'stale-bike', sport: 'Bike' }
    ], {
      'stale-bike': { sport: 'Bike', points: [[1, 5]] }
    }), {
      countryCountResourcesLoader: () => new Promise(resolve => { resolveStaleResources = resolve; })
    });

    const currentResult = runtime.context.__applyImportedDataset(createDataset([
      { id: 'current-run', sport: 'Run' }
    ], {
      'current-run': { sport: 'Run', points: [[1, 1]] }
    }), {
      countryCountResourcesLoader: createCountryCountResourcesLoader(runtime)
    });
    await currentResult;
    resolveStaleResources({
      countryFeatures: [createCountryFeature('BBB', 4, 0, 6, 2)],
      geometryOperations: runtime.context.window.countryCountGeometryOperations
    });
    await staleResult;

    expect(runtime.context.__getCountryCountSummary().countryIds).toEqual(new Set(['AAA']));
    expect(runtime.lifetimeStatisticsRender).toHaveBeenCalled();
  });
});