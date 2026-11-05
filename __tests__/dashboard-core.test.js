const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDashboardCore() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-core.js'), 'utf8'), sandbox);
  return sandbox;
}

function loadDashboardForRendering(activities) {
  const dashboard = {};
  vm.createContext(dashboard);
  dashboard.Date = Date;
  dashboard.window = { dashboardTabNavigation: require('../src/tab-navigation'), innerWidth: 1024,
    dashboardTooltips: { attachChart: jest.fn(), invalidate: jest.fn() } };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-core.js'), 'utf8'), dashboard);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8'), dashboard);

  const elementIds = [
    'distanceChartTitle', 'cardTotalKm', 'cardAvgLabel', 'cardAvgKm', 'cardAvgUnit',
    'cardPeakLabel', 'cardPeakKm', 'cardPeakPeriod',
    'splitBarRun', 'splitBarBike', 'splitBarSwim', 'splitPctRun', 'splitPctBike', 'splitPctSwim'
  ];
  const elements = new Map(elementIds.map(id => [id, { textContent: '', style: {} }]));
  elements.get('distanceChartTitle').textContent = 'Distance';
  elements.get('cardAvgLabel').textContent = 'Weekly Average';
  elements.get('cardAvgUnit').textContent = 'km/wk';
  elements.get('cardPeakLabel').textContent = 'Peak Week';
  elements.set('trainingChart', { getContext: () => ({}) });

  dashboard.document = {
    getElementById: id => elements.get(id),
    querySelectorAll: () => []
  };
  dashboard.Chart = class {
    constructor(context, config) {
      this.context = context;
      this.config = config;
    }

    destroy() {}
  };

  dashboard.__activities = activities.map(activity => ({
    ...activity,
    monday: dashboard.getMonday(activity.date)
  }));
  vm.runInContext(`
    processedActivities = __activities;
    selectedTimeframeByAggregation = { daily: 'all', weekly: 'all', monthly: 'all', yearly: 'all' };
  `, dashboard);

  return {
    dashboard,
    elements,
    render(aggregation, sport = 'All', timeframe = 'all') {
      dashboard.__aggregation = aggregation;
      dashboard.__sport = sport;
      dashboard.__timeframe = timeframe;
      vm.runInContext(`
        selectedAggregationLevel = __aggregation;
        selectedSportFilter = __sport;
        selectedTimeframeByAggregation[__aggregation] = __timeframe;
      `, dashboard);
      dashboard.renderDashboard();
    }
  };
}

test('distance social export uses numeric selected chart data rather than formatted dashboard text', () => {
  const activities = Array.from({ length: 13 }, (_, index) => ({ date: new Date(2013 + index, 0, 4), sport: 'Run', distance: 1.25 }));
  const runtime = loadDashboardForRendering(activities);
  runtime.render('yearly');
  runtime.elements.get('cardTotalKm').textContent = 'not a numeric source';
  const model = runtime.dashboard.window.totalDistanceDashboard.getExportData();
  expect(model).toMatchObject({ sport: 'All', metric: 'Distance', unit: 'km', centralValue: 16.25,
    periodStart: expect.any(Number), periodEnd: expect.any(Number) });
  expect(model.periodLabels).toHaveLength(13);
  expect(model.periodLabels[0]).toBe('2013');
  expect(model.periodLabels.at(-1)).toBe('2025');
});

const aggregationFixtures = [
  { date: new Date('2024-01-01T12:00:00'), sport: 'Run', distance: 10 },
  { date: new Date('2024-01-02T12:00:00'), sport: 'Bike', distance: 10 },
  { date: new Date('2024-02-01T12:00:00'), sport: 'Swim', distance: 15 },
  { date: new Date('2024-11-01T12:00:00'), sport: 'Bike', distance: 30 },
  { date: new Date('2024-12-01T12:00:00'), sport: 'Run', distance: 25 },
  { date: new Date('2025-02-01T12:00:00'), sport: 'Bike', distance: 30 },
  { date: new Date('2025-02-17T12:00:00'), sport: 'Run', distance: 20 },
  { date: new Date('2026-03-10T12:00:00'), sport: 'Swim', distance: 15 },
  { date: new Date('2026-03-11T12:00:00'), sport: 'Run', distance: 15 },
  { date: new Date('2026-03-12T12:00:00'), sport: 'Bike', distance: 15 },
  { date: new Date('2026-03-25T12:00:00'), sport: 'Run', distance: 12 }
];

