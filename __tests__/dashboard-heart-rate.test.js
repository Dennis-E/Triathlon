const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadHeartRate(activities) {
  function node() {
    return { textContent: '', children: [], style: {}, value: '', disabled: false,
      classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() },
      appendChild(child) { this.children.push(child); return child; },
      replaceChildren(...children) { this.children = children; },
      setAttribute: jest.fn(), getContext: () => ({}), addEventListener: jest.fn() };
  }
  const nodes = new Map(['heartRateChart', 'heartRateEmptyState', 'heartRateDetails', 'heartRateShareBtn', 'heartRateFilters'].map(id => [id, node()]));
  const document = { getElementById: id => nodes.get(id) || null, createElement: node };
  const attachChart = jest.fn();
  const context = {
    Date, processedActivities: activities, selectedSportFilter: 'All', dashboardDataRevision: 1,
    selectedAggregationLevel: 'daily', selectedTimeframeByAggregation: { daily: 'all', weekly: 'all', monthly: 'all', yearly: 'all' },
    TIMEFRAME_OPTIONS: Object.fromEntries(['daily', 'weekly', 'monthly', 'yearly'].map(level => [level, [
      { key: 'all', label: 'All', all: true }, { key: '3m', label: '3 Months', amount: 3, unit: 'months' }, { key: '1y', label: '1 Year', amount: 1, unit: 'years' }
    ]])),
    getCurrentTimeframeOption: () => context.TIMEFRAME_OPTIONS[context.selectedAggregationLevel].find(option => option.key === context.selectedTimeframeByAggregation[context.selectedAggregationLevel]),
    shiftDateByUnit: (date, amount, unit) => { const result = new Date(date); if (unit === 'months') result.setMonth(result.getMonth() - amount); else result.setFullYear(result.getFullYear() - amount); return result; },
    setSportFilter: jest.fn(), setAggregationLevel: jest.fn(), setTimeframeFilter: jest.fn(),
    getDashboardFilteredActivities: () => context.processedActivities.filter(activity => context.selectedSportFilter === 'All' || activity.sport === context.selectedSportFilter),
    getTimeframeRange: () => ({ minDate: new Date(2026, 9, 1), maxDate: new Date(2026, 10, 4) }),
    document, window: { document, heartRateUtils: require('../src/heart-rate-utils'), dashboardTooltips: { attachChart, invalidate: jest.fn() } },
    Chart: class {
      constructor(canvas, config) {
        this.config = config; this.data = config.data; this.options = config.options;
        this.destroy = jest.fn(); this.width = 800; this.height = 400;
        this.getElementsAtEventForMode = () => this.data.datasets.flatMap((dataset, datasetIndex) => dataset.data.map((point, index) => ({ datasetIndex, index })));
        this.getDatasetMeta = datasetIndex => ({ data: this.data.datasets[datasetIndex].data.map(() => ({ x: 10, y: 10 })) });
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-heart-rate.js'), 'utf8'), context);
  return { context, nodes, attachChart, api: context.window.heartRateDashboard };
}

function records() {
  return [
    { id: 'same', name: 'First', date: new Date(2026, 9, 1), sport: 'Run', minHeartRate: 150, maxHeartRate: 150 },
    { id: 'same', name: 'Second', date: new Date(2026, 9, 1), sport: 'Bike', maxHeartRate: 150 }
  ];
}

describe('heart-rate calendar view', () => {
  test('uses requested unclamped bounds even when longer windows contain identical trainings', () => {
    const runtime = loadHeartRate(records());
    runtime.context.selectedTimeframeByAggregation.daily = '3m';
    const short = runtime.api.getViewRange(records());
    runtime.context.selectedTimeframeByAggregation.daily = '1y';
    const long = runtime.api.getViewRange(records());
    expect(short.rangeStart).toBe(new Date(2026, 7, 4).getTime());
    expect(long.rangeStart).toBe(new Date(2025, 10, 4).getTime());
    expect(short.rangeEnd).toBe(long.rangeEnd);
    expect(long.displayStart).toBe(long.rangeStart);
  });

  test('uses all matching history including days without extrema and only pads degenerate All', () => {
    const activities = [...records(), { date: new Date(2026, 11, 1), sport: 'Run' }];
    const runtime = loadHeartRate(activities);
    const range = runtime.api.getViewRange(activities);
    expect(range.rangeEnd).toBe(new Date(2026, 11, 1).getTime());
    const single = runtime.api.getViewRange([activities[0]]);
    expect(single.rangeStart).toBe(single.rangeEnd);
    expect(single.displayStart).toBeLessThan(single.rangeStart);
    expect(single.displayEnd).toBeGreaterThan(single.rangeEnd);
  });

  test('aggregates only the global selector output and displays requested bounds', () => {
    const runtime = loadHeartRate(records());
    runtime.context.selectedAggregationLevel = 'weekly';
    runtime.context.selectedTimeframeByAggregation.weekly = '1y';
    runtime.context.selectedSportFilter = 'Bike';
    runtime.api.render();
    const [, chart] = runtime.attachChart.mock.calls.at(-1);
    expect(chart.data.datasets.map(series => series.data.length)).toEqual([0, 1]);
    expect(chart.options.scales.x.min).toBe(new Date(2025, 10, 4).getTime());
    expect(chart.options.scales.x.max).toBe(new Date(2026, 10, 4).getTime());
    expect(runtime.nodes.get('heartRateFilters').children[1].children[0].textContent).toBe('Calendar grouping');
  });
});

describe('heart-rate dashboard renderer', () => {
  test('exports only the copied calendar render context, never later live globals', () => {
    const runtime = loadHeartRate(records());
    runtime.context.selectedAggregationLevel = 'weekly';
    runtime.context.selectedTimeframeByAggregation.weekly = '1y';
    runtime.api.render();
    runtime.context.selectedSportFilter = 'Swim';
    runtime.context.selectedAggregationLevel = 'yearly';
    runtime.context.getTimeframeRange = () => { throw new Error('live timeframe read'); };
    const data = runtime.api.getExportData();
    expect(data).toMatchObject({sport:'All',aggregation:'weekly',activityCount:2,periodCount:1,
      periodStart:new Date(2025,10,4).getTime(),periodEnd:new Date(2026,10,4).getTime(),
      viewBounds:{min:new Date(2025,10,4).getTime(),max:new Date(2026,10,4).getTime()}});
    expect(data.periodLabels).toHaveLength(1);
    expect(data.chartInput.data.datasets.map(series=>series.data.length)).toEqual([1,1]);
    expect(JSON.stringify(data)).not.toMatch(/First|Second|contributors|heartRateProvenance/);
  });

  test('copies field provenance into details and distinguishes direct from recorded values', () => {
    const activities = records();
    activities[0].heartRateProvenance = {
      minimum: { value: 150, status: 'valid', source: 'records', sampleCount: 3, readComplete: true },
      maximum: { value: 150, status: 'valid', source: 'summary', sampleCount: null, readComplete: null }
    };
    const runtime = loadHeartRate(activities);
    runtime.api.render();
    const [, chart, inspection] = runtime.attachChart.mock.calls.at(-1);
    const hits = inspection.resolveHits({}, chart);
    inspection.describeContent(chart, [hits[0]]);
    expect(runtime.nodes.get('heartRateDetails').children.at(-1).textContent).toMatch(/from recorded measurements/i);
    activities[0].heartRateProvenance.minimum.source = 'summary';
    inspection.describeContent(chart, [hits[0]]);
    expect(runtime.nodes.get('heartRateDetails').children.at(-1).textContent).toMatch(/from recorded measurements/i);
    inspection.describeContent(chart, [hits[1]]);
    expect(runtime.nodes.get('heartRateDetails').children.at(-1).textContent).toMatch(/direct summary/i);
  });

  test('copies the current heart-rate export snapshot without activities or pins', () => {
    const activities = records();
    const runtime = loadHeartRate(activities);
    runtime.context.selectedTimeframeByAggregation.daily = '1y';
    runtime.api.render();
    const data = runtime.api.getExportData();
    expect(data).toMatchObject({ sport: 'All', metric: 'heartRate', unit: 'bpm', activityCount: 2,
      periodStart: new Date(2025, 10, 4).getTime(), periodEnd: new Date(2026, 10, 4).getTime() });
    expect(data.points).toHaveLength(2);
    expect(data.chartInput.type).toBe('scatter');
    expect(data.chartInput.data.datasets.every(dataset => dataset.pointRadius >= 8)).toBe(true);
    expect(data.chartInput.data.datasets.every(dataset => dataset.clip === false)).toBe(true);
    expect(data.legend.items.map(item => item.pointStyle)).toEqual(['circle', 'triangle']);
    const before = JSON.stringify(data);
    activities[0].minHeartRate = 999;
    runtime.attachChart.mock.calls.at(-1)[1].data.datasets[0].data[0].y = 888;
    expect(JSON.stringify(data)).toBe(before);
    expect(data.points.every(point => !('activity' in point) && !('name' in point))).toBe(true);
    runtime.api.invalidate();
    expect(runtime.api.getExportData()).toBeNull();
  });

  test('renders separate point-only series and keeps every overlapping entry inspectable', () => {
    const runtime = loadHeartRate(records());
    runtime.api.render();
    const [, chart, inspection] = runtime.attachChart.mock.calls.at(-1);
    expect(chart.config.type).toBe('scatter');
    expect(chart.data.datasets.map(dataset => dataset.label)).toEqual(['Minimum', 'Maximum']);
    expect(chart.data.datasets.every(dataset => dataset.showLine === false)).toBe(true);
    expect(chart.data.datasets.map(dataset => dataset.pointStyle)).toEqual(['circle', 'triangle']);
    expect(chart.data.datasets.map(dataset => dataset.data.length)).toEqual([1, 1]);
    const hits = inspection.resolveHits({}, chart);
    expect(hits).toHaveLength(2);
    const description = inspection.describeContent(chart, hits);
    expect(description.title).toContain('Minimum');
    const selector = runtime.nodes.get('heartRateDetails').children.find(child => child.children.length === 3);
    expect(selector).toBeDefined();
    expect(selector.children.map(option => option.textContent).join(' ')).toContain('Second');
    selector.value = '2';
    selector.onchange();
    expect(runtime.nodes.get('heartRateDetails').children.at(-1).textContent).toContain('Second');
    expect(chart.data.datasets.flatMap(dataset => dataset.inspectionKeys)).toHaveLength(2);
  });

  test('retains import-wide keys across filtering and destroys stale charts/details on reset or empty filters', () => {
    const runtime = loadHeartRate(records());
    runtime.api.render();
    const chart = runtime.attachChart.mock.calls.at(-1)[1];
    const bikeKey = chart.data.datasets[1].data[0].sources[1].activityKey;
    runtime.context.selectedSportFilter = 'Bike';
    runtime.api.render();
    expect(chart.destroy).toHaveBeenCalledTimes(1);
    expect(runtime.attachChart.mock.calls.at(-1)[1].data.datasets[1].data[0].sources[0].activityKey).toBe(bikeKey);
    runtime.context.selectedSportFilter = 'Swim';
    runtime.api.render();
    expect(runtime.nodes.get('heartRateEmptyState').textContent).toMatch(/No .*heart.rate/i);
    expect(runtime.api.getExportData()).toBeNull();
    runtime.api.reset();
    expect(runtime.nodes.get('heartRateDetails').children).toHaveLength(0);
  });
});