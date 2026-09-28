const fs = require('fs');
const path = require('path');
const vm = require('vm');
const equipmentUtils = require('../src/equipment-utils');

const activities = [
  { equipment: 'Nike Fast', distance: 10, duration: 2400 },
  { equipment: 'Asics Slow', distance: 10, duration: 3600 },
  { equipment: 'Road Fast', distance: 40, duration: 3600 },
  { equipment: 'Road Slow', distance: 40, duration: 7200 }
];

function element(id) {
  const classes = new Set(['hidden']);
  return {
    id, style: {}, children: [], textContent: '',
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
    'equipmentEmptyState', 'equipmentValueFallback', 'equipmentPaceExplanation'
  ].map(id => [id, element(id)]));
  const text = [];
  const ctx = {
    save() {}, restore() {},
    measureText: value => ({ width: String(value).length * 7 }),
    fillText: (value, x, y) => text.push({ value, x, y })
  };
  elements.equipmentCanvasArea.clientWidth = width;
  elements.equipmentChart.getContext = () => ctx;
  const charts = [];
  class Chart {
    constructor(context, config) {
      this.ctx = context;
      this.data = config.data;
      this.options = config.options;
      this.plugins = config.plugins;
      this.width = width;
      this.chartArea = { left: 0, right: width - config.options.layout.padding.right };
      this.destroy = jest.fn();
      charts.push(this);
    }
    getDatasetMeta() {
      return { data: this.data.labels.map((_, i) => ({ x: this.chartArea.right, y: 50 + i * 56 })) };
    }
    draw() { this.plugins[0].afterDatasetsDraw(this); }
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
    window: { equipmentUtils }, Chart,
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
  return { sandbox, elements, charts, text, draw: () => { text.length = 0; charts.at(-1).draw(); } };
}

describe('equipment chart', () => {
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
      }
    }
  });

  it('keeps other metrics and units unchanged', () => {
    const h = harness();
    for (const [metric, label] of [['distance', '10.0 km'], ['count', '1 activities'], ['avgLength', '10.00 km/act']]) {
      h.sandbox.setEquipmentMetric(metric);
      h.draw();
      expect(h.text.map(t => t.value).join(' ')).toContain(label);
      expect(h.charts.at(-1).options.scales.x.max).toBeUndefined();
    }
  });
});