describe('shared dashboard activity selection', () => {
  test('refreshes active heart-rate views and invalidates hidden models through the original filter setters', () => {
    const { dashboard } = loadDashboardForRendering(aggregationFixtures);
    const heartRateDashboard = { invalidate: jest.fn(), render: jest.fn() };
    dashboard.window.heartRateDashboard = heartRateDashboard;
    vm.runInContext("selectedVisualizationTab = 'heartRate'", dashboard);
    dashboard.setSportFilter('Bike');
    expect(heartRateDashboard.invalidate).toHaveBeenCalled();
    expect(heartRateDashboard.render).toHaveBeenCalledTimes(1);
    dashboard.setTimeframeFilter('all');
    expect(heartRateDashboard.render).toHaveBeenCalledTimes(2);
    dashboard.setAggregationLevel('daily');
    expect(heartRateDashboard.render).toHaveBeenCalledTimes(3);
    vm.runInContext("selectedVisualizationTab = 'totalDistance'", dashboard);
    heartRateDashboard.invalidate.mockClear();
    dashboard.setSportFilter('Run');
    expect(heartRateDashboard.invalidate).toHaveBeenCalledTimes(1);
    expect(heartRateDashboard.render).toHaveBeenCalledTimes(3);
  });

  test('matches the original time-then-sport selection for every existing option', () => {
    const { dashboard } = loadDashboardForRendering(aggregationFixtures);
    const options = vm.runInContext('TIMEFRAME_OPTIONS', dashboard);
    for (const [mode, timeframes] of Object.entries(options)) {
      for (const timeframe of timeframes) {
        for (const sport of ['All', 'Run', 'Bike', 'Swim']) {
          dashboard.__selection = { mode, timeframe: timeframe.key, sport };
          vm.runInContext('selectedAggregationLevel = __selection.mode; selectedSportFilter = __selection.sport; selectedTimeframeByAggregation[__selection.mode] = __selection.timeframe;', dashboard);
          const expected = dashboard.getActivitiesInTimeframe().filter(activity => sport === 'All' || activity.sport === sport);
          expect(dashboard.getDashboardFilteredActivities()).toEqual(expected);
        }
      }
    }
  });

  test('keeps inclusive boundaries anchored to the entire dataset rather than selected sport', () => {
    const minDate = new Date(2026, 9, 28);
    const records = [
      { date: new Date(minDate.getTime() - 1), sport: 'Run', distance: 1 },
      { date: minDate, sport: 'Run', distance: 2 },
      { date: new Date(2026, 10, 4), sport: 'Bike', distance: 3 }
    ];
    const { dashboard } = loadDashboardForRendering(records);
    vm.runInContext("selectedAggregationLevel = 'daily'; selectedTimeframeByAggregation.daily = '7d'; selectedSportFilter = 'Run';", dashboard);
    expect(dashboard.getDashboardFilteredActivities().map(activity => activity.distance)).toEqual([2]);
    expect(dashboard.getTimeframeRange().maxDate).toEqual(records[2].date);
  });
});

function loadAdditionalChart(moduleName, canvasId) {
  const runtime = loadDashboardForRendering(aggregationFixtures.map(activity => ({ ...activity, startTime: activity.date, duration: 3600 })));
  const { dashboard, elements } = runtime;
  elements.set(canvasId, { getContext: () => ({}) });
  dashboard.window.distributionUtils = require('../src/distribution-utils');
  dashboard.window.workoutTimeUtils = require('../src/workout-time-utils');
  dashboard.PB_SPORT_COLOR = { Run: '#ff0000', Bike: '#00ff00', Swim: '#0000ff' };
  vm.runInContext(fs.readFileSync(path.join(__dirname, `../src/${moduleName}.js`), 'utf8'), dashboard);
  elements.get(canvasId).classList = { add() {}, remove() {} };
  return runtime;
}

