const fs = require('fs');
const path = require('path');
const vm = require('vm');

function element(id) {
  const classes = new Set(['hidden']);
  const listeners = new Map();
  return {
    id,
    dataset: {},
    addEventListener(name, handler) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(handler); },
    removeEventListener(name, handler) { listeners.get(name)?.delete(handler); },
    dispatch(name, event = {}) { listeners.get(name)?.forEach(handler => handler({ target: this, ...event })); },
    setAttribute: jest.fn(),
    focus: jest.fn(),
    className: '',
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: (name, force) => { if (force) classes.add(name); else classes.delete(name); },
      contains: name => classes.has(name)
    }
  };
}

function harness({ realGeometry = false, inspection = false } = {}) {
  const container = element('heatmapMapContainer');
  container.style = { filter: '' };
  container.getBoundingClientRect = () => ({ left: 100, top: 50, width: 400, height: 300 });
  const tileContainer = { style: { filter: '' } };
  const tileLayer = {
    addTo() { return this; },
    getContainer() { return tileContainer; }
  };
  const emptyState = element('heatmapEmptyState');
  const tooltip = element('heatmapActivityTooltip');
  tooltip.style = {};
  tooltip.getBoundingClientRect = () => ({ width: 120, height: 80 });
  const trackCountHeading = element('heatmapActivityTooltipTrackCount');
  const activityHeading = element('heatmapActivityTooltipHeading');
  const availability = element('heatmapActivityTooltipAvailability');
  const rows = element('heatmapActivityTooltipRows');
  rows.replaceChildren = jest.fn();
  rows.appendChild = jest.fn();
  const elements = {
    heatmapMapContainer: container,
    heatmapEmptyState: emptyState,
    heatmapActivityTooltip: tooltip,
    heatmapActivityTooltipTrackCount: trackCountHeading,
    heatmapActivityTooltipHeading: activityHeading,
    heatmapActivityTooltipAvailability: availability,
    heatmapActivityTooltipRows: rows
  };
  const renders = [];
  const boundsFits = [];
  const sizeInvalidations = [];
  const mapListeners = new Map();
  const map = {
    offset: { x: 0, y: 0 },
    on(names, handler, owner) { names.split(' ').forEach(name => { if (!mapListeners.has(name)) mapListeners.set(name, []); mapListeners.get(name).push({ handler, owner }); }); },
    off(names, handler) { names.split(' ').forEach(name => mapListeners.set(name, (mapListeners.get(name) || []).filter(listener => listener.handler !== handler))); },
    emit(name) { mapListeners.get(name)?.forEach(({ handler, owner }) => handler.call(owner)); },
    getContainer: () => container,
    getPanes: () => ({ overlayPane: { appendChild() {} } }),
    getSize: () => ({ x: 400, y: 300 }),
    containerPointToLayerPoint: () => ({ x: 0, y: 0 }),
    containerPointToLatLng: point => ({ lat: point[1] - map.offset.y, lng: point[0] - map.offset.x }),
    latLngToContainerPoint: point => ({ x: point.lng + map.offset.x, y: point.lat + map.offset.y }),
    latLngToLayerPoint: point => ({ x: point[1] + map.offset.x, y: point[0] + map.offset.y }),
    getBounds: () => ({ getSouth: () => -90, getNorth: () => 90, getWest: () => -180, getEast: () => 180 }),
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
    buildActivityTooltipModel: activityIds => {
      const totalCount = Array.isArray(activityIds) ? activityIds.length : 0;
      const sampled = totalCount > 10;
      return {
        totalCount,
        sampled,
        heading: sampled ? `Random 10 of ${totalCount} activities` : `${totalCount} activities`,
        availabilityNote: null,
        activities: [{
          name: 'Test activity',
          dateLabel: '2026-01-01',
          sport: 'Run',
          distanceLabel: '5.0 km',
          durationLabel: '30:00'
        }]
      };
    },
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
      createElement: tagName => ({
        tagName,
        style: {},
        getContext: () => ({ clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, drawImage: jest.fn() }),
        className: '',
        textContent: '',
        children: [],
        append(...children) { this.children.push(...children); }
      }),
      querySelectorAll: () => []
    },
    L: {
      polyline() {},
      map: jest.fn(() => map),
      tileLayer: () => tileLayer,
      Util: { setOptions: (layer, options) => { layer.options = options; } },
      DomUtil: { create: () => sandbox.document.createElement('canvas'), setPosition() {}, remove() {} },
      Layer: { extend: definition => {
        if (!inspection) return RouteCanvasLayerStub;
        class RouteLayer {
          constructor(options) { this.initialize(options); }
          addTo(target) { this.onAdd(target); sandbox.inspectionLayer = this; return this; }
        }
        Object.assign(RouteLayer.prototype, definition);
        return RouteLayer;
      } }
    },
    console,
    requestAnimationFrame: callback => { callback(); return 1; },
    cancelAnimationFrame: jest.fn(),
    setTimeout: callback => { callback(); return 1; }
  };
  vm.createContext(sandbox);
  if (inspection) {
    sandbox.window.innerWidth = 1000;
    sandbox.window.innerHeight = 800;
    sandbox.window.tooltipSelectionUtils = require('../src/tooltip-selection-utils');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-tooltips.js'), 'utf8'), sandbox);
  }
  const stateSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8');
  const heatmapSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-heatmap.js'), 'utf8');
  vm.runInContext(`${stateSource}\n${heatmapSource}\nselectedVisualizationTab = 'heatmap'; this.heatmapTestApi = { renderHeatmap, setHeatmapSportFilter, setHeatmapColorScheme, getHeatmapKeyboardAdapter, showHeatmapActivityTooltip };`, sandbox);
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

