const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeContext(overrides = {}) {
  return { tabId: 'totalDistance', datasetRevision: 1, viewRevision: 1, renderGeneration: 1, settings: { sport: 'All' }, ...overrides };
}

function makeSelection(overrides = {}) {
  return {
    selectionKey: 'totalDistance:period:2026-10',
    context: makeContext(),
    content: {
      title: 'October 2026', itemLabel: 'October 2026',
      sections: [{ heading: 'Distance', rows: [{ label: 'Run', value: '12 km' }, { label: 'Swim', value: 'n/a' }] }],
      footerLines: ['Total: 12 km'], notes: ['Synthetic activity data']
    },
    anchor: { kind: 'chart-item', itemId: '2026-10', normalizedPoint: { x: 0.5, y: 0.4 }, visibility: 'visible', associationLabel: 'October 2026' },
    ...overrides
  };
}

function makeDocument() {
  const elements = new Map();
  function createElement(tagName) {
    const listeners = new Map();
    const classes = new Set();
    const canvasContext = { drawImage: jest.fn() };
    return {
      getContext: () => canvasContext,
      tagName: tagName.toUpperCase(), style: {}, dataset: {}, children: [], attributes: {}, textContent: '',
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle(name, force) { const enabled = force === undefined ? !classes.has(name) : force; enabled ? classes.add(name) : classes.delete(name); return enabled; }
      },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name] ?? null; },
      appendChild(child) { this.children.push(child); child.parentNode = this; if (child.id) elements.set(child.id, child); return child; },
      replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); if (this.id) elements.delete(this.id); },
      addEventListener(name, handler) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(handler); },
      removeEventListener(name, handler) { listeners.get(name)?.delete(handler); },
      dispatchEvent(event) { for (const handler of listeners.get(event.type) || []) handler(event); },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400, right: 800, bottom: 400 }),
      focus() { document.activeElement = this; },
      contains(target) { return target === this || this.children.some(child => child.contains?.(target)); }
    };
  }
  const document = { createElement, getElementById: id => elements.get(id) || null, activeElement: null };
  document.body = createElement('body');
  return document;
}

test('synthetic fixtures retain groups, unavailable values, notes and independent contexts', () => {
  const first = makeSelection();
  const second = makeSelection({ context: makeContext({ datasetRevision: 2 }) });
  expect(first.content.sections[0].rows).toHaveLength(2);
  expect(first.content.sections[0].rows[1].value).toBe('n/a');
  expect(second.context.datasetRevision).not.toBe(first.context.datasetRevision);
  const document = makeDocument();
  const button = document.createElement('button');
  const handler = jest.fn();
  button.addEventListener('click', handler);
  button.dispatchEvent({ type: 'click' });
  expect(handler).toHaveBeenCalledTimes(1);
});

function makeController() {
  const document = makeDocument();
  const window = { document, tooltipSelectionUtils: require('../src/tooltip-selection-utils'), innerWidth: 360, innerHeight: 640 };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-tooltips.js'), 'utf8'), { window, Map });
  return { document, window, controller: window.dashboardTooltips.createController({ document }) };
}

test('registry is lazy, rejects unknown views and disposes replaced adapters', () => {
  const { controller } = makeController();
  const dispose = jest.fn();
  controller.registerAdapter('totalDistance', { dispose });
  controller.registerAdapter('totalDistance', {});
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(() => controller.registerAdapter('unknown', {})).toThrow('Unknown visualization');
});