describe('distribution and workout time chart adapters', () => {
  it('exports selected distribution bins and chart values independently of later live chart edits', () => {
    const { dashboard, elements } = loadAdditionalChart('dashboard-distributions', 'distributionsChart');
    elements.set('distributionsDateStart', {});
    elements.set('distributionsDateEnd', {});
    dashboard.initDistributionsDateSlider();
    dashboard.renderDistributionsChart();
    const chart = dashboard.window.dashboardTooltips.attachChart.mock.calls.at(-1)[1];
    const model = dashboard.window.distributionsDashboard.getExportData();
    expect(model).toMatchObject({ metric: 'length', sport: 'All', unit: 'km' });
    expect(model.bins.length).toBeGreaterThan(0);
    const bounds = dashboard.getDistributionsDateBounds();
    expect(model.period).toBe(`${dashboard.formatDateIso(bounds.minDate)} - ${dashboard.formatDateIso(bounds.maxDate)}`);
    expect(model.chartInput.data).toEqual(chart.config.data);
    const before = JSON.stringify(model);
    chart.config.data.datasets[0].data.length = 0;
    expect(JSON.stringify(model)).toBe(before);
  });

  it('exports the selected workout measure in its rendered unit without changing pattern grouping', () => {
    const { dashboard, elements } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    elements.set('workoutTimeDateStart', {});
    elements.set('workoutTimeDateEnd', {});
    dashboard.setWorkoutTimeMeasure('duration');
    const chart = dashboard.window.dashboardTooltips.attachChart.mock.calls.at(-1)[1];
    const model = dashboard.window.workoutTimeDashboard.getExportData();
    expect(model).toMatchObject({ metric: 'duration', unit: 'h', sport: 'All', granularity: 'day' });
    expect(model.chartInput.data).toEqual(chart.config.data);
    expect(model.groups.length).toBeGreaterThan(0);
    expect(model.chartInput.options.scales.x.ticks.callback(0)).toBe('00');
    expect(model.chartInput.options.scales.x.ticks.maxRotation).toBe(0);
    expect(model.xAxisTitle).toBe('Start hour (2-hour blocks)');
    const bounds = dashboard.getWorkoutTimeDateBounds();
    expect(model.period).toBe(`${dashboard.formatDateIso(bounds.minDate)} - ${dashboard.formatDateIso(bounds.maxDate)}`);
    const before = JSON.stringify(model);
    chart.config.data.datasets[0].data[0] = 999;
    expect(JSON.stringify(model)).toBe(before);
  });

  it.each([['count', 1], ['duration', 2], ['distance', 12]])('refreshes stale import date bounds without resetting the %s measure', (measure, expectedTotal) => {
    const { dashboard, elements } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    elements.set('workoutTimeDateStart', {});
    elements.set('workoutTimeDateEnd', {});
    dashboard.initWorkoutTimeDateSlider();
    dashboard.setWorkoutTimeMeasure(measure);
    dashboard.renderWorkoutTimeChart();
    dashboard.__replacement = [{ date: new Date(2030, 0, 4), startTime: new Date(2030, 0, 4, 8), sport: 'Run', duration: 7200, distance: 12 }];
    vm.runInContext('processedActivities = __replacement', dashboard);
    dashboard.window.dashboardTooltips.attachChart.mockClear();
    dashboard.renderWorkoutTimeChart();
    expect(dashboard.window.dashboardTooltips.attachChart).toHaveBeenCalledTimes(1);
    const chart = dashboard.window.dashboardTooltips.attachChart.mock.calls[0][1];
    expect(chart.config.data.datasets[0].data.reduce((sum, value) => sum + value, 0)).toBe(expectedTotal);
    expect(dashboard.getWorkoutTimeDateBounds().minDate).toEqual(new Date(2030, 0, 4));
    expect(vm.runInContext('selectedWorkoutTimeMeasure', dashboard)).toBe(measure);
    expect(elements.get('workoutTimeDateStart').value).toBe('0');
    expect(elements.get('workoutTimeDateEnd').value).toBe('0');
  });

  it.each([['count', 'Workouts', 11], ['duration', 'Duration (h)', 11], ['distance', 'Distance (km)', 197]])('renders %s with its actual unit and selected numeric values', (measure, axisTitle, total) => {
    const { dashboard } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    dashboard.renderWorkoutTimeChart();
    dashboard.setWorkoutTimeMeasure(measure);
    const chart = dashboard.window.dashboardTooltips.attachChart.mock.calls.at(-1)[1];
    expect(chart.config.options.scales.y.title.text).toBe(axisTitle);
    expect(chart.config.data.datasets[0].data.reduce((sum, value) => sum + value, 0)).toBe(total);
    expect(vm.runInContext('selectedWorkoutTimeMeasure', dashboard)).toBe(measure);
  });

  it('changes measure only after invalidating the old pin and retains it across filters and replacement data', () => {
    const { dashboard } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    const tooltips = dashboard.window.dashboardTooltips;
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedWorkoutTimeMeasure', dashboard)).toBe('count'));
    dashboard.setWorkoutTimeMeasure('duration');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(1);
    dashboard.setWorkoutTimeMeasure('duration');
    dashboard.setWorkoutTimeMeasure('unsupported');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(1);
    dashboard.setWorkoutTimeSportFilter('Run');
    dashboard.setWorkoutTimeGranularity('week');
    vm.runInContext('processedActivities = __activities.slice(0, 1)', dashboard);
    dashboard.renderWorkoutTimeChart();
    expect(vm.runInContext('selectedWorkoutTimeMeasure', dashboard)).toBe('duration');
    const snapshot = dashboard.getWorkoutTimeKeyboardAdapter().readSnapshot();
    expect(snapshot.selection.map(choice => choice.id)).toEqual(['granularity', 'sport', 'measure', 'start', 'end']);
    expect(snapshot.selection.find(choice => choice.id === 'measure').value).toBe('duration');
  });

  it('distinguishes all-unavailable measurements from exportable measured-zero data', () => {
    const { dashboard, elements } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    const classes = new Set(['hidden']);
    const emptyState = { textContent: '', classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
    elements.set('workoutTimeEmptyState', emptyState);
    vm.runInContext('processedActivities = __activities.map(activity => ({ ...activity, duration: 0, durationAvailable: false }))', dashboard);
    dashboard.setWorkoutTimeMeasure('duration');
    expect(classes.has('hidden')).toBe(false);
    expect(emptyState.textContent).toMatch(/No usable duration/i);
    vm.runInContext('processedActivities = __activities.map(activity => ({ ...activity, duration: 0, durationAvailable: true }))', dashboard);
    dashboard.renderWorkoutTimeChart();
    expect(classes.has('hidden')).toBe(true);
    expect(dashboard.window.dashboardTooltips.attachChart.mock.calls.at(-1)[1].config.data.datasets[0].data.every(value => value === 0)).toBe(true);
  });

  it.each(['line', 'histogram'])('attaches distributions in %s mode using original bucket/series values', mode => {
    const { dashboard } = loadAdditionalChart('dashboard-distributions', 'distributionsChart');
    if (mode === 'histogram') dashboard.setDistributionsSportFilter('Run');
    dashboard.setDistributionsDisplayMode(mode);
    const tooltips = dashboard.window.dashboardTooltips;
    expect(tooltips.attachChart).toHaveBeenLastCalledWith('distributions', expect.any(dashboard.Chart));
    const { config } = tooltips.attachChart.mock.calls.at(-1)[1];
    expect(config.options.interaction).toEqual({ mode: 'index', intersect: true });
    if (mode === 'line') {
      expect(config.data.datasets.map(dataset => dataset.label)).toEqual(['Run', 'Bike', 'Swim']);
      expect(config.data.datasets.every(dataset => dataset.pointHitRadius > 0)).toBe(true);
      expect(config.data.datasets.flatMap(dataset => dataset.data).reduce((sum, point) => sum + point.y, 0)).toBe(11);
    } else {
      expect(config.data.labels.length).toBe(config.data.datasets[0].data.length);
      expect(config.data.datasets[0].data.reduce((sum, count) => sum + count, 0)).toBe(5);
    }
  });

  it.each(['day', 'week', 'month', 'year'])('attaches workoutTime %s groups with native workout counts', granularity => {
    const { dashboard } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    dashboard.setWorkoutTimeGranularity(granularity);
    const tooltips = dashboard.window.dashboardTooltips;
    expect(tooltips.attachChart).toHaveBeenLastCalledWith('workoutTime', expect.any(dashboard.Chart), expect.objectContaining({ resolveHits: expect.any(Function), describeContent: expect.any(Function), anchorPoint: expect.any(Function) }));
    const { config } = tooltips.attachChart.mock.calls.at(-1)[1];
    expect(config.data.labels.length).toBe(config.data.datasets[0].data.length);
    expect(config.data.datasets[0].data.reduce((sum, count) => sum + count, 0)).toBe(11);
    expect(config.options.scales.x.title).toMatchObject({
      display: true,
      text: granularity === 'day' ? 'Start time' : granularity
    });
    expect(config.options.scales.y.title).toMatchObject({ display: true, text: 'Workouts' });
    expect(config.options.plugins.tooltip.callbacks.label({ parsed: { y: 3 } })).toBe('3 workouts');
  });

  it('invalidates data controls before commit, preserves palette-only keyboard selections and native legend behavior', () => {
    const { dashboard } = loadAdditionalChart('dashboard-distributions', 'distributionsChart');
    const tooltips = dashboard.window.dashboardTooltips;
    dashboard.renderDistributionsChart();
    const chart = tooltips.attachChart.mock.calls.at(-1)?.[1];
    expect(chart).toBeDefined();
    const nativeLegend = jest.fn(() => expect(tooltips.invalidate).toHaveBeenCalledTimes(1));
    dashboard.Chart.defaults = { plugins: { legend: { onClick: nativeLegend } } };
    chart.config.options.plugins.legend.onClick({}, { datasetIndex: 0 }, { chart });
    expect(nativeLegend).toHaveBeenCalledTimes(1);
    tooltips.invalidate.mockClear();
    dashboard.setDistributionsColorScheme('monochrome-blue');
    const adapter = dashboard.getDistributionsKeyboardAdapter();
    adapter.applySelection(adapter.readSnapshot().selection.map(choice => choice.id === 'palette' ? { ...choice, value: 'fire' } : choice));
    expect(tooltips.invalidate).not.toHaveBeenCalled();
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedDistributionsMetric', dashboard)).toBe('length'));
    dashboard.setDistributionsMetric('duration');
    dashboard.setDistributionsSportFilter('Run');
    dashboard.setDistributionsDisplayMode('histogram');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['dashboard-distributions', 'distributions', 'Distributions', 'distributionsDateRange'],
    ['dashboard-workout-time', 'workoutTime', 'WorkoutTime', 'workoutTimeDateRange']
  ])('invalidates date and keyboard changes before commit for %s and skips empty charts', (moduleName, prefix, suffix, rangeState) => {
    const { dashboard, elements } = loadAdditionalChart(moduleName, `${prefix}Chart`);
    for (const boundary of ['Start', 'End']) elements.set(`${prefix}Date${boundary}`, {});
    dashboard[`init${suffix}DateSlider`]();
    dashboard[`render${suffix}Chart`]();
    const tooltips = dashboard.window.dashboardTooltips;
    tooltips.invalidate.mockClear();
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext(`${rangeState}.start`, dashboard)).toBe(0));
    dashboard[`set${suffix}DateRange`]('start', 1);
    expect(tooltips.invalidate).toHaveBeenCalledTimes(1);
    dashboard[`set${suffix}DateRange`]('start', 1);
    dashboard[`set${suffix}DateRange`]('start', 'invalid');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(1);
    const adapter = dashboard[`get${suffix}KeyboardAdapter`]();
    const before = adapter.readSnapshot();
    tooltips.invalidate.mockImplementationOnce(() => expect(adapter.readSnapshot().selection).toEqual(before.selection));
    adapter.applySelection(before.selection.map(choice => choice.id === 'sport' ? { ...choice, value: 'Run' } : choice));
    expect(tooltips.invalidate).toHaveBeenCalledTimes(2);
    dashboard.__activities = [];
    vm.runInContext('processedActivities = __activities', dashboard);
    tooltips.attachChart.mockClear();
    dashboard[`render${suffix}Chart`]();
    expect(tooltips.attachChart).not.toHaveBeenCalled();
  });

  it('invalidates workout sport and granularity setters before the new data view', () => {
    const { dashboard } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    const tooltips = dashboard.window.dashboardTooltips;
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedWorkoutTimeSport', dashboard)).toBe('All'));
    dashboard.setWorkoutTimeSportFilter('Run');
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedWorkoutTimeGranularity', dashboard)).toBe('day'));
    dashboard.setWorkoutTimeGranularity('week');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(2);
    dashboard.setWorkoutTimeGranularity('week');
    dashboard.setWorkoutTimeSportFilter('Run');
    dashboard.setWorkoutTimeSportFilter('unsupported');
    expect(tooltips.invalidate).toHaveBeenCalledTimes(2);
  });

  it('describes unavailable, measured-zero and partial fields from an immutable render-local measure', () => {
    const { dashboard } = loadAdditionalChart('dashboard-workout-time', 'workoutTimeChart');
    dashboard.__activities = [
      { date: new Date(2026, 6, 1), startTime: new Date(2026, 6, 1, 2), sport: 'Run', duration: 0, durationAvailable: false },
      { date: new Date(2026, 6, 1), startTime: new Date(2026, 6, 1, 4), sport: 'Run', duration: 0 },
      { date: new Date(2026, 6, 1), startTime: new Date(2026, 6, 1, 6), sport: 'Run', duration: 4500 },
      { date: new Date(2026, 6, 1), startTime: new Date(2026, 6, 1, 6), sport: 'Run', duration: 0, durationAvailable: false }
    ];
    vm.runInContext('processedActivities = __activities', dashboard);
    dashboard.setWorkoutTimeMeasure('duration');
    const call = dashboard.window.dashboardTooltips.attachChart.mock.calls.at(-1);
    const inspection = call[2];
    const chart = { width: 1200, height: 400, canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 400 }) },
      chartArea: { left: 0, top: 0, right: 1200, bottom: 400 },
      scales: { x: { getValueForPixel: pixel => pixel / 100, getPixelForValue: index => index * 100 }, y: { getPixelForValue: value => 400 - value * 10 } } };
    expect(inspection.resolveHits({ offsetX: 100, offsetY: 200 }, chart)).toEqual([{ datasetIndex: 0, index: 1 }]);
    expect(inspection.resolveHits({ offsetX: -1, offsetY: 200 }, chart)).toEqual([]);
    expect(inspection.describeContent(chart, [{ index: 1 }]).notes).toEqual(['No usable duration values']);
    expect(inspection.describeContent(chart, [{ index: 2 }]).sections[0].rows[0].value).toBe('0s');
    expect(inspection.describeContent(chart, [{ index: 0 }]).notes).toEqual(['No activities']);
    expect(inspection.anchorPoint(chart, { index: 1 })).toEqual({ x: 100, y: 400 });
    expect(inspection.describeContent(chart, [{ index: 3 }]).notes).toEqual(['Available for 1 of 2 workouts']);
    vm.runInContext("selectedWorkoutTimeMeasure = 'distance'", dashboard);
    expect(inspection.describeContent(chart, [{ index: 3 }]).sections[0].rows[0].value).toBe('1h 15m');
    expect(inspection.anchorPoint(chart, { index: 3 })).toEqual({ x: 300, y: 387.5 });
    expect(call[1].config.data.datasets[0].data[1]).toBeNull();
    expect(call[1].config.data.datasets[0].data[2]).toBe(0);
  });
});