describe('heatmap pinned inspection', () => {
  async function setup() {
    const result = harness({ realGeometry: true, inspection: true });
    jest.spyOn(result.sandbox.window.heatmapUtils, 'buildRouteSegments').mockImplementation((tracks, options) => tracks.run && options.sportFilter !== 'Bike' ? {
      run: { key: 'run', count: 14, activityIds: ['run'], coords: [[20, 20], [80, 100]] }
    } : {});
    result.setDataset({ id: 'inspection' }, { run: { sport: 'Run', points: [[20, 20], [80, 100]] } });
    await result.render();
    result.map.zoom = 12;
    result.sandbox.inspectionLayer._reset();
    result.controller = result.sandbox.window.dashboardTooltips;
    result.container = result.elements.heatmapMapContainer;
    result.sample = jest.spyOn(result.sandbox.window.heatmapUtils, 'buildActivityTooltipModel').mockImplementation(() => ({
      totalCount: 14, sampled: true, heading: 'Random 10 of 14 activities', availabilityNote: 'Partial activity details',
      activities: [{ name: 'Displayed sample', dateLabel: '2026-01-01', sport: 'Run', distanceLabel: '5 km', durationLabel: '30:00' }]
    }));
    return result;
  }

  afterEach(() => jest.restoreAllMocks());

  function click(result, start = [160, 100], end = start) {
    result.container.dispatch('pointerdown', { clientX: start[0], clientY: start[1], pointerId: 1 });
    result.container.dispatch('pointerup', { clientX: end[0], clientY: end[1], pointerId: 1 });
    result.container.dispatch('click', { clientX: end[0], clientY: end[1] });
  }

  it('pins exactly the displayed sample and reprojects its geography through pan, zoom and resize without resampling', async () => {
    const result = await setup();
    result.container.dispatch('mousemove', { clientX: 160, clientY: 100 });
    click(result);
    const pinned = result.controller.getPinned('heatmap');
    expect(pinned).not.toBeNull();
    expect(JSON.stringify(pinned.content)).toContain('Displayed sample');
    expect(JSON.stringify(pinned.content)).toContain('# of tracks: 14');
    expect(JSON.stringify(pinned.content)).toContain('Random 10 of 14 activities');
    expect(JSON.stringify(pinned.content)).toContain('Partial activity details');
    expect(pinned.anchor.geoPoint).toEqual({ lat: 50, lng: 60 });
    expect(pinned.anchor.normalizedPoint).toEqual({ x: 0.16, y: 0.125 });
    expect(pinned.anchor.capturePoint).toEqual({ x: 0.15, y: 1 / 6 });
    for (const name of ['movestart', 'zoomstart', 'mouseleave']) {
      if (name === 'mouseleave') result.container.dispatch(name); else result.map.emit(name);
      expect(result.controller.getPinned('heatmap').content).toEqual(pinned.content);
    }
    result.map.offset = { x: 500, y: 0 };
    for (const name of ['moveend', 'zoomend', 'resize']) result.map.emit(name);
    const outside = result.controller.getPinned('heatmap');
    expect(outside.anchor.visibility).toBe('outside-view');
    expect(outside.anchor.geoPoint).toEqual(pinned.anchor.geoPoint);
    expect(outside.content).toEqual(pinned.content);
    expect(outside.selectionKey).toBe(pinned.selectionKey);
    result.map.offset = { x: 40, y: 20 };
    result.map.emit('moveend');
    expect(result.controller.getPinned('heatmap').anchor).toMatchObject({ visibility: 'visible', normalizedPoint: { x: 0.2, y: 0.15 }, capturePoint: { x: 0.25, y: 70 / 300 } });
    await result.render();
    expect(result.controller.getPinned('heatmap').content).toEqual(pinned.content);
    expect(result.sample).toHaveBeenCalledTimes(1);
    const capture = result.controller.adapters.get('heatmap').snapshotCapture();
    expect(capture.canvas).not.toBe(result.sandbox.inspectionLayer._canvas);
    expect(capture.selection.content).toEqual(pinned.content);
    expect(capture.model.activities[0].name).toBe('Displayed sample');
    expect(capture.palette).toBe('blue-red');
    result.sandbox.window.innerWidth = 2000;
    result.sandbox.window.innerHeight = 1000;
    result.container.getBoundingClientRect = () => ({ left: 50, top: 25, width: 800, height: 600 });
    result.map.getSize = () => ({ x: 800, y: 600 });
    result.map.emit('resize');
    expect(result.controller.getPinned('heatmap').anchor).toMatchObject({ normalizedPoint: { x: 0.075, y: 0.095 }, capturePoint: { x: 0.125, y: 70 / 600 } });
    expect(result.controller.getPinned('heatmap').content).toEqual(pinned.content);
    expect(capture.selection.anchor.capturePoint).toEqual({ x: 0.25, y: 70 / 300 });
    result.controller.dismiss();
    result.container.dispatch('mousemove', { clientX: 150, clientY: 95 });
    expect(result.controller.getState()?.mode).toBe('transient');
    expect(result.sample).toHaveBeenCalledTimes(1);
  });

  it('selects by touch without hover but rejects moved, cancelled and map-drag gestures', async () => {
    const result = await setup();
    click(result, [140, 90], [160, 100]);
    expect(result.controller.getPinned('heatmap')).toBeNull();
    result.container.dispatch('pointerdown', { clientX: 160, clientY: 100 });
    result.container.dispatch('pointercancel');
    result.container.dispatch('click', { clientX: 160, clientY: 100 });
    expect(result.controller.getPinned('heatmap')).toBeNull();
    result.container.dispatch('pointerdown', { clientX: 160, clientY: 100 });
    result.map.emit('movestart');
    result.container.dispatch('pointerup', { clientX: 160, clientY: 100 });
    result.container.dispatch('click', { clientX: 160, clientY: 100 });
    expect(result.controller.getPinned('heatmap')).toBeNull();
    result.container.dispatch('pointerdown', { clientX: 160, clientY: 100 });
    result.container.dispatch('pointermove', { clientX: 190, clientY: 120 });
    result.container.dispatch('pointerup', { clientX: 160, clientY: 100 });
    result.container.dispatch('click', { clientX: 160, clientY: 100 });
    expect(result.controller.getPinned('heatmap')).toBeNull();
    click(result);
    expect(result.controller.getPinned('heatmap')).not.toBeNull();
    expect(result.sample).toHaveBeenCalledTimes(1);
  });

  it('keeps Leaflet keys until Enter starts inspection and releases them on Escape', async () => {
    const result = await setup();
    const event = key => ({ key, preventDefault: jest.fn(), stopPropagation: jest.fn() });
    const before = event('ArrowRight');
    result.container.dispatch('keydown', before);
    expect(before.preventDefault).not.toHaveBeenCalled();
    result.container.dispatch('keydown', event('Enter'));
    expect(result.controller.getPinned('heatmap')).not.toBeNull();
    const during = event('ArrowRight');
    result.container.dispatch('keydown', during);
    expect(during.preventDefault).toHaveBeenCalled();
    expect(result.controller.getPinned('heatmap')).not.toBeNull();
    result.container.dispatch('keydown', event('Escape'));
    expect(result.controller.getPinned('heatmap')).toBeNull();
    const after = event('ArrowLeft');
    result.container.dispatch('keydown', after);
    expect(after.preventDefault).not.toHaveBeenCalled();
    result.sandbox.inspectionLayer.onRemove(result.map);
    result.container.dispatch('keydown', event('Enter'));
    expect(result.controller.getPinned('heatmap')).toBeNull();
  });

  it('invalidates before committing changed sport, palette or dataset, but not unchanged renders', async () => {
    const result = await setup();
    click(result);
    const invalidate = jest.spyOn(result.controller, 'invalidate');
    const beforeCommit = [];
    const originalInvalidate = invalidate.getMockImplementation();
    invalidate.mockImplementation(() => {
      beforeCommit.push(vm.runInContext('({ sport: selectedHeatmapSportFilter, palette: selectedHeatmapColorScheme })', result.sandbox));
      originalInvalidate();
    });
    await result.filter('All');
    expect(invalidate).not.toHaveBeenCalled();
    await result.filter('Bike');
    expect(result.controller.getPinned('heatmap')).toBeNull();
    expect(invalidate).toHaveBeenCalledTimes(1);
    await result.setScheme('blue');
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(beforeCommit).toEqual([{ sport: 'All', palette: 'blue-red' }, { sport: 'Bike', palette: 'blue-red' }]);
    result.setDataset({ id: 'replacement' }, {});
    await result.render();
    expect(invalidate).toHaveBeenCalledTimes(3);
    vm.runInContext('advanceDashboardRevision(true);', result.sandbox);
    await result.render();
    expect(invalidate).toHaveBeenCalledTimes(5);
  });
});

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

  it('shows the track count only above ten and clears it when hovering a smaller segment', () => {
    const h = harness();
    const showTooltip = h.sandbox.heatmapTestApi.showHeatmapActivityTooltip;
    const mapRect = { width: 400, height: 300 };
    const point = [20, 20];
    const activityIds = count => Array.from({ length: count }, (_, index) => String(index));

    showTooltip({ key: 'eleven-tracks', activityIds: activityIds(11) }, point, mapRect);
    expect(h.elements.heatmapActivityTooltipTrackCount.textContent).toBe('# of tracks: 11');
    expect(h.elements.heatmapActivityTooltipTrackCount.classList.contains('hidden')).toBe(false);
    expect(h.elements.heatmapActivityTooltipHeading.textContent).toBe('Random 10 of 11 activities');
    expect(h.elements.heatmapActivityTooltipHeading.classList.contains('hidden')).toBe(false);
    expect(h.elements.heatmapActivityTooltipRows.appendChild).toHaveBeenCalledTimes(1);
    expect(h.elements.heatmapActivityTooltipRows.appendChild.mock.calls[0][0].children.map(child => child.textContent)).toEqual([
      'Test activity',
      '2026-01-01 · Run · 5.0 km · 30:00'
    ]);

    showTooltip({ key: 'ten-tracks', activityIds: activityIds(10) }, point, mapRect);
    expect(h.elements.heatmapActivityTooltipTrackCount.textContent).toBe('');
    expect(h.elements.heatmapActivityTooltipTrackCount.classList.contains('hidden')).toBe(true);
    expect(h.elements.heatmapActivityTooltipHeading.textContent).toBe('');
    expect(h.elements.heatmapActivityTooltipHeading.classList.contains('hidden')).toBe(true);
    expect(h.elements.heatmapActivityTooltipRows.appendChild).toHaveBeenCalledTimes(2);
  });
});
