const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dashboardTabs = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-tabs.js'), 'utf8');
const wordcloudDashboard = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-wordcloud.js'), 'utf8');
const dashboardExport = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-export.js'), 'utf8');

describe('Wordcloud dashboard contract', () => {
  it('pins real frequencies through cloud hits and independent ranked-list buttons', () => {
    const nodes = new Map();
    const canvasContext = { fillText: jest.fn(), measureText: () => ({ width: 50 }), getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 100, f: 80 }) };
    const makeNode = tag => ({ tag, value: '50', style: {}, children: [], listeners: {},
      getContext: () => canvasContext,
      parentElement: { clientWidth: 640 }, classList: { contains: () => false, toggle() {} },
      append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; }, setAttribute(name, value) { this[name] = value; },
      getBoundingClientRect: () => ({ left: 40, top: 60, width: 640, height: 400 }),
      addEventListener(type, handler) { this.listeners[type] = handler; }, removeEventListener() {} });
    const api = { registerAdapter: jest.fn(), readContext: jest.fn(() => ({ tabId: 'wordcloud' })),
      show: jest.fn(), send: jest.fn(), invalidate: jest.fn(), refreshAnchor: jest.fn(), getPinned: jest.fn() };
    const WordCloud = jest.fn();
    WordCloud.isSupported = true;
    const context = vm.createContext({ window: { dashboardTooltips: api, wordcloudUtils: require('../src/wordcloud-utils'),
      WordCloud, addEventListener() {}, innerWidth: 1000, innerHeight: 800 },
      document: { createElement: makeNode, getElementById(id) { if (!nodes.has(id)) nodes.set(id, makeNode('div')); return nodes.get(id); } },
      processedActivities: [{ name: 'Alpha Alpha Bravo' }], Map, Set });
    vm.runInContext(wordcloudDashboard, context);
    context.window.renderWordcloud();
    expect(api.registerAdapter).toHaveBeenCalledWith('wordcloud', expect.objectContaining({ dispose: expect.any(Function) }));
    const options = WordCloud.mock.calls[0][1];
    canvasContext.fillText('alpha', 10, 20);
    options.click(['alpha', 0.2], { x: 10, y: 20, w: 30, h: 10 }, { clientX: 70, clientY: 90 });
    expect(api.show).toHaveBeenLastCalledWith('wordcloud', expect.objectContaining({ selectionKey: 'wordcloud:alpha',
      content: expect.objectContaining({ sections: [{ heading: '', rows: [{ label: 'Occurrences', value: '2' }] }] }) }), true, expect.anything());
    const adapter = api.registerAdapter.mock.calls[0][1];
    const selected = api.show.mock.calls.at(-1)[1];
    expect(adapter.projectAnchor(selected).normalizedPoint).toEqual(selected.anchor.normalizedPoint);
    const exportAnchor = adapter.snapshotCapture(selected).resolveExportAnchor();
    expect(exportAnchor.capturePoint.x).toBeCloseTo(135 / nodes.get('wordcloudCanvas').width);
    expect(exportAnchor.capturePoint.y).toBeCloseTo(100 / nodes.get('wordcloudCanvas').height);
    expect(adapter.snapshotCapture({ ...selected, anchor: { ...selected.anchor, itemId: 'absent' } }).resolveExportAnchor().visibility).toBe('not-in-export');
    options.hover(null);
    expect(api.send).toHaveBeenCalledWith({ type: 'leave' });
    const row = nodes.get('wordcloudWordList').children[0];
    const pin = row.children.find(child => child.tag === 'button');
    expect(pin['aria-label']).toBe('Pin details for alpha');
    pin.listeners.click();
    expect(api.show.mock.calls.at(-1)[2]).toBe(true);
    api.invalidate.mockClear();
    context.window.renderWordcloud();
    expect(api.invalidate).not.toHaveBeenCalled();
    row.children[0].children[0].listeners.change();
    expect(api.invalidate).toHaveBeenCalled();
    adapter.dispose();
    api.show.mockClear();
    options.click(['alpha', 0.1]);
    pin.listeners.click();
    expect(api.show).not.toHaveBeenCalled();
  });

  it('provides keyboard SVG record targets and date-key calendar activation', () => {
    const calendar = fs.readFileSync(path.join(ROOT, 'src/dashboard-training-calendar.js'), 'utf8');
    const power = fs.readFileSync(path.join(ROOT, 'src/dashboard-power-pb.js'), 'utf8');
    expect(calendar).toContain('pinTrainingCalendarDayByKey');
    expect(calendar).toContain("kind: 'calendar-day'");
    expect(power).toContain("kind: 'svg-item'");
    expect(power).toContain("'keydown'");
    expect(power).toContain("'data-tooltip-inspector'");
  });

  it('pins full SVG record details from keyboard and keeps overview/detail identities aligned', () => {
    const nodes = new Map();
    const createNode = tag => ({ tag, style: {}, attributes: {}, listeners: {}, children: [],
      classList: { add: jest.fn(), remove() {} }, setAttribute(name, value) { this.attributes[name] = value; },
      appendChild(child) { this.children.push(child); return child; },
      addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }, removeEventListener() {},
      getBoundingClientRect: () => ({ left: 40, top: 60, width: 20, height: 20 }) });
    const api = { registerAdapter: jest.fn(), readContext: jest.fn(), show: jest.fn(), send: jest.fn(), refreshAnchor: jest.fn(), getPinned: jest.fn() };
    const context = vm.createContext({ window: { dashboardTooltips: api, powerPbUtils: require('../src/power-pb-utils') },
      document: { createElementNS: (namespace, tag) => createNode(tag), getElementById(id) { if (!nodes.has(id)) nodes.set(id, createNode('div')); return nodes.get(id); } },
      formatPerformanceValue: () => '4:00 /km', Date });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/dashboard-power-pb.js'), 'utf8'), context);
    const record = { name: '<full untruncated activity title with many words>', date: new Date('2025-01-02'),
      distance: 5, duration: 1200, metricValue: 4, metricType: 'pace_run', sourceDistance: 12, isInterimEstimated: true, effortSource: 'modeled' };
    const overview = createNode('line');
    context.registerPbTooltipAdapter();
    context.bindPbTooltipTarget(overview, record, { scope: 'Run-5km', rank: 2, total: 3 });
    overview.listeners.click[0]({});
    const overviewKey = api.show.mock.calls.at(-1)[1].selectionKey;
    context.renderPbDetailChart({ exportKey: 'Run-5km', color: '#ffffff', axisLabel: 'Time', direction: 'down',
      formatValue: context.formatDurationHms, records: [{ date: record.date, value: record.duration, title: record.name, record }] });
    const target = nodes.get('pbDetailChart').children.find(node => node.tag === 'rect');
    const preventDefault = jest.fn();
    target.listeners.keydown[0]({ key: 'Enter', preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    const selected = api.show.mock.calls.at(-1)[1];
    expect(selected.selectionKey).toBe(overviewKey);
    expect(selected.content.title).toBe(record.name);
    expect(selected.content.notes).toContain('Estimated from 12.00 km activity');
    expect(selected.content.sections[0].rows).toContainEqual({ label: 'Pace', value: '4:00 /km' });
    expect(selected.anchor.normalizedPoint.x).toBeGreaterThan(0);
    target.listeners.blur[0]();
    expect(api.send).toHaveBeenLastCalledWith({ type: 'leave' });
  });

  it('pins every calendar activity and keeps native focus, leave and palette changes non-destructive', () => {
    const api = { show: jest.fn(), send: jest.fn(), invalidate: jest.fn(), getPinned: jest.fn(() => ({})) };
    const tooltip = { classList: { add: jest.fn() }, setAttribute() {} };
    const context = vm.createContext({ window: { dashboardTooltips: api, trainingCalendarUtils: require('../src/training-calendar-utils') },
      document: { getElementById: () => tooltip, querySelectorAll: () => [] }, Date });
    const calendar = fs.readFileSync(path.join(ROOT, 'src/dashboard-training-calendar.js'), 'utf8');
    vm.runInContext(calendar, context);
    const day = { date: new Date('2025-01-02'), dateKey: '2025-01-02', activityCount: 20, intensityLevel: 3,
      tooltipActivities: Array.from({ length: 20 }, (_, index) => ({ name: `Full activity ${index}`, sport: 'Run', durationSeconds: 600, distanceKm: 2 })) };
    context.day = day;
    vm.runInContext('trainingCalendarModel = { years: [{ days: [day] }] };', context);
    const target = { getBoundingClientRect: () => ({ left: 20, top: 30, width: 14, height: 14 }) };
    expect(context.createTrainingCalendarCell(day, 'green')).toContain('onclick="pinTrainingCalendarDayByKey');
    context.pinTrainingCalendarDayByKey(day.dateKey, target);
    expect(api.show.mock.calls[0][1].content.sections).toHaveLength(20);
    expect(api.show.mock.calls[0][1].selectionKey).toBe('trainingCalendar:2025-01-02');
    expect(api.show.mock.calls[0][2]).toBe(true);
    context.showTrainingCalendarTooltip(day, target);
    context.closeTrainingCalendarTooltip();
    expect(api.send).toHaveBeenLastCalledWith({ type: 'leave' });
    vm.runInContext('renderTrainingCalendar = () => {};', context);
    context.setTrainingCalendarPalette('blue');
    expect(api.invalidate).not.toHaveBeenCalled();
    context.setTrainingCalendarSportFilter('Run');
    expect(api.invalidate).toHaveBeenCalledTimes(1);
  });

  it('traverses real word checkboxes and rejects stale async completion', async () => {
    const elements = new Map();
    let revision = 0;
    const element = () => ({ value: '50', style: {}, parentElement: { clientWidth: 640 }, listeners: {},
      classList: { contains: () => false, toggle() {}, add() {}, remove() {} },
      replaceChildren() {}, appendChild() {}, append() {}, setAttribute() {},
      addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
      removeEventListener(type, handler) { this.listeners[type] = (this.listeners[type] || []).filter(existing => existing !== handler); },
      dispatch(type, event = {}) { [...(this.listeners[type] || [])].forEach(handler => handler(event)); }
    });
    const WordCloud = jest.fn();
    WordCloud.isSupported = true;
    WordCloud.stop = jest.fn();
    const context = vm.createContext({
      window: { dashboardTabNavigation: require('../src/tab-navigation'), wordcloudUtils: require('../src/wordcloud-utils'), WordCloud, addEventListener() {} },
      document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element },
      processedActivities: [{ name: 'Alpha Bravo' }], Map, Set,
      captureDashboardRenderToken: () => revision,
      isDashboardRenderTokenCurrent: token => token === revision
    });
    vm.runInContext(wordcloudDashboard, context);
    context.window.renderWordcloud();
    const adapter = context.window.wordcloudDashboard.getKeyboardAdapter();
    const snapshot = adapter.readSnapshot();
    expect(snapshot.selection.map(choice => choice.id)).toEqual(['count', 'word:alpha', 'word:bravo']);
    const countDomain = adapter.getDomainProvider(snapshot)([]);
    expect(countDomain).toMatchObject({ min: 10, max: 100, step: 1 });
    const canvas = elements.get('wordcloudCanvas');
    canvas.dispatch('wordclouddrawn', { detail: { item: ['alpha', 1], drawn: true } });
    revision += 1;
    canvas.dispatch('wordcloudstop');
    expect(context.window.wordcloudDashboard.hasExportableCloud()).toBe(false);
    await expect(context.window.wordcloudDashboard.waitForCurrentRender()).resolves.toBe(false);
    WordCloud.mockClear();
    adapter.applySelection(snapshot.selection.map(choice => choice.id.startsWith('word:') ? { ...choice, value: false } : choice));
    expect(adapter.readSnapshot().selection.slice(1).map(choice => choice.value)).toEqual([false, false]);
    expect(WordCloud).not.toHaveBeenCalled();
    expect(WordCloud.stop).toHaveBeenCalled();
    const words = Array.from({ length: 100 }, (_, index) => `training${String.fromCharCode(97 + Math.floor(index / 26))}${String.fromCharCode(97 + index % 26)}`);
    context.processedActivities = [{ name: words.join(' ') }];
    elements.get('wordcloudCountSlider').value = '100';
    context.window.renderWordcloud();
    const large = adapter.readSnapshot();
    expect(large.selection).toHaveLength(101);
    adapter.applySelection(large.selection.map((choice, index) => index === 100 ? { ...choice, value: false } : choice));
    expect(adapter.readSnapshot().selection[100].value).toBe(false);
  });

  it('provides an accessible canvas, bounded word-count slider, and ranked checkbox list', () => {
    expect(html).toContain('id="vizPanelWordcloud"');
    expect(html).toContain('id="wordcloudCanvas"');
    expect(html).toMatch(/id="wordcloudCanvas"[^>]*aria-label="[^"]+"/);
    expect(html).toMatch(/id="wordcloudCountSlider"[^>]*type="range"[^>]*min="10"[^>]*max="100"[^>]*value="50"/);
    expect(html).toMatch(/id="wordcloudCountValue"[^>]*>50 words<\/output>/);
    expect(wordcloudDashboard).toContain('Math.min(requested, rankedWords.length)');
    expect(html).toContain('id="wordcloudWordList"');
    expect(html).toContain('id="wordcloudUnplacedNotice"');
    expect(html).toContain('id="wordcloudEmptyState"');
    expect(html).toContain('id="wordcloudUnavailableState"');
  });

  it('renders the cloud from local activity titles and handles empty/dependency states', () => {
    expect(wordcloudDashboard).toContain('processedActivities');
    expect(wordcloudDashboard).toContain('window.wordcloudUtils');
    expect(wordcloudDashboard).toContain('window.WordCloud');
    expect(wordcloudDashboard).toContain('wordcloudUnavailableState');
    expect(wordcloudDashboard).toContain('wordcloudEmptyState');
    expect(wordcloudDashboard).toContain('wordcloudUnplacedNotice');
    expect(wordcloudDashboard).toContain('wordclouddrawn');
    expect(wordcloudDashboard).toContain('abortThreshold: 350');
    expect(wordcloudDashboard).toContain('dimensions.width < 480 ? 12 : 8');
    expect(wordcloudDashboard).not.toMatch(/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
  });

  it('dispatches Wordcloud rendering when its tab is selected', () => {
    expect(dashboardTabs).toContain("nextTab === 'wordcloud'");
    expect(dashboardTabs).toContain('renderWordcloud();');
    expect(dashboardTabs).toContain('window.dashboardTabNavigation.TAB_BUTTON_IDS[selectedTab]');
  });

  it('provides a working branded Share/Export action targeting only the rendered canvas', () => {
    expect(html).toMatch(/onclick="exportVisualizationTab\('wordcloud'\)"/);
    expect(html).toMatch(/aria-label="Export for Insta \/ Strava: Workout Title Wordcloud"/);
    expect(html).toMatch(/id="wordcloudCanvas"/);
    expect(dashboardExport.includes("wordcloud: 'wordcloudCanvas'")).toBe(true);
    expect(dashboardExport.includes('wordcloud: !!(window.wordcloudDashboard && window.wordcloudDashboard.canRequestExport())')).toBe(true);
    expect(dashboardExport.includes('await window.wordcloudDashboard.waitForCurrentRender()')).toBe(false);
    expect(dashboardExport.includes('if (!window.wordcloudDashboard.hasExportableCloud())')).toBe(true);
    expect(dashboardExport.includes('snapshot = createExportCaptureSnapshot(targetEl, tabId, target.pinnedSelection, target)')).toBe(true);
    expect(wordcloudDashboard.includes('hasExportableCloud')).toBe(true);
    expect(wordcloudDashboard.includes('waitForCurrentRender')).toBe(true);
  });

  it('defines an accessible collapsible ranked list with responsive desktop rail and mobile control', () => {
    expect(html).toContain('id="wordcloudListPanel"');
    expect(html).toContain('id="wordcloudListContent"');
    expect(html).toMatch(/id="wordcloudListToggle"[^>]*aria-controls="wordcloudListContent"[^>]*aria-expanded="true"/);
    expect(html).toContain('onclick="toggleWordcloudList()"');
    expect(html).toContain('lg:grid-cols-[minmax(0,1fr)_18rem]');
    expect(html).toContain('#wordcloudLayout.is-list-collapsed');
    expect(html).toContain('#wordcloudListPanel.is-collapsed #wordcloudListToggle');
    expect(wordcloudDashboard.includes('function toggleWordcloudList()')).toBe(true);
    expect(wordcloudDashboard.includes('rankedListExpanded = !rankedListExpanded')).toBe(true);
    expect(wordcloudDashboard).not.toMatch(/listToggle\.addEventListener\(['"]click['"]/);
    expect(wordcloudDashboard.includes("setAttribute('aria-expanded'")).toBe(true);
    expect(wordcloudDashboard.includes('rankedListExpanded = true')).toBe(true);
    expect(wordcloudDashboard.includes('selectedWords')).toBe(true);
  });
});
