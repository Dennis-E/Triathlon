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
  const dashboard = loadDashboardCore();
  dashboard.window = { dashboardTabNavigation: require('../src/tab-navigation'), innerWidth: 1024 };
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

describe('dashboard core visualization readiness', () => {
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
