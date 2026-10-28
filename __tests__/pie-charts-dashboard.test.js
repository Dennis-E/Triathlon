const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pieDashboard = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-pie-charts.js'), 'utf8');
const dashboardExport = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-export.js'), 'utf8');
const { getTabDisplayTitle, generateExportFilename } = require('../src/export-utils');

function pieHarness() {
  function element() {
    const listeners = {};
    return {
      children: [], style: {}, attributes: {}, classList: { add() {}, remove() {} },
      replaceChildren() { this.children = []; },
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(type, handler) { listeners[type] = handler; },
      click() { listeners.click?.(); }
    };
  }
  const elements = Object.fromEntries(['pieChartsCanvas', 'pieChartsCaptureArea', 'pieChartsEmptyState', 'pieChartsSummary', 'pieChartsLegend'].map(id => [id, element()]));
  const charts = [];
  const selectedItem = { selectionKey: 'pieCharts:Run' };
  const describeItem = jest.fn(() => selectedItem);
  const tooltips = { attachChart: jest.fn(), invalidate: jest.fn(), adapters: new Map([['pieCharts', { describeItem }]]), show: jest.fn() };
  const owner = vm.createContext({
    window: { dashboardTabNavigation: require('../src/tab-navigation'), pieChartUtils: require('../src/pie-chart-utils'), dashboardTooltips: tooltips },
    document: { getElementById: id => elements[id] || null, createElement: element },
    processedActivities: [
      { sport: 'Run', distance: 10, duration: 3600, equipment: 'Nike Fast', avgPower: 220 },
      { sport: 'Bike', distance: 40, duration: 7200, equipment: 'Road Fast', avgPower: 180 }
    ],
    Chart: class {
      constructor(canvas, config) { this.config = config; this.data = config.data; this.options = config.options; charts.push(this); }
      destroy() {}
      getDatasetMeta() { return { data: this.data.labels.map(() => ({ tooltipPosition: () => ({ x: 120, y: 80 }) })) }; }
    }
  });
  vm.runInContext(pieDashboard, owner);
  return { owner, elements, charts, tooltips, describeItem, selectedItem };
}