describe('dashboard core visualization readiness', () => {
  it('attaches the actual distance chart and preserves grouped formatted detail', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    runtime.render('yearly');
    const tooltips = runtime.dashboard.window.dashboardTooltips;
    expect(tooltips.attachChart).toHaveBeenCalledWith('totalDistance', expect.any(runtime.dashboard.Chart));
    const chart = tooltips.attachChart.mock.calls[0][1];
    const items = chart.config.data.datasets.map(dataset => ({ dataset, parsed: { y: dataset.data[0] } }));
    expect(chart.config.data.labels[0]).toBe('2024');
    expect(items.map(chart.config.options.plugins.tooltip.callbacks.label)).toEqual(['Running: 35.0 km', 'Cycling: 40.0 km', 'Swimming: 15.0 km']);
    expect(chart.config.options.plugins.tooltip.callbacks.footer(items)).toBe('Total: 90.0 km');
    expect(chart.config.options.interaction).toEqual({ mode: 'index', intersect: true });
  });

  it('passes grouped hit identity and the complete native model through the shared adapter', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    runtime.render('yearly');
    const { dashboard } = runtime;
    const chart = dashboard.window.dashboardTooltips.attachChart.mock.calls[0][1];
    const hits = chart.config.data.datasets.map((dataset, datasetIndex) => ({ datasetIndex, index: 0 }));
    chart.data = chart.config.data;
    chart.options = chart.config.options;
    chart.width = 400;
    chart.height = 300;
    chart.canvas = { dataset: {}, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
    chart.getElementsAtEventForMode = jest.fn(() => hits);
    chart.getDatasetMeta = () => ({ data: [{ tooltipPosition: () => ({ x: 100, y: 80 }) }] });
    chart.tooltip = {
      setActiveElements(activeHits) {
        const items = activeHits.map(hit => ({ dataset: chart.data.datasets[hit.datasetIndex], parsed: { y: chart.data.datasets[hit.datasetIndex].data[hit.index] } }));
        this.title = [chart.data.labels[activeHits[0].index]];
        this.body = items.map(item => ({ lines: [chart.options.plugins.tooltip.callbacks.label(item)] }));
        this.footer = [chart.options.plugins.tooltip.callbacks.footer(items)];
      },
      update() {}
    };
    dashboard.window.tooltipSelectionUtils = require('../src/tooltip-selection-utils');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-tooltips.js'), 'utf8'), dashboard);
    const inspector = dashboard.window.dashboardTooltips;
    inspector.attachChart('totalDistance', chart);
    const adapter = inspector.adapters.get('totalDistance');
    const event = { offsetX: 100, offsetY: 80 };
    const selection = adapter.describeItem(adapter.resolveItem(event), { x: 100, y: 80 });
    expect(chart.getElementsAtEventForMode).toHaveBeenCalledWith(event, 'index', { mode: 'index', intersect: true }, false);
    expect(selection.selectionKey).toBe('totalDistance:Running:2024|Cycling:2024|Swimming:2024');
    expect(selection.content).toEqual({ title: '2024', itemLabel: '2024', sections: [{ heading: '', rows: [
      { label: '', value: 'Running: 35.0 km' }, { label: '', value: 'Cycling: 40.0 km' }, { label: '', value: 'Swimming: 15.0 km' }
    ] }], footerLines: ['Total: 90.0 km'], notes: [] });
    expect(selection.anchor.capturePoint).toEqual({ x: 0.25, y: 80 / 300 });
  });

  it('invalidates before data setters and native legend commits, but not rendering', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    runtime.render('yearly');
    const { dashboard } = runtime;
    const tooltips = dashboard.window.dashboardTooltips;
    expect(tooltips.invalidate).not.toHaveBeenCalled();
    tooltips.invalidate.mockImplementation(() => {
      expect(vm.runInContext('selectedSportFilter', dashboard)).toBe('All');
    });
    dashboard.setSportFilter('Run', false);
    expect(tooltips.invalidate).toHaveBeenCalledTimes(1);
    tooltips.invalidate.mockReset();
    const nativeLegend = jest.fn(() => expect(tooltips.invalidate).toHaveBeenCalledTimes(1));
    dashboard.Chart.defaults = { plugins: { legend: { onClick: nativeLegend } } };
    const chart = tooltips.attachChart.mock.calls[0][1];
    chart.config.options.plugins.legend.onClick({}, { datasetIndex: 0 }, { chart });
    expect(nativeLegend).toHaveBeenCalledTimes(1);
  });

  it('keeps sport filter button pressed state synchronized with the selected sport', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    const { dashboard } = runtime;
    const buttons = Object.fromEntries(['All', 'Run', 'Bike', 'Swim'].map(sport => [sport, {
      id: `sportBtn${sport}`,
      className: '',
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }
    }]));
    dashboard.document.querySelectorAll = () => Object.values(buttons);
    dashboard.document.getElementById = id => Object.values(buttons).find(button => button.id === id) || null;

    dashboard.setSportFilter('Bike', false);

    expect(buttons.Bike.attributes['aria-pressed']).toBe('true');
    expect(['All', 'Run', 'Swim'].every(sport => buttons[sport].attributes['aria-pressed'] === 'false')).toBe(true);
  });

  it('invalidates before aggregation, timeframe and keyboard timeframe commits', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    runtime.render('weekly');
    const { dashboard } = runtime;
    const tooltips = dashboard.window.dashboardTooltips;
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedAggregationLevel', dashboard)).toBe('weekly'));
    dashboard.setAggregationLevel('monthly', false);
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedTimeframeByAggregation.monthly', dashboard)).toBe('all'));
    dashboard.setTimeframeFilter('6m');
    const adapter = dashboard.getTotalDistanceKeyboardAdapter();
    tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext('selectedTimeframeByAggregation.monthly', dashboard)).toBe('6m'));
    adapter.applySelection(adapter.readSnapshot().selection.map(choice => choice.id === 'timeframe' ? { ...choice, value: 'all' } : choice));
    expect(tooltips.invalidate).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['daily', 'Daily Distance', 'Daily Average', 'km/day', 0.2, 'Peak Day', 30, "1 Nov '24"],
    ['weekly', 'Weekly Distance', 'Weekly Average', 'km/wk', 1.7, 'Peak Week', 45, "Week of 9 Mar '26"],
    ['monthly', 'Monthly Distance', 'Monthly Average', 'km/mo', 7.3, 'Peak Month', 57, "Mar '26"],
    ['yearly', 'Yearly Distance', 'Yearly Average', 'km/yr', 65.7, 'Peak Year', 90, '2024']
  ])('labels, averages, and peaks the %s aggregation from its own buckets', (aggregation, title, averageLabel, averageUnit, averageKm, peakLabel, peakKm, peakPeriod) => {
    const runtime = loadDashboardForRendering(aggregationFixtures);

    runtime.render(aggregation);

    expect(Number(runtime.elements.get('cardPeakKm').textContent)).toBe(peakKm);
    expect(runtime.elements.get('distanceChartTitle').textContent).toBe(title);
    expect(runtime.elements.get('cardAvgLabel').textContent).toBe(averageLabel);
    expect(runtime.elements.get('cardAvgUnit').textContent).toBe(averageUnit);
    expect(Number(runtime.elements.get('cardAvgKm').textContent)).toBe(averageKm);
    expect(runtime.elements.get('cardPeakLabel').textContent).toBe(peakLabel);
    expect(runtime.elements.get('cardPeakPeriod').textContent).toBe(peakPeriod);
  });

  it('calculates the peak using the selected sport and timeframe', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);

    runtime.render('monthly', 'Run', '6m');

    expect(Number(runtime.elements.get('cardPeakKm').textContent)).toBe(27);
    expect(runtime.elements.get('cardPeakPeriod').textContent).toBe("Mar '26");
    expect(runtime.elements.get('cardPeakLabel').textContent).toBe('Peak Month');
    expect(runtime.elements.get('cardAvgLabel').textContent).toBe('Monthly Average');
    expect(runtime.elements.get('cardAvgUnit').textContent).toBe('km/mo');
    expect(Number(runtime.elements.get('cardAvgKm').textContent)).toBe(3.9);
  });

  it('exposes the selected distance total and period without recomputing dashboard data', () => {
    const runtime = loadDashboardForRendering(aggregationFixtures);
    runtime.render('yearly', 'Run', 'all');

    expect(runtime.dashboard.window.totalDistanceDashboard.getExportData()).toMatchObject({
      sport: 'Run',
      metric: 'Distance',
      period: '2024-2026',
      unit: 'km',
      centralValue: 82,
      aggregation: 'yearly',
      periodLabels: ['2024', '2025', '2026'],
      series: [{ label: 'Running', values: [35, 20, 27] }],
      incompleteYear: '2026'
    });
  });

  it('applies complete distance views with candidate aggregation periods and one render', () => {
    const dashboard = loadDashboardCore();
    dashboard.window = { dashboardTabNavigation: require('../src/tab-navigation') };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8'), dashboard);
    dashboard.document = { querySelectorAll: () => [], getElementById: () => null };
    dashboard.renderDashboard = jest.fn();
    const adapter = dashboard.getTotalDistanceKeyboardAdapter();
    expect(adapter.getDomainProvider(adapter.readSnapshot())([{ id: 'aggregation', value: 'yearly' }, { id: 'sport', value: 'All' }]).values).toEqual(['3y', '5y', '10y', 'all']);
    adapter.applySelection([{ id: 'aggregation', value: 'yearly' }, { id: 'sport', value: 'Run' }, { id: 'timeframe', value: '3y' }]);
    expect(adapter.readSnapshot().selection.map(choice => choice.value)).toEqual(['yearly', 'Run', '3y']);
    expect(dashboard.renderDashboard).toHaveBeenCalledTimes(1);
  });

  it('requires a valid date, supported sport, and positive distance for total distance', () => {
    const dashboard = loadDashboardCore();

    expect(dashboard.hasRenderableDistanceData([
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Run', distance: 5 }
    ])).toBe(true);
    expect(dashboard.hasRenderableDistanceData([
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Other', distance: 5 },
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Bike', distance: 0 },
      { sport: 'Swim', distance: 2 }
    ])).toBe(false);
    expect(dashboard.hasRenderableDistanceData([])).toBe(false);
  });
});
