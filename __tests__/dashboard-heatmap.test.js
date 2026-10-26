const fs = require('fs');
const path = require('path');
const vm = require('vm');

function element(id) {
  const classes = new Set(['hidden']);
  return {
    id,
    className: '',
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: (name, force) => { if (force) classes.add(name); else classes.delete(name); },
      contains: name => classes.has(name)
    }
  };
}

function harness({ realGeometry = false } = {}) {
  const container = element('heatmapMapContainer');
  container.style = { filter: '' };
  const tileContainer = { style: { filter: '' } };
  const tileLayer = {
    addTo() { return this; },
    getContainer() { return tileContainer; }
  };
  const emptyState = element('heatmapEmptyState');
  const elements = { heatmapMapContainer: container, heatmapEmptyState: emptyState };
  const renders = [];
  const boundsFits = [];
  const sizeInvalidations = [];
  const map = {
    center: [12, 34],
    zoom: 8,
    getCenter() { return this.center; },
    getZoom() { return this.zoom; },
    fitBounds(bounds, options) {
      boundsFits.push({ bounds, options });
      this.center = [0, 0];
      this.zoom = 2;
      return this;
    },
    invalidateSize(options) { sizeInvalidations.push(options); return this; }
  };

  const heatmapUtils = realGeometry ? require('../src/heatmap-utils') : {
    hasGpsData: tracks => Object.keys(tracks || {}).length > 0,
    buildRouteSegments: (tracks, { sportFilter }) => Object.fromEntries(
      Object.entries(tracks || {})
        .filter(([, sport]) => sportFilter === 'All' || sport === sportFilter)
        .map(([id, sport]) => [id, { key: id, sport, count: 1 }])
    ),
    computeRouteFrequencyScale: segments => ({ count: Object.keys(segments).length }),
    computeRouteSegmentBounds: segments => Object.keys(segments).length ? ['bounds', Object.keys(segments)] : null,
    buildFrequencyScaleGuide: () => ({ visible: false }),
    sortSegmentsForDrawOrder: segments => segments
  };

  class RouteCanvasLayerStub {
    addTo() { return this; }
    setSegments(segments, scale, scheme) { renders.push({ segments, scale, scheme }); return this; }
  }

  const sandbox = {
    window: { heatmapUtils },
    document: {
      getElementById: id => elements[id] || null,
      querySelectorAll: () => []
    },
    L: {
      polyline() {},
      map: jest.fn(() => map),
      tileLayer: () => tileLayer,
      Layer: { extend: () => RouteCanvasLayerStub }
    },
    console,
    setTimeout: callback => { callback(); return 1; }
  };
  vm.createContext(sandbox);
  const stateSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8');
  const heatmapSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-heatmap.js'), 'utf8');
  vm.runInContext(`${stateSource}\n${heatmapSource}\nselectedVisualizationTab = 'heatmap'; this.heatmapTestApi = { renderHeatmap, setHeatmapSportFilter, setHeatmapColorScheme, getHeatmapKeyboardAdapter };`, sandbox);
  const api = sandbox.heatmapTestApi;

  function setDataset(dataset, tracks) {
    sandbox.datasetForTest = dataset;
    sandbox.tracksForTest = tracks;
    vm.runInContext('importedDataset = datasetForTest; gpsTracksByActivityId = tracksForTest;', sandbox);
  }

  async function render() {
    await api.renderHeatmap();
  }

  async function filter(sport) {
    api.setHeatmapSportFilter(sport);
    await Promise.resolve();
    await Promise.resolve();
  }

  async function setScheme(scheme) {
    api.setHeatmapColorScheme(scheme);
    await Promise.resolve();
    await Promise.resolve();
  }

  return { sandbox, map, elements, renders, boundsFits, sizeInvalidations, tileContainer, setDataset, render, filter, setScheme };
}