describe('Pie Charts dashboard contract', () => {
  it.each(['count', 'time', 'distance'])('attaches pie slices with full %s, percentage and count detail', measure => {
    const h = pieHarness();
    h.owner.setPieMeasure(measure);
    const chart = h.charts.at(-1);
    expect(h.tooltips.attachChart).toHaveBeenLastCalledWith('pieCharts', chart);
    expect(chart.data.labels).toEqual(['Run', 'Bike']);
    const slices = h.owner.window.pieChartUtils.computePieSlices(h.owner.processedActivities, { dimension: 'sport', measure, sport: 'All', colorScheme: 'fire' }).slices;
    slices.forEach((slice, dataIndex) => {
      const expected = [`${h.owner.window.pieChartUtils.formatPieMeasureValue(measure, slice.value)} · ${slice.percentage.toFixed(1)}%`];
      if (measure !== 'count') expected.push(h.owner.window.pieChartUtils.formatPieMeasureValue('count', slice.activityCount));
      expect(chart.options.plugins.tooltip.callbacks.label({ dataIndex })).toEqual(expected);
    });
  });

  it('pins the exact slice from an accessible legend button without changing data', () => {
    const h = pieHarness();
    h.owner.renderPieCharts();
    const button = h.elements.pieChartsLegend.children[0].children[0];
    expect(button.type).toBe('button');
    expect(button.attributes['aria-label']).toContain('Run');
    button.click();
    expect(h.describeItem).toHaveBeenCalledWith([{ datasetIndex: 0, index: 0 }], { x: 120, y: 80 });
    expect(h.tooltips.show).toHaveBeenCalledWith('pieCharts', h.selectedItem, true, button);
    expect(h.tooltips.invalidate).not.toHaveBeenCalled();
  });

  it('invalidates before data-setting commits while preserving palette-only changes', () => {
    const h = pieHarness();
    h.owner.renderPieCharts();
    h.owner.setPieColorScheme('monochrome-blue');
    const adapter = h.owner.getPieChartsKeyboardAdapter();
    adapter.applySelection(adapter.readSnapshot().selection.map(choice => choice.id === 'palette' ? { ...choice, value: 'fire' } : choice));
    expect(h.tooltips.invalidate).not.toHaveBeenCalled();
    for (const [setter, value, state] of [['setPieDimension', 'equipment', 'selectedPieDimension'], ['setPieMeasure', 'distance', 'selectedPieMeasure'], ['setPieSportFilter', 'Run', 'selectedPieSport']]) {
      const previous = vm.runInContext(state, h.owner);
      h.tooltips.invalidate.mockImplementationOnce(() => expect(vm.runInContext(state, h.owner)).toBe(previous));
      h.owner[setter](value);
    }
    expect(h.tooltips.invalidate).toHaveBeenCalledTimes(3);
  });

  it('attaches all groupings and does not fabricate an empty chart', () => {
    const h = pieHarness();
    for (const dimension of ['sport', 'duration', 'pace', 'equipment', 'length', 'power']) {
      h.owner.setPieDimension(dimension);
      expect(h.tooltips.attachChart).toHaveBeenLastCalledWith('pieCharts', h.charts.at(-1));
    }
    h.owner.processedActivities = [];
    h.tooltips.attachChart.mockClear();
    h.owner.renderPieCharts();
    expect(h.tooltips.attachChart).not.toHaveBeenCalled();
  });

  it('applies grouping, measure, sport and palette as one keyboard view', () => {
    const owner = vm.createContext({ window: { dashboardTabNavigation: require('../src/tab-navigation') }, document: { getElementById: () => null }, processedActivities: [] });
    vm.runInContext(pieDashboard, owner);
    owner.renderPieCharts = jest.fn();
    const adapter = owner.getPieChartsKeyboardAdapter();
    expect(adapter.readSnapshot().selection.map(choice => choice.value)).toEqual(['sport', 'count', 'All', 'fire']);
    adapter.applySelection([{ id: 'dimension', value: 'pace' }, { id: 'measure', value: 'distance' }, { id: 'sport', value: 'Run' }, { id: 'palette', value: 'monochrome-blue' }]);
    expect(owner.renderPieCharts).toHaveBeenCalledTimes(1);
    expect(adapter.readSnapshot().selection.map(choice => choice.value)).toEqual(['pace', 'distance', 'Run', 'monochrome-blue']);
  });

  it('provides all dimension, measure, sport and colour scheme controls', () => {
    ['Sport', 'Duration', 'Pace', 'Equipment', 'Length', 'Power'].forEach(name => {
      expect(html).toContain(`id="pieDimensionBtn${name}"`);
    });
    ['Count', 'Time', 'Distance'].forEach(name => expect(html).toContain(`id="pieMeasureBtn${name}"`));
    ['All', 'Run', 'Bike', 'Swim'].forEach(name => expect(html).toContain(`id="pieSportBtn${name}"`));
    expect(html).toMatch(/id="pieChartsColorScheme"[^>]*onchange="setPieColorScheme\(this\.value\)"/);
    expect(html).toMatch(/<option value="fire" selected>On fire<\/option>\s*<option value="monochrome-blue">Monochrome blue<\/option>/);
  });

  it('defaults to Sport, Activities, All Sports and On fire', () => {
    expect(html).toMatch(/id="pieDimensionBtnSport" class="[^"]*bg-indigo-600/);
    expect(html).toMatch(/id="pieMeasureBtnCount" class="[^"]*bg-indigo-600/);
    expect(html).toMatch(/id="pieSportBtnAll" class="[^"]*bg-indigo-600/);
    expect(pieDashboard).toContain("let selectedPieDimension = 'sport';");
    expect(pieDashboard).toContain("let selectedPieMeasure = 'count';");
    expect(pieDashboard).toContain("let selectedPieSport = 'All';");
    expect(pieDashboard).toContain("let selectedPieColorScheme = 'fire';");
  });

  it('keeps chart, legend and summary inside the export capture area', () => {
    const captureArea = html.match(/<div id="pieChartsCaptureArea"[\s\S]*?<div id="pieChartsEmptyState"/);
    expect(captureArea).not.toBeNull();
    expect(captureArea[0]).toContain('id="pieChartsCanvas"');
    expect(captureArea[0]).toContain('id="pieChartsLegend"');
    expect(captureArea[0]).toContain('id="pieChartsSummary"');
  });

  it('keeps the activity summary in the dashboard and defines an export-only readable pie layout', () => {
    expect(pieDashboard).toContain('summary.textContent = formatPieSummary(result);');
    expect(pieDashboard).toContain('getExportChartImage');
    expect(dashboardExport).toMatch(/target\.key === 'pieCharts'[\s\S]*?summary\.style\.display = 'none'/);
    expect(dashboardExport).toContain("clonedTarget.style.width = '960px'");
    expect(dashboardExport).toContain("grid.style.gridTemplateColumns = 'minmax(0, 1fr) 18rem'");
    expect(dashboardExport).toContain("legend.querySelectorAll('li span')");
    expect(dashboardExport).toContain("span.style.fontSize = '22px'");
    expect(dashboardExport).toContain("chartContainer.style.maxWidth = 'none'");
  });

  it('registers Share/Export with data and no-data behaviour', () => {
    expect(html).toContain(`onclick="exportVisualizationTab('pieCharts')"`);
    expect(html).toContain('aria-label="Export for Insta / Strava: Pie Charts"');
    expect(dashboardExport).toContain("pieCharts: 'pieChartsCaptureArea'");
    expect(dashboardExport).toContain("pieCharts: isEmptyStateHidden('pieChartsEmptyState')");
    expect(dashboardExport).toContain("'vizTabPieCharts'");
    expect(getTabDisplayTitle('pieCharts')).toBe('Pie Charts');
    expect(generateExportFilename('pieCharts', new Date(2026, 9, 6, 8, 9, 10)))
      .toBe('trianalytica-pie-charts-20261006-080910.png');
  });

  it('toggles the empty state from the computed slices', () => {
    expect(pieDashboard).toMatch(/if \(result\.slices\.length === 0\) \{[\s\S]*?emptyState\.classList\.remove\('hidden'\)/);
    expect(pieDashboard).toContain("emptyState.classList.add('hidden');");
  });

  it('renders from local activity data only and avoids injecting labels as HTML', () => {
    expect(pieDashboard).toContain('processedActivities');
    expect(pieDashboard).toContain('window.pieChartUtils.computePieSlices');
    expect(pieDashboard).not.toMatch(/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
    expect(pieDashboard).not.toContain('innerHTML');
  });
});