test('private chart capture disables native tooltips and leaves the live configuration unchanged', () => {
  const { window, document } = makeController();
  const destroy = jest.fn();
  window.Chart = jest.fn(function () { this.setDatasetVisibility = jest.fn(); this.update = jest.fn(); this.destroy = destroy; });
  const chart = {
    canvas: document.createElement('canvas'), width: 800, height: 400,
    data: { labels: ['October'], datasets: [{ label: 'Run', data: [12] }] },
    config: { type: 'bar', plugins: [], options: { plugins: { tooltip: { enabled: true } } } },
    options: { interaction: { mode: 'index' } }, getElementsAtEventForMode: () => [],
    isDatasetVisible: () => true, update: jest.fn()
  };
  window.dashboardTooltips.attachChart('totalDistance', chart);
  const snapshot = window.dashboardTooltips.adapters.get('totalDistance').snapshotCapture();
  expect(window.Chart.mock.calls[0][1].options.plugins.tooltip.enabled).toBe(false);
  expect(chart.config.options.plugins.tooltip.enabled).toBe(true);
  expect(snapshot.sourceCanvas).toBe(chart.canvas);
  expect(snapshot.canvas).not.toBe(chart.canvas);
  expect(destroy).toHaveBeenCalledTimes(1);
});

test('private chart capture falls back to visible wrapper dimensions when Chart.js reports zero size', () => {
  const { window, document } = makeController();
  window.Chart = jest.fn(function () { this.setDatasetVisibility = jest.fn(); this.update = jest.fn(); this.destroy = jest.fn(); });
  const wrapper = document.createElement('div');
  wrapper.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 400, right: 800, bottom: 400 });
  const canvas = document.createElement('canvas');
  canvas.width = 0;
  canvas.height = 0;
  canvas.parentElement = wrapper;
  const chart = {
    canvas, width: 0, height: 0,
    data: { labels: ['October'], datasets: [{ label: 'Run', data: [12] }] },
    config: { type: 'bar', plugins: [], options: { plugins: { tooltip: { enabled: true } } } },
    options: { interaction: { mode: 'index' } }, getElementsAtEventForMode: () => [],
    isDatasetVisible: () => true, update: jest.fn()
  };
  window.dashboardTooltips.attachChart('totalDistance', chart);

  const snapshot = window.dashboardTooltips.adapters.get('totalDistance').snapshotCapture();

  expect(window.Chart.mock.calls[0][0]).toMatchObject({ width: 800, height: 400 });
  expect(snapshot.canvas.width).toBe(800);
  expect(snapshot.canvas.height).toBe(400);
  expect(chart.canvas).toMatchObject({ width: 0, height: 0 });
});

test('private chart export snapshot applies fixed bounds and minimum axis/legend fonts only to the copy', () => {
  const { window, document } = makeController();
  window.Chart = jest.fn(function () { this.setDatasetVisibility = jest.fn(); this.update = jest.fn(); this.destroy = jest.fn(); });
  const chart = {
    canvas: document.createElement('canvas'), width: 800, height: 400,
    data: { labels: ['One'], datasets: [{ label: 'Run', data: [1] }] },
    config: {
      type: 'bar', plugins: [], options: {
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 12 } }, title: { display: true, color: '#94a3b8', font: { size: 14 } } },
          y: { ticks: { color: '#94a3b8', font: { size: 11 } }, title: { display: true, color: '#94a3b8', font: { size: 12 } } }
        },
        plugins: { tooltip: { enabled: true }, legend: { labels: { font: { size: 10 } } } }
      }
    },
    options: { interaction: { mode: 'index' } }, getElementsAtEventForMode: () => [],
    isDatasetVisible: () => true, update: jest.fn()
  };
  window.dashboardTooltips.attachChart('totalDistance', chart);
  const originalData = JSON.parse(JSON.stringify(chart.data));

  window.dashboardTooltips.adapters.get('totalDistance').snapshotCapture({ width: 960, height: 500, minFontSize: 30, axisTextColor: '#f8fafc' });

  const [canvas, config] = window.Chart.mock.calls[0];
  expect(canvas).toMatchObject({ width: 960, height: 500 });
  expect(config.options.scales.x.ticks.font.size).toBe(30);
  expect(config.options.scales.x.ticks.color).toBe('#f8fafc');
  expect(config.options.scales.x.title.font.size).toBe(30);
  expect(config.options.scales.x.title.color).toBe('#f8fafc');
  expect(config.options.scales.y.ticks.font.size).toBe(30);
  expect(config.options.scales.y.ticks.color).toBe('#f8fafc');
  expect(config.options.scales.y.title.font.size).toBe(30);
  expect(config.options.scales.y.title.color).toBe('#f8fafc');
  expect(config.options.plugins.legend.labels.font.size).toBe(30);
  expect(chart.config.options.scales.x.ticks.font.size).toBe(12);
  expect(chart.config.options.scales.x.ticks.color).toBe('#94a3b8');
  expect(chart.config.options.scales.y.title.color).toBe('#94a3b8');
  expect(chart.config.options.plugins.legend.labels.font.size).toBe(10);
  expect(chart.data).toEqual(originalData);
});