describe('heatmap viewport lifecycle', () => {
  it('exposes sport and palette as keyboard dimensions and renders one final selection', async () => {
    const h = harness();
    h.sandbox.window.dashboardTabNavigation = require('../src/tab-navigation');
    h.setDataset({ id: 'keyboard' }, { run1: 'Run', bike1: 'Bike' });
    const adapter = h.sandbox.getHeatmapKeyboardAdapter();
    expect(adapter.readSnapshot().selection).toEqual([
      { id: 'sport', value: 'All' },
      { id: 'palette', value: 'blue-red' }
    ]);
    adapter.applySelection([{ id: 'sport', value: 'Bike' }, { id: 'palette', value: 'yellow-red' }]);
    await Promise.resolve();
    await Promise.resolve();
    expect(h.renders).toHaveLength(1);
    expect(Object.keys(h.renders[0].segments)).toEqual(['bike1']);
    expect(h.renders[0].scheme).toBe('yellow-red');
  });

  it('retains the selected palette through sport changes and rerenders', async () => {
    const h = harness();
    h.setDataset({ id: 'palette-state' }, { run1: 'Run', bike1: 'Bike' });

    await h.render();
    h.map.center = [40.7128, -74.006];
    h.map.zoom = 13;
    await h.setScheme('blue');
    expect(h.renders.at(-1).scheme).toBe('blue');
    expect(h.map.getCenter()).toEqual([40.7128, -74.006]);
    expect(h.map.getZoom()).toBe(13);
    await h.filter('Bike');
    expect(h.renders.at(-1).scheme).toBe('blue');
    expect(Object.keys(h.renders.at(-1).segments)).toEqual(['bike1']);
    expect(h.map.getCenter()).toEqual([40.7128, -74.006]);
    expect(h.map.getZoom()).toBe(13);
  });

  it('darkens only the tile layer for Black + Fire and restores standard tiles for other schemes', async () => {
    const h = harness();
    h.setDataset({ id: 'dark-map' }, { run1: 'Run' });

    await h.render();
    expect(h.tileContainer.style.filter).toBe('');
    await h.setScheme('black-fire');
    expect(h.tileContainer.style.filter).toBe('invert(1) hue-rotate(180deg) brightness(0.8)');
    expect(h.elements.heatmapMapContainer.style.filter).toBe('');
    expect(h.renders.at(-1).scheme).toBe('black-fire');

    await h.setScheme('yellow-red');
    expect(h.tileContainer.style.filter).toBe('');
    expect(h.renders.at(-1).scheme).toBe('yellow-red');
  });

  it('discards a delayed map load after an explicitly simulated tab revision', async () => {
    const h = harness();
    h.setDataset({ id: 'delayed' }, { run1: 'Run' });
    let finishLoad;
    h.sandbox.ensureLeafletLoaded = () => new Promise(resolve => { finishLoad = resolve; });
    const pending = h.render();
    vm.runInContext("selectedVisualizationTab = 'equipment'; advanceDashboardRevision();", h.sandbox);
    finishLoad();
    await pending;
    expect(h.renders).toHaveLength(0);
    expect(h.boundsFits).toHaveLength(0);
  });

  it('discards a delayed map load after an explicitly simulated tab revision', async () => {
    const h = harness();
    h.setDataset({ id: 'delayed' }, { run1: 'Run' });
    let finishLoad;
    h.sandbox.ensureLeafletLoaded = () => new Promise(resolve => { finishLoad = resolve; });
    const pending = h.render();
    vm.runInContext("selectedVisualizationTab = 'equipment'; advanceDashboardRevision();", h.sandbox);
    finishLoad();
    await pending;
    expect(h.renders).toHaveLength(0);
    expect(h.boundsFits).toHaveLength(0);
  });

  it.each([false, true])('shows Swim routes and hides empty filtered maps (mixed=%s)', async mixed => {
    const h = harness({ realGeometry: true });
    const tracks = { swim: { sport: 'Swim', points: [[48, 11], [48.001, 11.002]] } };
    if (mixed) tracks.run = { sport: 'Run', points: [[49, 12], [49.001, 12.002]] };
    h.setDataset({ id: 'swim-history' }, tracks);
    await h.render();
    await h.filter('Swim');
    expect([...new Set(Object.values(h.renders.at(-1).segments).flatMap(segment => segment.activityIds))]).toEqual(['swim']);
    expect(h.elements.heatmapMapContainer.classList.contains('hidden')).toBe(false);
    expect(h.elements.heatmapEmptyState.classList.contains('hidden')).toBe(true);
    await h.filter('Bike');
    expect(h.elements.heatmapMapContainer.classList.contains('hidden')).toBe(true);
    expect(h.elements.heatmapEmptyState.classList.contains('hidden')).toBe(false);
    await h.filter('Swim');
    h.setDataset({ id: 'pool' }, { pool: { sport: 'Swim', points: [[48, 11]] } });
    await h.render();
    expect(h.elements.heatmapEmptyState.classList.contains('hidden')).toBe(false);
  });

  it('fits a dataset once, then preserves center and zoom through sport filters and Heatmap tab renders', async () => {
    const h = harness();
    h.setDataset({ id: 'first' }, { run1: 'Run', bike1: 'Bike' });

    await h.render();
    expect(h.boundsFits).toHaveLength(1);
    expect(h.map.getCenter()).toEqual([0, 0]);
    expect(h.map.getZoom()).toBe(2);

    h.map.center = [40.7128, -74.006];
    h.map.zoom = 13;
    await h.filter('Bike');
    expect(Object.keys(h.renders.at(-1).segments)).toEqual(['bike1']);
    expect(h.boundsFits).toHaveLength(1);
    expect(h.map.getCenter()).toEqual([40.7128, -74.006]);
    expect(h.map.getZoom()).toBe(13);

    await h.filter('Run');
    await h.render(); // Reopening the Heatmap tab renders the same dataset again.
    expect(Object.keys(h.renders.at(-1).segments)).toEqual(['run1']);
    expect(h.boundsFits).toHaveLength(1);
    expect(h.map.getCenter()).toEqual([40.7128, -74.006]);
    expect(h.map.getZoom()).toBe(13);
  });

  it('retains an empty-filter viewport and fits a replacement dataset once when routes first become available', async () => {
    const h = harness();
    h.setDataset({ id: 'first' }, { run1: 'Run' });
    await h.render();
    h.map.center = [51.5072, -0.1276];
    h.map.zoom = 12;

    await h.filter('Swim');
    expect(h.elements.heatmapMapContainer.classList.contains('hidden')).toBe(true);
    expect(h.elements.heatmapEmptyState.classList.contains('hidden')).toBe(false);
    expect(h.map.getCenter()).toEqual([51.5072, -0.1276]);
    expect(h.map.getZoom()).toBe(12);
    expect(h.boundsFits).toHaveLength(1);

    await h.filter('Run');
    expect(h.elements.heatmapMapContainer.classList.contains('hidden')).toBe(false);
    expect(h.map.getCenter()).toEqual([51.5072, -0.1276]);
    expect(h.map.getZoom()).toBe(12);
    expect(h.sizeInvalidations.at(-1)).toEqual({ pan: false });
    expect(h.boundsFits).toHaveLength(1);

    h.setDataset({ id: 'replacement' }, { bike2: 'Bike' });
    await h.filter('Swim'); // The replacement dataset has no routes for this filter yet.
    expect(h.boundsFits).toHaveLength(1);
    await h.filter('Bike'); // Its first usable route result receives the pending initial fit.
    expect(h.boundsFits).toHaveLength(2);
    expect(h.boundsFits.at(-1).bounds).toEqual(['bounds', ['bike2']]);
    expect(h.map.getCenter()).toEqual([0, 0]);
    expect(h.map.getZoom()).toBe(2);

    h.map.center = [35.6762, 139.6503];
    h.map.zoom = 14;
    await h.filter('Bike'); // Selecting the already-active filter is also a rerender.
    expect(h.boundsFits).toHaveLength(2);
    expect(h.map.getCenter()).toEqual([35.6762, 139.6503]);
    expect(h.map.getZoom()).toBe(14);
  });
});
