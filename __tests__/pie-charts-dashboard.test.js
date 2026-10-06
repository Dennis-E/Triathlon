const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pieDashboard = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-pie-charts.js'), 'utf8');
const dashboardExport = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-export.js'), 'utf8');
const { getTabDisplayTitle, generateExportFilename } = require('../src/export-utils');

describe('Pie Charts dashboard contract', () => {
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