test('pin stays visible after leave and hover, toggles, replaces and dismisses safely', () => {
  const { controller, document } = makeController();
  controller.show('totalDistance', makeSelection(), true);
  expect(controller.getState().mode).toBe('pinned');
  controller.send({ type: 'leave' });
  controller.show('totalDistance', makeSelection({ selectionKey: 'other' }));
  expect(controller.getState().selectionKey).toBe('totalDistance:period:2026-10');
  expect(document.getElementById('pinnedVisualizationTooltip')).not.toBeNull();
  controller.show('totalDistance', makeSelection({ selectionKey: 'other' }), true);
  expect(controller.getState().selectionKey).toBe('other');
  controller.show('totalDistance', makeSelection({ selectionKey: 'other' }), true);
  expect(controller.getState()).toBeNull();
  expect(document.getElementById('pinnedVisualizationTooltip')).toBeNull();
});

test('pins have no timer expiry and invalidation clears exportable state', () => {
  jest.useFakeTimers();
  const { controller } = makeController();
  controller.show('totalDistance', makeSelection(), true);
  jest.advanceTimersByTime(30000);
  expect(controller.getPinned('totalDistance').content.notes).toEqual(['Synthetic activity data']);
  expect(controller.getPinned('heatmap')).toBeNull();
  controller.invalidate();
  expect(controller.getPinned('totalDistance')).toBeNull();
  jest.useRealTimers();
});

test('data revision and import reset hooks clear pins before replacing data', () => {
  const invalidate = jest.fn();
  const context = { window: { dashboardTooltips: { invalidate } }, Map };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8'), context);
  vm.runInContext('advanceDashboardRevision(true)', context);
  expect(invalidate).toHaveBeenCalledTimes(1);
  const source = fs.readFileSync(path.join(__dirname, '../src/dashboard-import.js'), 'utf8');
  expect(source.indexOf('window.dashboardTooltips?.invalidate();', source.indexOf('function applyImportedDataset'))).toBeLessThan(source.indexOf('importedDataset.mediaLibrary.release();'));
});

test.each(require('../src/tooltip-selection-utils').TAB_IDS)('%s uses the shared replacement, dismissal and teardown contract', tabId => {
  const { controller, document } = makeController();
  const dispose = jest.fn();
  controller.registerAdapter(tabId, { readContext: () => controller.readContext(tabId), dispose });
  controller.show(tabId, makeSelection({ selectionKey: `${tabId}:one` }), true);
  expect(controller.getPinned(tabId).selectionKey).toBe(`${tabId}:one`);
  controller.show(tabId, makeSelection({ selectionKey: `${tabId}:two` }), true);
  expect(controller.getPinned(tabId).selectionKey).toBe(`${tabId}:two`);
  controller.send({ type: 'leave' });
  expect(document.getElementById('pinnedVisualizationTooltip')).not.toBeNull();
  controller.dispose();
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(controller.getState()).toBeNull();
  expect(document.getElementById('pinnedVisualizationTooltip')).toBeNull();
});