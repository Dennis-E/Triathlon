const fs = require('fs');
const path = require('path');
const vm = require('vm');
const equipmentUtils = require('../src/equipment-utils');
const distributionUtils = require('../src/distribution-utils');

const activities = [
  { equipment: 'Nike Fast', distance: 10, duration: 2400 },
  { equipment: 'Asics Slow', distance: 10, duration: 3600 },
  { equipment: 'Road Fast', distance: 40, duration: 3600 },
  { equipment: 'Road Slow', distance: 40, duration: 7200 }
];

function comparisonActivities(speeds = [10, 12, 15], type = 'Shoes') {
  return speeds.map((speed, index) => ({
    equipment: `${type === 'Shoes' ? 'Nike' : 'Road'} ${index}`,
    distance: 10,
    duration: 36000 / speed
  }));
}

function element(id) {
  const classes = new Set(['hidden']);
  return {
    id, style: {}, children: [], textContent: '', value: '',
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: (name, force) => { if (force) classes.add(name); else classes.delete(name); },
      contains: name => classes.has(name)
    },
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; }
  };
}

function harness(width = 768) {
  const elements = Object.fromEntries([
    'equipmentChart', 'equipmentCanvasArea', 'equipmentChartWrapper',
    'equipmentEmptyState', 'equipmentValueFallback', 'equipmentPaceExplanation',
    'equipmentColorSchemeControl', 'equipmentColorScheme',
    'equipmentTimelineChart', 'equipmentTimelineWrapper', 'equipmentTimelineEmptyState'
  ].map(id => [id, element(id)]));
  const text = [];
  const gradients = [];
  const ctx = {
    save() {}, restore() {},
    measureText: value => ({ width: String(value).length * 7 }),
    fillText: (value, x, y) => text.push({ value, x, y }),
    createLinearGradient(...coordinates) {
      const gradient = { coordinates, stops: [], addColorStop(position, color) { this.stops.push([position, color]); } };
      gradients.push(gradient);
      return gradient;
    }
  };
  elements.equipmentCanvasArea.clientWidth = width;
  elements.equipmentChart.getContext = () => ctx;
  elements.equipmentTimelineChart.getContext = () => ctx;
  const charts = [];
  class Chart {
    constructor(context, config) {
      this.ctx = context;
      this.data = config.data;
      this.config = config;
      this.options = config.options;
      this.plugins = config.plugins;
      this.width = width;
      this.chartArea = { left: 0, right: width - config.options.layout.padding.right };
      this.scales = { x: { getPixelForValue: value => this.chartArea.left + value * (this.chartArea.right - this.chartArea.left) } };
      this.bars = (this.data.labels || this.data.datasets[0].data).map((_, index) => ({
        x: this.chartArea.right, y: 50 + index * 56,
        options: { backgroundColor: this.data.datasets[0].backgroundColor?.[index], borderRadius: 6 }
      }));
      this.destroy = jest.fn();
      charts.push(this);
    }
    getDatasetMeta() {
      return { data: this.bars };
    }
    draw() {
      this.bars.forEach(bar => { bar.x = this.chartArea.right; });
      this.plugins.forEach(plugin => { if (plugin.beforeDatasetsDraw) plugin.beforeDatasetsDraw(this); });
      this.plugins.forEach(plugin => { if (plugin.afterDatasetsDraw) plugin.afterDatasetsDraw(this); });
    }
    resize(nextWidth) {
      this.width = nextWidth;
      elements.equipmentCanvasArea.clientWidth = nextWidth;
      this.options.onResize(this);
      this.chartArea.right = nextWidth - this.options.layout.padding.right;
      text.length = 0;
      this.draw();
    }
  }
  const sandbox = {
    window: { equipmentUtils, distributionUtils,
      dashboardTooltips: { attachChart: jest.fn(), invalidate: jest.fn() } }, Chart,
    document: {
      getElementById: id => elements[id] || null,
      querySelectorAll: () => [],
      createElement: () => element('row')
    },
    processedActivities: activities,
    formatPaceLabel: pace => `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')} /km`,
    paceMinPerKmToSpeedKmh: pace => 60 / pace,
    formatSpeedLabel: speed => `${speed.toFixed(1)} km/h`
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-equipment.js'), 'utf8'), sandbox);
  return { sandbox, elements, charts, text, gradients, draw: () => { text.length = 0; charts.at(-1).draw(); } };
}

describe('equipment chart', () => {
  it('exposes sorted ranking labels and native values for social export', () => {
    const h = harness();
    h.sandbox.renderEquipmentChart();

    expect(h.sandbox.window.equipmentDashboard.getExportData()).toEqual({
      metric: 'distance',
      equipmentFilter: 'All',
      unit: 'km',
      items: [
        { name: 'Road Fast', value: 40, displayValue: '40.0 km' },
        { name: 'Road Slow', value: 40, displayValue: '40.0 km' },
        { name: 'Nike Fast', value: 10, displayValue: '10.0 km' },
        { name: 'Asics Slow', value: 10, displayValue: '10.0 km' }
      ]
    });
  });

  it('exposes equipment timeline spans in the dashboard ordering', () => {
    const h = harness();
    h.sandbox.processedActivities = [
      { equipment: 'Nike Fast', date: new Date('2024-01-01'), distance: 10, sport: 'Run' },
      { equipment: 'Road Fast', date: new Date('2024-03-01'), distance: 20, sport: 'Bike' },
      { equipment: 'Nike Fast', date: new Date('2024-02-01'), distance: 5, sport: 'Run' }
    ];

    expect(h.sandbox.window.equipmentDashboard.getTimelineExportData()).toEqual({
      mode: 'continuous',
      equipmentFilter: 'All',
      periodMeaning: 'Usage span',
      items: [
        { name: 'Road Fast', type: 'Bikes', firstDate: new Date('2024-03-01'), lastDate: new Date('2024-03-01'), totalKm: 20, activityCount: 1 },
        { name: 'Nike Fast', type: 'Shoes', firstDate: new Date('2024-01-01'), lastDate: new Date('2024-02-01'), totalKm: 15, activityCount: 2 }
      ]
    });
  });

  it('attaches every equipment metric and preserves native display values', () => {
    const h = harness();
    for (const [metric, expected] of [['distance', '40.0 km'], ['pace', '4:00 /km'], ['count', '1'], ['avgLength', '40']]) {
      h.sandbox.setEquipmentMetric(metric);
      const chart = h.charts.at(-1);
      expect(h.sandbox.window.dashboardTooltips.attachChart).toHaveBeenLastCalledWith('equipment', chart);
      expect(String(chart.options.plugins.tooltip.callbacks.label({ dataIndex: 0, raw: chart.data.datasets[0].data[0] }))).toBe(expected);
    }
  });

  it('attaches continuous timeline with full interval detail and excludes spacer hits', () => {
    const h = harness();
    h.sandbox.processedActivities = [
      { equipment: 'Nike Fast', date: new Date('2025-01-01'), distance: 10, sport: 'Run', name: 'First' },
      { equipment: 'Nike Fast', date: new Date('2025-01-03'), distance: 20, sport: 'Run', name: 'Last' }
    ];
    h.sandbox.renderEquipmentTimeline();
    const chart = h.charts.at(-1);
    expect(h.sandbox.window.dashboardTooltips.attachChart).toHaveBeenLastCalledWith('equipmentTimeline', chart);
    const tooltip = chart.options.plugins.tooltip;
    expect(tooltip.callbacks.title([{ dataIndex: 0 }])).toBe('Nike Fast');
    expect(tooltip.callbacks.label({ datasetIndex: 1, dataIndex: 0 })).toEqual([
      'From: 1 Jan 2025', 'To:   3 Jan 2025', 'Distance: 30.0 km', 'Activities: 2'
    ]);
    expect(chart.data.datasets[0].label).toBe('');
    expect(tooltip.filter({ datasetIndex: 0 })).toBe(false);
    const spacer = {};
    chart.getDatasetMeta = index => ({ data: index === 0 ? [spacer] : [{}] });
    chart.plugins.forEach(plugin => plugin.afterUpdate?.(chart));
    expect(spacer.skip).toBe(true);
  });

  it('uses the exact activity rectangle rather than the hidden zero-radius point for hits', () => {
    const h = harness();
    h.sandbox.processedActivities = [{ equipment: 'Nike Fast', date: new Date('2025-01-01'), distance: 10, sport: 'Run', name: 'Morning run' }];
    h.sandbox.setEquipmentTimelineMode('activities');
    const chart = h.charts.at(-1);
    expect(h.sandbox.window.dashboardTooltips.attachChart).toHaveBeenLastCalledWith('equipmentTimeline', chart);
    const point = chart.data.datasets[0].data[0];
    const target = {};
    chart.scales = { x: { getPixelForValue: value => 100 + (value - point.x) / point.widthMs * 20 }, y: { height: 100, getPixelForValue: () => 50 } };
    chart.getDatasetMeta = () => ({ data: [target] });
    chart.plugins.forEach(plugin => plugin.afterUpdate?.(chart));
    expect(chart.data.datasets[0].pointRadius).toBe(0);
    expect(target.inRange(109, 76)).toBe(true);
    expect(target.inRange(111, 50)).toBe(false);
    expect(target.inRange(100, 78)).toBe(false);
    expect(target.getRange('x')).toBe(10);
    chart.scales.x.getPixelForValue = value => 100 + (value - point.x) / point.widthMs * 40;
    expect(target.inRange(119, 50)).toBe(true);
    expect(target.inRange(121, 50)).toBe(false);
    expect(target.getRange('x')).toBe(20);
    expect(chart.options.plugins.tooltip.callbacks.title([{ datasetIndex: 0 }])).toBe('Nike Fast');
    expect(chart.options.plugins.tooltip.callbacks.label({ raw: point })).toEqual(['Activity: Morning run', 'Date: 1 Jan 2025', 'Distance: 10.0 km', 'Sport: Run']);
  });

  it('invalidates before data settings, but not palette or resize', () => {
    const h = harness();
    const tooltips = h.sandbox.window.dashboardTooltips;
    for (const [setter, value, state] of [
      ['setEquipmentMetric', 'pace', 'selectedEquipmentMetric'],
      ['setEquipmentFilter', 'Shoes', 'selectedEquipmentFilter'],
      ['setEquipmentTimelineFilter', 'Bikes', 'selectedEquipmentTimelineFilter'],
      ['setEquipmentTimelineMode', 'activities', 'selectedEquipmentTimelineMode']
    ]) {
      const previous = vm.runInContext(state, h.sandbox);
      tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext(state, h.sandbox)).toBe(previous));
      h.sandbox[setter](value, false);
    }
    expect(tooltips.invalidate).toHaveBeenCalledTimes(4);
    tooltips.invalidate.mockClear();
    h.sandbox.setEquipmentColorScheme('monochrome-blue');
    h.charts.at(-1).resize(375);
    expect(tooltips.invalidate).not.toHaveBeenCalled();
  });

  it('does not attach equipment or either timeline mode with no data', () => {
    const h = harness();
    h.sandbox.processedActivities = [];
    h.sandbox.renderEquipmentChart();
    h.sandbox.renderEquipmentTimeline();
    h.sandbox.setEquipmentTimelineMode('activities');
    expect(h.sandbox.window.dashboardTooltips.attachChart).not.toHaveBeenCalled();
  });

  it('applies mileage and timeline combinations independently with one render each', () => {
    const h = harness();
    h.sandbox.window.dashboardTabNavigation = require('../src/tab-navigation');
    h.sandbox.renderEquipmentChart = jest.fn();
    h.sandbox.renderEquipmentTimeline = jest.fn();
    const mileage = h.sandbox.getEquipmentKeyboardAdapter();
    const timeline = h.sandbox.getEquipmentTimelineKeyboardAdapter();
    mileage.applySelection([{ id: 'metric', value: 'pace' }, { id: 'category', value: 'Shoes' }]);
    expect(mileage.readSnapshot().selection.map(choice => choice.value)).toEqual(['pace', 'Shoes']);
    expect(timeline.readSnapshot().selection.map(choice => choice.value)).toEqual(['continuous', 'All']);
    expect(h.sandbox.renderEquipmentChart).toHaveBeenCalledTimes(1);
    timeline.applySelection([{ id: 'mode', value: 'activities' }, { id: 'category', value: 'Bikes' }]);
    expect(h.sandbox.renderEquipmentTimeline).toHaveBeenCalledTimes(1);
  });

  it('offers session-retained fire/blue selection only in eligible pace views, including empty views', () => {
    const h = harness();
    h.sandbox.renderEquipmentChart();
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(true);
    h.sandbox.setEquipmentMetric('pace');
    h.sandbox.setEquipmentFilter('Shoes');
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(false);
    expect(h.elements.equipmentColorScheme.value).toBe('fire');
    const original = h.charts.at(-1).data;
    h.sandbox.setEquipmentColorScheme('monochrome-blue');
    const blue = h.charts.at(-1);
    expect(blue.data.labels).toEqual(original.labels);
    expect(blue.data.datasets[0].data).toEqual(original.datasets[0].data);
    expect(blue.data.datasets[0].backgroundColor).toEqual(['#2563EB', '#2563EB']);
    for (const filter of ['All', 'Bikes', 'Shoes']) {
      h.sandbox.setEquipmentFilter(filter);
      expect(h.elements.equipmentColorScheme.value).toBe('monochrome-blue');
      expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(filter === 'All');
    }
    h.sandbox.setEquipmentMetric('count');
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(true);
    h.sandbox.setEquipmentMetric('pace');
    h.sandbox.processedActivities = [];
    h.sandbox.renderEquipmentChart();
    expect(h.elements.equipmentColorScheme.value).toBe('monochrome-blue');
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(false);
    h.sandbox.setEquipmentFilter('All');
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(true);
    h.sandbox.setEquipmentColorScheme('unsupported');
    expect(h.elements.equipmentColorScheme.value).toBe('fire');
  });

  it('builds synthetic shoe, bike and edge-case comparisons in the existing activity shape', () => {
    for (const [speeds, type] of [
      [[10, 12, 15], 'Shoes'], [[20, 25, 30], 'Bikes'], [[12], 'Shoes'],
      [[12, 12], 'Shoes'], [[29.9, 30], 'Bikes'], [[], 'Shoes'], [[NaN, -1, 0], 'Shoes']
    ]) {
      const rows = equipmentUtils.buildEquipmentPaceDisplay(equipmentUtils.aggregateEquipmentPace(comparisonActivities(speeds, type), type));
      expect(rows).toHaveLength(speeds.filter(speed => Number.isFinite(speed) && speed > 0).length);
      rows.forEach(row => expect(row.speedKmh).toBeGreaterThan(0));
    }
  });

  it('keeps wrapper, fallback and explanation inside the export capture element', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const wrapper = html.match(/<div id="equipmentChartWrapper"[^>]*>([\s\S]*?)\n          <\/div>/)[1];
    expect(wrapper).toContain('id="equipmentCanvasArea"');
    expect(wrapper).toContain('id="equipmentValueFallback"');
    expect(wrapper).toContain('id="equipmentPaceExplanation"');
    const exporter = fs.readFileSync(path.join(__dirname, '../src/dashboard-export.js'), 'utf8');
    expect(exporter).toContain("equipment: 'equipmentChartWrapper'");
  });

  it('draws full one or two line values within the right edge and keeps rows apart', () => {
    const h = harness(375);
    h.sandbox.renderEquipmentChart();
    h.draw();
    expect(h.text.length).toBeGreaterThan(0);
    expect(h.text.every(t => t.x + t.value.length * 7 <= 375 - 8)).toBe(true);
    expect(h.text.every(t => t.x >= 0)).toBe(true);
    const rows = h.text.reduce((acc, t) => {
      const row = Math.round((t.y - 50) / 56);
      (acc[row] ||= []).push(t);
      return acc;
    }, {});
    expect(Object.values(rows).every(lines => lines.length <= 2)).toBe(true);
    h.sandbox.setEquipmentMetric('count');
    h.charts.at(-1).chartArea.right = 285;
    h.draw();
    expect(h.text.some(t => t.value === 'activities')).toBe(true);
    expect(h.text.find(t => t.value === 'activities').y - h.text.find(t => t.value === '1').y).toBe(15);
    expect(h.text.every(t => t.x + t.value.length * 7 <= 367)).toBe(true);
    expect(h.elements.equipmentValueFallback.classList.contains('hidden')).toBe(true);
  });

  it('uses a complete, wrap-safe HTML value for labels too wide at 320px and clears stale values', () => {
    const h = harness(320);
    h.sandbox.processedActivities = [{ equipment: 'Nike Shoe', distance: 999999999999999, duration: 3600 }];
    h.sandbox.renderEquipmentChart();
    h.charts.at(-1).chartArea.right = 300; // Chart.js may reserve extra space for long equipment names.
    h.draw();
    expect(h.elements.equipmentValueFallback.classList.contains('hidden')).toBe(false);
    expect(h.elements.equipmentValueFallback.children[0].textContent).toContain('999999999999999.0 km');
    h.charts.at(-1).resize(1440);
    expect(h.elements.equipmentValueFallback.classList.contains('hidden')).toBe(true);
    expect(h.text.every(t => t.x + t.value.length * 7 <= 1432)).toBe(true);
    h.sandbox.processedActivities = [];
    h.sandbox.renderEquipmentChart();
    expect(h.elements.equipmentValueFallback.children).toHaveLength(0);
    expect(h.elements.equipmentValueFallback.classList.contains('hidden')).toBe(true);
  });

  it('reflows on resize and metric/filter changes without leaving old fallback or explanation', () => {
    const h = harness(320);
    h.sandbox.renderEquipmentChart();
    h.draw();
    h.charts.at(-1).resize(768);
    expect(h.text.every(t => t.x + t.value.length * 7 <= 760)).toBe(true);
    for (const metric of ['pace', 'count', 'avgLength', 'distance']) {
      h.sandbox.setEquipmentMetric(metric);
      h.draw();
      expect(h.elements.equipmentValueFallback.children).toHaveLength(0);
      expect(h.elements.equipmentPaceExplanation.classList.contains('hidden')).toBe(metric !== 'pace');
    }
  });

  it('uses per-type speed fractions, actual pace/speed labels, tooltips and percent axis in All/Shoes/Bikes', () => {
    const h = harness();
    h.sandbox.setEquipmentMetric('pace');
    for (const filter of ['All', 'Shoes', 'Bikes']) {
      h.sandbox.setEquipmentFilter(filter);
      h.draw();
      const chart = h.charts.at(-1);
      const values = Object.fromEntries(chart.data.labels.map((name, i) => [name, chart.data.datasets[0].data[i]]));
      const colors = Object.fromEntries(chart.data.labels.map((name, i) => [name, chart.data.datasets[0].backgroundColor[i]]));
      if (filter !== 'Bikes') {
        expect(values['Nike Fast']).toBe(1);
        expect(values['Asics Slow']).toBeCloseTo(2 / 3);
        expect(h.text.map(t => t.value).join(' ')).toContain('4:00 /km');
      }
      if (filter !== 'Shoes') {
        expect(values['Road Fast']).toBe(1);
        expect(values['Road Slow']).toBeCloseTo(0.5);
        expect(h.text.map(t => t.value).join(' ')).toContain('40.0 km/h');
      }
      expect(chart.options.scales.x.max).toBe(1);
      expect(chart.options.scales.x.ticks.callback(0.5)).toBe('50%');
      chart.data.labels.forEach((name, index) => {
        expect(chart.options.plugins.tooltip.callbacks.label({ dataIndex: index, label: name, raw: values[name] }))
          .toBe(name.includes('Road') ? (name === 'Road Fast' ? '40.0 km/h' : '20.0 km/h') : (name === 'Nike Fast' ? '4:00 /km' : '6:00 /km'));
      });
      expect(h.elements.equipmentPaceExplanation.textContent).toContain('100 %');
      if (filter === 'All') {
        expect(chart.data.labels.slice(0, 2)).toEqual(['Nike Fast', 'Asics Slow']);
        expect(h.elements.equipmentPaceExplanation.textContent).toContain('Shoes');
        expect(h.elements.equipmentPaceExplanation.textContent).toContain('Bikes');
        expect(colors).toEqual({
          'Nike Fast': '#8B5CF6',
          'Asics Slow': '#8B5CF6',
          'Road Fast': '#14B8A6',
          'Road Slow': '#14B8A6'
        });
      } else {
        expect(chart.bars.every(bar => bar.options.backgroundColor === h.gradients.at(-1))).toBe(true);
      }
    }
  });

  it('keeps other metrics and units unchanged', () => {
    const h = harness();
    h.sandbox.setEquipmentColorScheme('monochrome-blue');
    for (const [metric, label] of [['distance', '10.0 km'], ['count', '1 activities'], ['avgLength', '10.00 km/act']]) {
      h.sandbox.setEquipmentMetric(metric);
      h.draw();
      expect(h.text.map(t => t.value).join(' ')).toContain(label);
      expect(h.charts.at(-1).options.scales.x.max).toBeUndefined();
      expect(h.charts.at(-1).options.animation).toBeUndefined();
      expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(true);
      expect(h.charts.at(-1).data.datasets[0].backgroundColor).toEqual(
        h.charts.at(-1).data.labels.map(name => equipmentUtils.getEquipmentType(name) === 'Shoes' ? '#8B5CF6' : '#14B8A6')
      );
    }
  });

  it('settles pace immediately for export without applying its palette to the mixed view', () => {
    const h = harness();
    h.sandbox.setEquipmentMetric('pace');
    h.sandbox.setEquipmentFilter('Shoes');
    expect(h.charts.at(-1).options.animation).toBe(false);
    h.sandbox.setEquipmentColorScheme('monochrome-blue');
    h.sandbox.setEquipmentFilter('All');
    h.draw();
    expect(h.gradients).toHaveLength(0);
    expect(h.elements.equipmentColorSchemeControl.classList.contains('hidden')).toBe(true);
    expect(h.charts.at(-1).data.datasets[0].backgroundColor).toEqual(['#8B5CF6', '#8B5CF6', '#14B8A6', '#14B8A6']);
    h.sandbox.setEquipmentFilter('Shoes');
    expect(h.elements.equipmentColorScheme.value).toBe('monochrome-blue');
  });

  it.each([
    ['Shoes', [10, 12, 15]], ['Bikes', [20, 25, 30]], ['Bikes', [29.9, 30]]
  ])('draws one shared visible-range gradient for %s at %j without changing bars', (type, speeds) => {
    const h = harness();
    h.sandbox.processedActivities = comparisonActivities(speeds, type);
    h.sandbox.setEquipmentMetric('pace');
    h.sandbox.setEquipmentFilter(type);
    const chart = h.charts.at(-1);
    const originalData = JSON.stringify(chart.data);
    const originalOptions = chart.bars.map(bar => bar.options);
    h.draw();
    const gradient = h.gradients.at(-1);
    expect(h.gradients).toHaveLength(1);
    expect(gradient.coordinates).toEqual([chart.scales.x.getPixelForValue(Math.min(...speeds) / Math.max(...speeds)), 0, chart.scales.x.getPixelForValue(1), 0]);
    expect(gradient.stops).toEqual([0, 0.5, 1].map(position => [position, distributionUtils.getFireGradientColor(position)]));
    expect(chart.bars.every(bar => bar.options.backgroundColor === gradient)).toBe(true);
    expect(originalOptions.every(options => typeof options.backgroundColor === 'string')).toBe(true);
    expect(chart.bars.every(bar => bar.options.borderRadius === 6)).toBe(true);
    expect(JSON.stringify(chart.data)).toBe(originalData);
    chart.resize(375);
    expect(h.gradients).toHaveLength(2);
    expect(h.gradients.at(-1).coordinates[2]).toBe(chart.scales.x.getPixelForValue(1));
    expect(h.gradients.at(-1).coordinates[2]).not.toBe(gradient.coordinates[2]);
    h.sandbox.setEquipmentColorScheme('monochrome-blue');
    h.draw();
    expect(h.gradients).toHaveLength(2);
    expect(h.charts.at(-1).bars.every(bar => bar.options.backgroundColor === '#2563EB')).toBe(true);
  });

  it('uses yellow for equal/single values and safe geometry fallback, then recovers on redraw', () => {
    const h = harness();
    for (const speeds of [[12], [12, 12]]) {
      h.sandbox.processedActivities = comparisonActivities(speeds);
      h.sandbox.setEquipmentMetric('pace');
      h.sandbox.setEquipmentFilter('Shoes');
      h.draw();
      expect(h.gradients).toHaveLength(0);
      expect(h.charts.at(-1).bars.every(bar => bar.options.backgroundColor === '#FDE047')).toBe(true);
    }
    h.sandbox.processedActivities = comparisonActivities();
    h.sandbox.renderEquipmentChart();
    const chart = h.charts.at(-1);
    const scale = chart.scales.x;
    chart.scales.x = null;
    h.draw();
    expect(h.gradients).toHaveLength(0);
    expect(chart.bars.every(bar => bar.options.backgroundColor === '#FDE047')).toBe(true);
    chart.scales.x = scale;
    h.draw();
    expect(h.gradients).toHaveLength(1);
    chart.scales.x = { getPixelForValue: () => NaN };
    h.draw();
    expect(chart.bars.every(bar => bar.options.backgroundColor === '#FDE047')).toBe(true);
  });

  it('refreshes the range for the visible type/data and shows empty state after display validation', () => {
    const h = harness();
    h.sandbox.processedActivities = comparisonActivities().concat(comparisonActivities([20, 30], 'Bikes'));
    h.sandbox.setEquipmentMetric('pace');
    h.sandbox.setEquipmentFilter('Shoes');
    h.draw();
    expect(h.gradients.at(-1).coordinates[0]).toBeCloseTo(h.charts.at(-1).chartArea.right * 10 / 15);
    h.sandbox.setEquipmentFilter('Bikes');
    h.draw();
    expect(h.gradients.at(-1).coordinates[0]).toBeCloseTo(h.charts.at(-1).chartArea.right * 20 / 30);
    h.sandbox.processedActivities = comparisonActivities([25, 30], 'Bikes');
    h.sandbox.renderEquipmentChart();
    h.draw();
    expect(h.gradients.at(-1).coordinates[0]).toBeCloseTo(h.charts.at(-1).chartArea.right * 25 / 30);
    for (const data of [[], comparisonActivities([NaN, -1, 0], 'Bikes')]) {
      h.sandbox.processedActivities = data;
      const count = h.charts.length;
      h.sandbox.renderEquipmentChart();
      expect(h.charts).toHaveLength(count);
      expect(h.elements.equipmentEmptyState.classList.contains('hidden')).toBe(false);
      expect(h.elements.equipmentChart.classList.contains('hidden')).toBe(true);
    }
  });
});