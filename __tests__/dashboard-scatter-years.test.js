const fs = require('fs');
const path = require('path');
const vm = require('vm');

function element(tag = 'div') {
  const listeners = {};
  const classes = new Set();
  return {
    tag, children: [], style: {}, textContent: '', checked: false,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      toggle: (value, on) => { if (on) classes.add(value); else classes.delete(value); },
      contains: value => classes.has(value)
    },
    addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    dispatch(type, event = {}) { listeners[type]?.forEach(callback => callback({ shiftKey: false, preventDefault() {}, ...event })); },
    replaceChildren(...children) { this.children = children; },
    appendChild(child) { this.children.push(child); },
    append(...children) { this.children.push(...children); },
    setAttribute() {},
    getContext() { return {}; }
  };
}

function harness(years = [2020, 2021, 2022, 2023, 2024, 2025]) {
  const ids = ['paceMetricsChart', 'paceMetricsEmptyState', 'paceMetricsPointCount',
    'paceMetricsTrendControls', 'paceMetricsSportFilters', 'paceMetricsMetricFilters',
    'scatterDateStart', 'scatterDateEnd', 'scatterRangeLabel', 'scatterRangeSelectedTrack'];
  const elements = Object.fromEntries(ids.map(id => [id, element()]));
  const activities = years.flatMap(year => [0, 1].map(index => ({
    year, date: new Date(year, 0, index + 1), sport: 'Run', metric: 'heartRate'
  })));
  const charts = [];
  class Chart {
    constructor(_context, config) {
      this.data = config.data;
      this.visibility = new Map();
      this.setDatasetVisibility = jest.fn((index, visible) => this.visibility.set(index, visible));
      this.update = jest.fn();
      this.destroy = jest.fn();
      charts.push(this);
    }
  }
  const sandbox = {
    document: { getElementById: id => elements[id] || null, createElement: element },
    window: { scatterUtils: {
      getPaceMetricPoints: (data, { sport, metric, minDate, maxDate }) => data
        .filter(a => a.sport === sport && a.metric === metric && (!minDate || a.date >= minDate) && (!maxDate || a.date <= maxDate))
        .map(a => ({ ...a, x: 5, y: 150, duration: 3600, distance: 10 })),
      buildYearlyRegressionDatasets: points => [...new Set(points.map(point => point.year))]
        .map(year => ({ type: 'line', year, borderColor: '#fff', data: [] })),
      calculateBubbleRadius: () => 5
    } },
    processedActivities: activities, Chart,
    formatDateIso: date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    formatShortDate: date => date.toISOString().slice(0, 10),
    getPerformanceMetaForSport: () => ({ axisTitle: 'Pace', metricType: 'pace', reverseXAxis: false }),
    formatPerformanceValue: () => '', formatDuration: () => ''
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-scatter.js'), 'utf8'), sandbox);
  sandbox.initScatterDateSlider();
  sandbox.renderPaceMetricsChart();

  function boxes() {
    return new Map(elements.paceMetricsTrendControls.children
      .filter(child => child.tag === 'label' && typeof child.children[2]?.textContent === 'number')
      .map(label => [label.children[2].textContent, { label, checkbox: label.children[0] }]));
  }
  function click(year, shiftKey = false, viaLabel = false) {
    if (!boxes().has(year)) throw new Error(`Year ${year} not visible: ${[...boxes().keys()]}`);
    const { label, checkbox } = boxes().get(year);
    if (viaLabel) {
      const preventDefault = jest.fn();
      label.dispatch('mousedown', { shiftKey, preventDefault });
      if (shiftKey) expect(preventDefault).toHaveBeenCalledTimes(1);
    }
    checkbox.checked = !checkbox.checked; // native checkbox default action precedes click
    checkbox.dispatch('click', { shiftKey });
    checkbox.dispatch('change'); // browser also fires change; must not update the chart twice
  }
  function visibility(year, type = 'bubble') {
    const chart = charts.at(-1);
    const index = chart.data.datasets.findIndex(dataset => dataset.year === year && dataset.type === type);
    return chart.visibility.get(index);
  }
  return { sandbox, elements, charts, activities, boxes, click, visibility };
}

describe('Pace vs years controls', () => {
  it('toggles exactly one year on normal click, including label clicks and keyboard-style activation', () => {
    const h = harness();
    const chart = h.charts.at(-1);
    chart.update.mockClear();
    h.click(2020, false, true);
    expect([...h.boxes()].map(([year, { checkbox }]) => [year, checkbox.checked]))
      .toEqual([2020, 2021, 2022, 2023, 2024, 2025].map(year => [year, year !== 2020]));
    expect(h.visibility(2020)).toBe(false);
    expect(h.visibility(2020, 'line')).toBe(false);
    expect(chart.update).toHaveBeenCalledTimes(1);
    h.click(2020);
    expect(h.visibility(2020)).toBe(true);
  });

  it('applies the NEW target state inclusively forwards and backwards, without touching outside years', () => {
    const h = harness([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
    h.click(2020);
    const chart = h.charts.at(-1);
    chart.update.mockClear();
    h.click(2025, true, true);
    expect(chart.update).toHaveBeenCalledTimes(1);
    for (let year = 2020; year <= 2025; year++) {
      expect(h.boxes().get(year).checkbox.checked).toBe(false);
      expect(h.visibility(year)).toBe(false);
      expect(h.visibility(year, 'line')).toBe(false);
    }
    expect(h.boxes().get(2019).checkbox.checked).toBe(true);
    expect(h.boxes().get(2026).checkbox.checked).toBe(true);
    h.click(2025); // new anchor, enable target
    h.click(2020, true);
    for (let year = 2020; year <= 2025; year++) expect(h.boxes().get(year).checkbox.checked).toBe(true);
  });

  it('uses only selectable years, and a shift click without an anchor changes a single year', () => {
    const h = harness([2020, 2022, 2025]);
    h.click(2025, true);
    expect(h.boxes().get(2020).checkbox.checked).toBe(true);
    expect(h.boxes().get(2025).checkbox.checked).toBe(false);
    h.click(2025); // enable it again so the next target click disables it
    h.click(2020);
    h.click(2025, true);
    expect(h.boxes().get(2022).checkbox.checked).toBe(false);
    expect(h.boxes().has(2021)).toBe(false);
    const single = harness([2024]);
    single.click(2024, true);
    expect(single.visibility(2024)).toBe(false);
  });

  it('keeps trend switch independent of year selection and never shows disabled-year lines', () => {
    const h = harness([2020, 2021]);
    const trend = h.elements.paceMetricsTrendControls.children.at(-1).children[0];
    trend.checked = false;
    trend.dispatch('change');
    h.click(2020);
    h.click(2021, true);
    expect(trend.checked).toBe(false);
    h.click(2020);
    expect(h.visibility(2020)).toBe(true);
    expect(h.visibility(2020, 'line')).toBe(false);
    trend.checked = true;
    trend.dispatch('change');
    expect(h.visibility(2020, 'line')).toBe(true);
    expect(h.visibility(2021, 'line')).toBe(false);
  });

  it('preserves disabled years over metric, sport, date and empty views, and enables unknown years', () => {
    const h = harness([2020, 2021, 2022]);
    h.click(2020);
    h.click(2022, true);
    h.activities.push({ year: 2024, date: new Date(2024, 0, 1), sport: 'Run', metric: 'heartRate' });
    h.sandbox.initScatterDateSlider();
    h.sandbox.setPaceMetric('cadence'); // empty
    expect(h.boxes().size).toBe(0);
    h.activities.push({ year: 2021, date: new Date(2021, 0, 2), sport: 'Run', metric: 'cadence' });
    h.sandbox.renderPaceMetricsChart();
    expect([...h.boxes().keys()]).toEqual([2021]);
    h.sandbox.setPaceMetricsSport('Bike'); // empty sport
    h.sandbox.setPaceMetricsSport('Run');
    h.sandbox.setPaceMetric('heartRate');
    expect(h.boxes().get(2020).checkbox.checked).toBe(false);
    expect(h.boxes().get(2022).checkbox.checked).toBe(false);
    expect(h.boxes().get(2024).checkbox.checked).toBe(true);
    h.sandbox.initScatterDateSlider();
    h.sandbox.setScatterDateRange('start', h.activities.length - 1);
    expect([...h.boxes().keys()]).toEqual([2024]);
    h.sandbox.setScatterDateRange('start', 0);
    expect(h.boxes().get(2020).checkbox.checked).toBe(false);
    expect(h.visibility(2020)).toBe(false);
  });

  it('discards a hidden anchor, and resets selection and anchor on the existing import reset path', () => {
    const h = harness([2020, 2021, 2022]);
    h.click(2020);
    h.sandbox.setPaceMetric('cadence');
    h.activities.push({ year: 2022, date: new Date(2022, 0, 2), sport: 'Run', metric: 'cadence' });
    h.sandbox.renderPaceMetricsChart();
    h.click(2022, true);
    h.sandbox.setPaceMetric('heartRate');
    expect(h.boxes().get(2021).checkbox.checked).toBe(true);
    expect(h.boxes().get(2022).checkbox.checked).toBe(false);
    const trend = h.elements.paceMetricsTrendControls.children.at(-1).children[0];
    trend.checked = false;
    trend.dispatch('change');
    h.sandbox.processedActivities = [{ year: 2022, date: new Date(2022, 0, 1), sport: 'Run', metric: 'heartRate' }];
    h.sandbox.initPaceMetricsControls({ reset: true });
    h.sandbox.initScatterDateSlider();
    h.sandbox.renderPaceMetricsChart();
    expect([...h.boxes().values()].every(({ checkbox }) => checkbox.checked)).toBe(true);
    expect(h.elements.paceMetricsTrendControls.children.at(-1).children[0].checked).toBe(true);
    expect(h.visibility(2022, 'line')).toBe(true);
    h.click(2022, true);
    expect(h.boxes().size).toBe(1);
    expect(h.visibility(2022)).toBe(false);
    const importSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-import.js'), 'utf8');
    expect(importSource).toMatch(/function applyImportedDataset\([\s\S]*?initPaceMetricsControls\(\{ reset: true \}\)/);
  });
});