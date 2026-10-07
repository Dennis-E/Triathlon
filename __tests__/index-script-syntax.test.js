/**
 * Syntax check for the inline <script> block in index.html.
 *
 * Catches JavaScript syntax errors — duplicate `const` declarations, unmatched
 * braces, orphaned code after a function closes, etc. — that break the entire
 * page at runtime but are invisible to unit tests that only import extracted
 * utility modules.
 *
 * Strategy: extract every inline <script> block, wrap in strict mode, and ask
 * Node's own parser to validate via `new Function(...)`.  Strict mode is
 * required because it turns duplicate `const` declarations in the same scope
 * into a hard SyntaxError (without strict mode the engine may silently accept
 * some forms).
 */

const fs   = require('fs');
const path = require('path');

// The dashboard orchestration files extracted from the former big inline script
// (specs/022-modularize-inline-script). Order matches the required <script src>
// load order in index.html (contracts/script-load-order.md).
const DASHBOARD_MODULE_FILES = [
  'dashboard-state.js',
  'dashboard-core.js',
  'dashboard-import.js',
  'dashboard-equipment.js',
  'dashboard-power-pb.js',
  'dashboard-distributions.js',
  'dashboard-workout-time.js',
  'dashboard-scatter.js',
  'dashboard-heatmap.js',
  'dashboard-training-calendar.js',
  'dashboard-wordcloud.js',
  'dashboard-pie-charts.js',
  'dashboard-lifetime-statistics.js',
  'dashboard-export.js',
  'dashboard-tabs.js'
];


function extractInlineScripts(html) {
  // Match <script> … </script> blocks that have no src= attribute.
  const blocks = [];
  const re = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1]);
  }
  return blocks.join('\n');
}

describe('index.html inline script syntax', () => {
  let html;
  let inlineCode;
  let trainingCalendarCode;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '../index.html');
    html = fs.readFileSync(htmlPath, 'utf-8');
    const dashboardModulesCode = DASHBOARD_MODULE_FILES
      .map(fileName => fs.readFileSync(path.join(__dirname, '../src', fileName), 'utf-8'))
      .join('\n');
    inlineCode = extractInlineScripts(html) + '\n' + dashboardModulesCode;
    trainingCalendarCode = fs.readFileSync(path.join(__dirname, '../src/dashboard-training-calendar.js'), 'utf-8');
  });

  it('contains at least one inline script block', () => {
    expect(inlineCode.length).toBeGreaterThan(100);
  });

  it('loads the dashboard-*.js orchestration files in dependency order', () => {
    const scriptSrcTags = [...html.matchAll(/<script src="\.\/src\/(dashboard-[a-z-]+\.js)"><\/script>/g)]
      .map(m => m[1]);
    expect(scriptSrcTags).toEqual(DASHBOARD_MODULE_FILES);
  });

  it('loads the browser power utility before the dashboard script', () => {
    expect(html).toMatch(/<script src="\.\/src\/power-pb-utils\.js"><\/script>[\s\S]*<script>/);
  });

  it('loads the pinned Wordcloud library and utility before its dashboard renderer', () => {
    expect(html).toContain('<script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.3/src/wordcloud2.js"></script>');
    expect(html).toContain('<script src="./src/wordcloud-utils.js"></script>');
    expect(html).toContain('<script src="./src/dashboard-wordcloud.js"></script>');
    expect(html.indexOf('wordcloud2.js')).toBeLessThan(html.indexOf('./src/wordcloud-utils.js'));
    expect(html.indexOf('./src/wordcloud-utils.js')).toBeLessThan(html.indexOf('./src/dashboard-wordcloud.js'));
    expect(html.indexOf('./src/dashboard-wordcloud.js')).toBeLessThan(html.indexOf('./src/dashboard-tabs.js'));
  });

  it('loads the pie chart utility after distribution utils and its renderer before export', () => {
    expect(html).toContain('<script src="./src/pie-chart-utils.js"></script>');
    expect(html.indexOf('./src/distribution-utils.js')).toBeLessThan(html.indexOf('./src/pie-chart-utils.js'));
    expect(html.indexOf('./src/dashboard-wordcloud.js')).toBeLessThan(html.indexOf('./src/dashboard-pie-charts.js'));
    expect(html.indexOf('./src/dashboard-pie-charts.js')).toBeLessThan(html.indexOf('./src/dashboard-export.js'));
  });

  it('loads lifetime statistics utility before its dashboard renderer and before export', () => {
    expect(html).toContain('<script src="./src/lifetime-statistics-utils.js"></script>');
    expect(html).toContain('<script src="./src/dashboard-lifetime-statistics.js"></script>');
    expect(html.indexOf('./src/lifetime-statistics-utils.js')).toBeLessThan(html.indexOf('./src/dashboard-lifetime-statistics.js'));
    expect(html.indexOf('./src/dashboard-pie-charts.js')).toBeLessThan(html.indexOf('./src/dashboard-lifetime-statistics.js'));
    expect(html.indexOf('./src/dashboard-lifetime-statistics.js')).toBeLessThan(html.indexOf('./src/dashboard-export.js'));
  });

  it('wires the Pie Charts tab through click, keyboard, ARIA, and dashboard dispatch', () => {
    expect(html).toMatch(/id="vizTabPieCharts"[\s\S]*?role="tab"[\s\S]*?aria-controls="vizPanelPieCharts"/);
    expect(html).toMatch(/id="vizPanelPieCharts" role="tabpanel" aria-labelledby="vizTabPieCharts"/);
    expect(html).toContain("onclick=\"setVisualizationTab('pieCharts')\"");
    expect(html).toContain("onkeydown=\"handleVisualizationTabKeydown(event, 'pieCharts')\"");
    expect(inlineCode).toContain("nextTab === 'pieCharts'");
    expect(inlineCode).toContain('window.pieChartsDashboard.render();');
  });

  it('wires the Lifetime Statistics tab through click, keyboard, ARIA, and dashboard dispatch', () => {
    expect(html).toMatch(/id="vizTabLifetimeStatistics"[\s\S]*?role="tab"[\s\S]*?aria-controls="vizPanelLifetimeStatistics"/);
    expect(html).toMatch(/id="vizPanelLifetimeStatistics" role="tabpanel" aria-labelledby="vizTabLifetimeStatistics"/);
    expect(html).toContain('id="lifetimeStatisticsCaptureArea"');
    expect(html).toContain('id="lifetimeStatisticsEmptyState"');
    expect(html).toContain('Your training history at a glance.');
    expect(html).not.toContain('Your imported training history at a glance.');
    expect(html).toContain("onclick=\"setVisualizationTab('lifetimeStatistics')\"");
    expect(html).toContain("onkeydown=\"handleVisualizationTabKeydown(event, 'lifetimeStatistics')\"");
    expect(inlineCode).toContain("nextTab === 'lifetimeStatistics'");
    expect(inlineCode).toContain('window.lifetimeStatisticsDashboard.render();');
  });

  it('wires the Wordcloud tab through click, keyboard, ARIA, and dashboard dispatch', () => {
    expect(html).toContain('id="vizTabWordcloud"');
    expect(html).toContain('id="vizPanelWordcloud"');
    expect(html).toContain("onclick=\"setVisualizationTab('wordcloud')\"");
    expect(html).toContain("onkeydown=\"handleVisualizationTabKeydown(event, 'wordcloud')\"");
    expect(inlineCode).toContain("nextTab === 'wordcloud'");
    expect(inlineCode).toContain('renderWordcloud();');
  });

  it('loads the Training Calendar utility before its dashboard renderer', () => {
    expect(html).toMatch(/<script src="\.\/src\/training-calendar-utils\.js"><\/script>/);
    expect(html).toMatch(/<script src="\.\/src\/dashboard-training-calendar\.js"><\/script>/);
    expect(html.indexOf('./src/training-calendar-utils.js')).toBeLessThan(html.indexOf('./src/dashboard-training-calendar.js'));
  });

  it('wires the Training Calendar tab and renderer', () => {
    expect(html).toContain('id="vizTabTrainingCalendar"');
    expect(html).toContain('id="vizPanelTrainingCalendar"');
    expect(html).toContain("onclick=\"setVisualizationTab('trainingCalendar')\"");
    expect(inlineCode).toContain("nextTab === 'trainingCalendar'");
    expect(inlineCode).toContain('renderTrainingCalendar();');
  });

  it('wraps visualization tabs with accessible sibling scroll controls', () => {
    const leftButtonIndex = html.indexOf('id="visualizationTabsScrollLeft"');
    const viewportIndex = html.indexOf('id="visualizationTabsViewport"');
    const tablistIndex = html.indexOf('role="tablist" aria-label="Visualization tabs"');
    const rightButtonIndex = html.indexOf('id="visualizationTabsScrollRight"');

    expect(leftButtonIndex).toBeGreaterThan(-1);
    expect(leftButtonIndex).toBeLessThan(viewportIndex);
    expect(viewportIndex).toBeLessThan(tablistIndex);
    expect(tablistIndex).toBeLessThan(rightButtonIndex);
    expect(html).toContain('aria-label="Scroll visualization tabs left"');
    expect(html).toContain('aria-label="Scroll visualization tabs right"');
    expect(html).toContain('class="invisible pointer-events-none shrink-0');
    expect(html).toContain('&lt;&lt;');
    expect(html).toContain('&gt;&gt;');
    expect(html).toContain('id="vizTabWorkoutTime"');
    expect(html).toContain('id="vizTabTrainingCalendar"');
    expect(html).toContain("onclick=\"setVisualizationTab('workoutTime')\"");
    expect(html).toContain("onkeydown=\"handleVisualizationTabKeydown(event, 'trainingCalendar')\"");
  });

  it('wires the Pace vs Metrics tab and renderer', () => {
    expect(html).toContain('id="vizTabPaceMetrics"');
    expect(html).toContain('id="vizPanelPaceMetrics"');
    expect(html).toContain("onclick=\"setVisualizationTab('paceMetrics')\"");
    expect(html).toContain('id="paceMetricsChart"');
    expect(html).toContain('id="paceMetricsEmptyState"');
    expect(html).toContain('id="paceMetricsMetricFilters"');
    expect(html).toContain('id="paceMetricsEmptyState"');
    expect(html).toContain('No sessions with a valid pace or speed and the selected measurement');
    expect(html).not.toContain('id="vizTabHeartratePace"');
    expect(html).not.toContain('id="vizTabCadencePace"');
    expect(inlineCode).toContain("nextTab === 'paceMetrics'");
    expect(inlineCode).toContain('renderPaceMetricsChart();');
    expect(html).not.toContain('dashboard-cadence-scatter.js');
  });

  it('provides Training Calendar details, filters, and import reset controls', () => {
    expect(html).toContain('id="trainingCalendarYears"');
    expect(html).toContain('id="trainingCalendarPaletteFilters"');
    expect(html).not.toContain('id="trainingCalendarYearSelect"');
    expect(html).toContain('id="trainingCalendarSportFilters"');
    expect(html).not.toContain('id="trainingCalendarDetails"');
    expect(html).toContain('id="trainingCalendarEmptyState"');
    expect(html).toContain('data-palette="green"');
    expect(html).toContain('data-palette="blue"');
    expect(html).toContain('data-palette="fire"');
    expect(inlineCode).toContain('showTrainingCalendarDayTooltipByKey');
    expect(inlineCode).toContain('setTrainingCalendarSportFilter');
    expect(inlineCode).toContain('initTrainingCalendarControls();');
    expect(inlineCode).toContain('setTrainingCalendarPalette');
    expect(inlineCode).toContain('buildMultiYearCalendarModel');
  });

  it('provides a local tooltip and removes the global calendar detail surface', () => {
    expect(html).toContain('id="trainingCalendarDayTooltip"');
    expect(html).not.toContain('id="trainingCalendarDetails"');
    expect(inlineCode).toContain('tooltipActivities');
    expect(inlineCode).toContain('mouseenter');
    expect(inlineCode).toContain('mouseleave');
    expect(inlineCode).toContain('focus');
    expect(inlineCode).toContain('blur');
    expect(html).toContain('max-h-');
  });

  it('keeps the Training Calendar renderer local-only', () => {
    expect(trainingCalendarCode).not.toMatch(/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
    expect(trainingCalendarCode).toContain('window.trainingCalendarUtils');
  });

  it('uses a bright palette-independent empty day and renders all year blocks', () => {
    expect(trainingCalendarCode).toContain('rgba(241,245,249,0.5)');
    expect(trainingCalendarCode).toContain('trainingCalendarYears');
    expect(trainingCalendarCode).toContain('PALETTES');
  });

  it('wires Training Calendar export to the full multi-year target', () => {
    expect(html).toContain("exportVisualizationTab('trainingCalendar')");
    expect(html).toContain('id="trainingCalendarYears"');
    expect(inlineCode).toContain('trainingCalendar:');
    expect(inlineCode).toContain('trainingCalendarYears');
    expect(inlineCode).toContain('trainingCalendarDayTooltip');
  });

  it('wires the Workout Time tab and its dashboard renderer', () => {
    expect(html).toContain('id="vizTabWorkoutTime"');
    expect(html).toContain('id="vizPanelWorkoutTime"');
    expect(html).toContain("onclick=\"setVisualizationTab('workoutTime')\"");
    expect(html).toContain('<script src="./src/workout-time-utils.js"></script>');
    expect(inlineCode).toContain("nextTab === 'workoutTime'");
    expect(inlineCode).toContain('renderWorkoutTimeChart();');
    expect(html).toContain('id="workoutTimeGranularityBtnDay"');
    expect(html).toContain('id="workoutTimeGranularityBtnWeek"');
    expect(html).toContain('id="workoutTimeGranularityBtnMonth"');
    expect(html).toContain('id="workoutTimeGranularityBtnYear"');
    expect(inlineCode).toContain('selectedWorkoutTimeGranularity');
    expect(inlineCode).toContain('selectedWorkoutTimeSport');
    expect(inlineCode).toContain('getWorkoutTimeDateBounds');
  });

  it('registers every branded visualization Share/Export button with an export capture target', () => {
    const exportCode = fs.readFileSync(path.join(__dirname, '../src/dashboard-export.js'), 'utf-8');
    const expectedTabs = [
      'totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'heatmap',
      'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics'
    ];

    expectedTabs.forEach(tabName => {
      expect(html.includes(`exportVisualizationTab('${tabName}')`)).toBe(true);
      expect(Boolean(exportCode.match(new RegExp(`${tabName}:\\s*'[^']+'`)))).toBe(true);
    });
    expect(exportCode).toContain("lifetimeStatistics: isEmptyStateHidden('lifetimeStatisticsEmptyState')");
    expect(exportCode).toContain("lifetimeStatistics: 'lifetimeStatisticsExportArea'");
    expect(exportCode).toContain("tabName === 'lifetimeStatistics' ? 'lifetime-kpis' : undefined");
    expect(html).toContain('id="lifetimeStatisticsExportArea"');
    expect(html).toContain('id="wordcloudCanvas"');
  });

  it('starts the Wordcloud slider at 50 while retaining its 10–100 range', () => {
    expect(html).toMatch(/id="wordcloudCountSlider"[^>]*min="10"[^>]*max="100"[^>]*value="50"/);
    expect(html).toMatch(/id="wordcloudCountValue"[^>]*>50 words<\/output>/);
  });

  it('provides rotating prepared import previews and humorous messages', () => {
    expect(html).toContain('id="importProgressPreview"');
    expect(html).toContain('data-import-preview="0"');
    expect(html).toContain('data-import-preview="1"');
    expect(inlineCode).toContain('startImportPreviewRotation');
    expect(inlineCode).toContain('stopImportPreviewRotation');
    expect(inlineCode).toContain('Crunching your kilometers...');
    expect(inlineCode).toContain('Looking for suspiciously fast segments...');
  });

  it('keeps one import headline and one black detail status box', () => {
    expect((html.match(/<h2 class="font-semibold text-lg">Importing Strava Data<\/h2>/g) || []).length).toBe(1);
    expect(html).toContain('id="importProgressDetail"');
    expect(html).toContain('bg-slate-950 border border-slate-800 rounded-lg');
    expect(html).toContain('id="importProgressStage"');
    expect(inlineCode).toContain('stageEl.textContent = stage');
  });

  it('places the factual import stage above the progress bar', () => {
    const statusIndex = html.indexOf('id="importProgressStage"');
    const progressBarIndex = html.indexOf('id="importProgressBar"');
    expect(statusIndex).toBeGreaterThan(-1);
    expect(statusIndex).toBeLessThan(progressBarIndex);
    expect(inlineCode).toContain('stageEl.textContent = stage');
  });

  it('uses a calm five-second preview timer independent of progress updates', () => {
    expect(inlineCode).toContain('}, 5000);');
    expect(inlineCode).not.toContain('}, 1800);');
    expect(inlineCode).toContain('startImportPreviewRotation();');
    expect(inlineCode).toContain('stopImportPreviewRotation();');
  });

  it('renders a distinct activity-average power section for Bike PBs', () => {
    expect(inlineCode).not.toContain('Activity-average power progression (W)');
    expect(inlineCode).not.toContain('createActivityAveragePowerRecords(activities)');
  });

  it('defines the dedicated Watt section and available-only profile contract', () => {
    expect(html).toContain('id="pbBikePowerHeading"');
    expect(html).toContain('id="pbBikePowerContainer"');
    expect(inlineCode).toContain("heading.classList.add('hidden')");
    expect(inlineCode).toContain('buildAllTimePowerProfile');
    expect(inlineCode).toContain('Duration');
    expect(inlineCode).toContain('Power (W)');
    expect(inlineCode).toContain('limited-profile');
  });

  it('renders the all-time power detail chart from duration categories, not activity dates', () => {
    expect(inlineCode).toContain("xAxisMode: 'duration-category'");
    expect(inlineCode).toContain('record.durationSeconds');
    expect(inlineCode).toContain('record.durationLabel');
    expect(inlineCode).toContain('model.xAxisMode === \'duration-category\'');
    expect(inlineCode).toContain('new Map(records.map((record, index) => [record.durationSeconds, index]))');
    expect(inlineCode).toContain('durationLabel');
    expect(inlineCode).toContain("label.textContent = timeTicks.showMonth");
    expect(inlineCode).toContain("records: profilePoints.map(point => ({ durationSeconds: point.durationSeconds, durationLabel: point.durationLabel, date: point.date, value: point.watts, title: point.title || 'Activity', record: point.record }))");
    expect(inlineCode).toContain("measurementHit.setAttribute('class', 'profile-measurement-hit-area')");
    expect(inlineCode).toContain("showPowerPbTooltip(e, point.record, 1, 1, color, point.durationLabel)");
    expect(inlineCode).toContain("class: 'profile-measurement-hit-area'");
    expect(inlineCode).toContain("'stroke-width': 24");
    expect(inlineCode).toContain('showDurationProfileTooltip(event, record)');
    expect(inlineCode).not.toContain("svg.setAttribute('preserveAspectRatio', 'none')");
  });

  it('renders the all-time power profile tile with the shared mini-chart style', () => {
    expect(inlineCode).toContain("profileSvg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + SVG_H)");
    expect(inlineCode).toContain("profileSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')");
    expect(inlineCode).toContain("profileBlock.className = 'bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5'");
    expect(inlineCode).toContain("profilePoints.length + ' durations'");
    expect(inlineCode).toContain("measurementLine.setAttribute('y2', X_AXIS_Y)");
    expect(inlineCode).toContain("appendYAxisLabel(profileSvg, X_AXIS_Y - 1, '0 W', false)");
    expect(inlineCode).not.toContain('const height = 148;');
    expect(inlineCode).not.toContain("xLabel.textContent = 'Duration'");
    expect(inlineCode).not.toContain("yLabel.textContent = 'Power (W)'");
  });

  it('lays out PB blocks as a strict desktop row grid', () => {
    expect((html.match(/class="pb-row-block /g) || []).length).toBe(3);
    expect(html).toContain('data-pb-col="1"');
    expect(html).toContain('data-pb-col="2"');
    expect(html).toContain('data-pb-col="3"');
    expect(html).toContain('lg:space-y-0 lg:contents');
    expect(html).not.toContain('lg:col-start-3 space-y-2');
    expect(html).not.toContain('lg:col-start-1 space-y-2');
    expect(html).toContain('grid-row: var(--pb-row, 1)');
    expect(html).toContain('pb-grid-item text-xs italic text-slate-600">Not applicable for swimming.');
    expect(inlineCode).toContain('function assignPbGridRows(');
    expect(inlineCode).toContain("'--pb-row'");
    expect(inlineCode).not.toContain('assignPbGridRows(\'pbBikePowerContainer\')');
  });

  it('keeps the mobile PB stacking order and sport labels', () => {
    ['Run', 'Bike', 'Swim'].forEach(sport => {
      expect(html).toMatch(new RegExp('data-pb-mobile-sport="' + sport + '" class="lg:hidden'));
    });
    expect(html).toContain('order-1 lg:order-none lg:contents');
    expect(html).toContain('order-2 lg:order-none lg:contents');
    expect(html).toContain('order-3 lg:order-none lg:contents');
    expect(html).not.toMatch(/class="[^"]*(?<!lg:)\bcontents\b/);
  });

  it('identifies duration-specific power effort details', () => {
    expect(inlineCode).toContain("Source: duration-specific effort");
    expect(inlineCode).toContain("ttPace.textContent = 'Power: ' + Math.round(pb.watts) + ' W'");
  });

  it('wires a hover tooltip and label thinning onto every all-time profile point', () => {
    expect(inlineCode).toContain('window.powerPbUtils.getPowerProfileWattRange(profilePoints)');
    expect(inlineCode).toContain('window.powerPbUtils.markPowerProfileLabelVisibility(profilePoints)');
    expect(inlineCode).toContain("showPowerPbTooltip(e, point.record, 1, 1, color, point.durationLabel)");
    expect(inlineCode).toContain('hit.addEventListener(\'mousemove\', movePbTooltip)');
    expect(inlineCode).toContain('measurementHit.addEventListener(\'mouseleave\'');
    expect(inlineCode).toContain("hit.addEventListener('mouseleave', function(e)");
    expect(inlineCode).toContain('if (point.showLabel) {');
  });

  it('renders duration tiles with the shared timeline chart instead of static text', () => {
    expect(inlineCode).toContain('function renderPowerDurationTileChart(block, allPbs, color)');
    expect(inlineCode).toContain('renderPowerDurationTileChart(block, allPbs, color);');
    expect(inlineCode).not.toContain("<span class=\"text-slate-500\">Current best</span>");
    expect(inlineCode).toContain('appendPbDetailButton(header, {');
    expect(inlineCode).toContain("title: 'Bike power ' + durationDef.label");
  });

  it('has no syntax errors in any inline <script> block', () => {
    // new Function() parses (but does not execute) the body and throws
    // SyntaxError for malformed JavaScript — unmatched braces, stray tokens, etc.
    expect(() => new Function(inlineCode)).not.toThrow();
  });

  it('has no duplicate top-level const declarations inside renderPbChart', () => {
    // Specifically guard against the class of bug where an edit accidentally
    // duplicates the closing block of renderPbChart, creating two `const hasAny`
    // declarations in the same function scope.
    const matches = (inlineCode.match(/\bconst hasAny\b/g) || []);
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  it('renders each PB section heading once across all sport columns', () => {
    const panel = html.match(/<div id="vizPanelPersonalBests"[\s\S]*?<div id="pbEmptyState"/)[0];

    expect((panel.match(/>Distance records</g) || [])).toHaveLength(1);
    expect((panel.match(/>Elevation</g) || [])).toHaveLength(1);
    expect((panel.match(/>Longest</g) || [])).toHaveLength(1);
  });

  it('shares timeline axes and current-best labels across PB tile types', () => {
    expect((inlineCode.match(/function appendTimelineAxes\(svg\)/g) || [])).toHaveLength(1);
    expect((inlineCode.match(/^\s*appendTimelineAxes\(svg\);/gm) || [])).toHaveLength(3);
    expect((inlineCode.match(/function appendCurrentBest\(svg,/g) || [])).toHaveLength(1);
    expect((inlineCode.match(/^\s*appendCurrentBest\(svg,/gm) || [])).toHaveLength(3);
    expect(inlineCode).toContain("appendYAxisLabel(svg, X_AXIS_Y - 1, '0', false)");
    expect(inlineCode).toContain('const firstRecordValue = records[0].value');
    expect(inlineCode).toContain('function renderPowerDurationTileChart(block, allPbs, color)');
  });

  it('uses one opaque sticky sport header without a grid gap below it', () => {
    const panel = html.match(/<div id="vizPanelPersonalBests"[\s\S]*?<div id="pbEmptyState"/)[0];
    expect((panel.match(/lg:sticky/g) || [])).toHaveLength(1);
    expect(panel).toContain('id="pbSportHeaderDesktop" class="hidden lg:sticky');
    expect(panel).toContain('lg:col-span-full lg:-mb-3 lg:grid lg:grid-cols-3');
    expect(panel).toContain('data-pb-mobile-sport="Run"');
    expect(panel).toContain('data-pb-mobile-sport="Bike"');
    expect(panel).toContain('data-pb-mobile-sport="Swim"');
    expect(panel).toContain('order-1 lg:order-none');
    expect(panel).toContain('order-2 lg:order-none');
    expect(panel).toContain('order-3 lg:order-none');
    const mobileSportHeadingCount = (panel.match(/data-pb-mobile-sport="(?:Run|Bike|Swim)" class="(?:hidden )?lg:hidden/g) || []).length;
    expect(mobileSportHeadingCount).toBeGreaterThanOrEqual(10);
    expect(panel).toContain('id="pbBikePowerMobileHeading"');
    expect(inlineCode).toContain("if (mobileHeading) mobileHeading.classList.add('hidden')");
    expect(inlineCode).toContain("if (mobileHeading) mobileHeading.classList.remove('hidden')");
  });

  it('describes Personal Best progression beyond distance on the landing card', () => {
    const card = html.match(/id="previewCard-personalBests"[\s\S]*?<\/button>/)[0];
    expect(card).toMatch(/PB progression across multiple records and metrics/i);
    expect(card).not.toContain('PB progression per distance across all three sports');
  });

  it('provides a per-tile full screen detail overlay', () => {
    expect(html).toContain('id="pbDetailOverlay"');
    expect(html).toContain('role="dialog" aria-modal="true"');
    expect(inlineCode).toContain("icon.setAttribute('data-lucide', 'maximize-2')");
    expect((inlineCode.match(/function appendPbDetailButton\(header,/g) || [])).toHaveLength(1);
    expect((inlineCode.match(/^\s*appendPbDetailButton\((?:header|profileHeader),/gm) || [])).toHaveLength(4);
    expect(inlineCode).toContain("title: 'Bike power all-time profile'");
    expect(inlineCode).toContain('border border-slate-600 bg-slate-900 text-slate-200');
    expect(inlineCode).toContain('container.appendChild(section);\n          if (window.lucide) window.lucide.createIcons();');
    expect(inlineCode).toContain('window.lucide.createIcons()');
    expect(inlineCode).toContain("if (event.target.id === 'pbDetailOverlay') closePbDetail()");
  });

  it('provides branded export controls for every visualization', () => {
    const exportButtons = [
      'totalDistance',
      'paceMetrics',
      'equipment',
      'equipmentTimeline',
      'heatmap'
    ];
    exportButtons.forEach(tabName => {
      expect(html).toContain(`exportVisualizationTab('${tabName}')`);
    });
    expect((html.match(/Export for Insta \/ Strava/g) || []).length).toBeGreaterThanOrEqual(6);
    expect((html.match(/assets\/Strava_Logo\.svg/g) || []).length).toBeGreaterThanOrEqual(6);
    expect((html.match(/assets\/Instagram_logo_2016\.svg/g) || []).length).toBeGreaterThanOrEqual(6);
    expect(html).toMatch(/assets\/Strava_Logo\.svg[\s\S]*Export for Insta \/ Strava[\s\S]*assets\/Instagram_logo_2016\.svg/);
    expect(html).toContain('id="pbDetailCaptureTarget"');
    expect(inlineCode).toContain("targetElementId: 'pbDetailCaptureTarget'");
    expect(html).not.toContain("exportVisualizationTab('personalBests')");
    expect(inlineCode).toContain('getExportAssetPaths');
    expect(html).toContain('Export for Insta / Strava');
    expect(html).toContain('class="h-5 w-8 object-contain"');
  });

  it('composes export metadata in separate image regions and supports PB tile targets', () => {
    expect(inlineCode).toContain('function drawExportComposition(captured, target, assets)');
    expect(inlineCode).toContain("ctx.fillRect(0, 0, targetSize, 190)");
    expect(inlineCode).toContain("ctx.fillRect(0, 0, targetSize, 190)");
    expect(inlineCode).toContain("ctx.drawImage(assets.qrCode, 930, 28, 120, 120)");
    expect(inlineCode).not.toContain("ctx.fillRect(0, 930, targetSize, 150)");
    expect(inlineCode).not.toContain('footerLogoBox');
    expect(inlineCode).toContain('computeFilterRowLayout');
    expect(inlineCode).toContain('rowPaddingBottom');
    expect(inlineCode).toContain("target.contentFit === 'pb-tight' || isLifetimeKpiExport ? 1032 : 960");
    expect(inlineCode).toContain("target.contentFit === 'pb-tight' ? 560 : isLifetimeKpiExport ? 840 : 500");
    expect(inlineCode).toContain("target.contentFit === 'pb-tight' || isLifetimeKpiExport ? 1032 : 960");
    expect(inlineCode).toContain("isLifetimeKpiExport ? 24 : 60");
    expect(inlineCode).toContain('if (isLifetimeKpiExport) return finalCanvas.toDataURL');
    expect(inlineCode).toContain("ctx.font = '600 24px system-ui");
    expect(inlineCode).toContain("ctx.drawImage(assets.qrCode");
    expect(inlineCode).toContain("kind: 'pb-tile'");
    expect(inlineCode).toContain("targetElementId: 'pbDetailCaptureTarget'");
    expect(inlineCode).toContain('availableControls: getAvailableControlContext(tabName)');
    expect(inlineCode).toContain('drawAvailableControls(');
    expect(inlineCode).toContain('target.availableControls || []');
    expect(inlineCode).toContain('computeContainFit');
    expect(inlineCode).toContain('EXPORT_DOMAIN');
    expect(inlineCode).not.toContain('ctx.drawImage(assets.strava');
    expect(inlineCode).not.toContain('ctx.drawImage(assets.instagram');
    expect(inlineCode).not.toContain('targetElementId: tileId');
    expect(inlineCode).toContain('function exportActivePbDetail()');
    expect(inlineCode).toContain('computeExportMetadataLayout');
    expect(inlineCode).toContain("exportVisualizationTarget(target)");
  });

  it('keeps export assets local and does not route generated images through the API', () => {
    expect(inlineCode).toContain('getExportAssetPaths');
    expect(inlineCode).toContain('image.src = path');
    expect(inlineCode).not.toContain('fetch(EXPORT');
    expect(inlineCode).not.toContain('analysisCounterClient.recordAnalysis(dataUrl)');
  });

  it('keeps Bike power processing local to the imported dataset', () => {
    expect(inlineCode).toContain('fitBestEffortsByActivityId');
    expect(inlineCode).not.toContain('powerPbUtils.fetch');
    expect(inlineCode).not.toContain('powerPbUtils.upload');
  });

  it('keeps complete record histories and positions compact labels by direction', () => {
    expect((inlineCode.match(/return pbs;/g) || [])).toHaveLength(2);
    expect(inlineCode).not.toContain('return pbs.slice(0, PB_MAX_RESULTS)');
    expect(inlineCode).toContain("formatDurationHms(best.duration), color, 'right'");
    expect((inlineCode.match(/color, 'left'\)/g) || [])).toHaveLength(2);
    expect(inlineCode).toContain("label.setAttribute('font-weight', '700')");
  });

  it('includes activity titles in collision-protected detail labels', () => {
    expect(inlineCode).toContain('function wrapPbActivityTitle(title, maxCharacters = 24)');
    expect((inlineCode.match(/title: .*\.name \|\| 'Activity'/g) || [])).toHaveLength(4);
    expect(inlineCode).toContain("svg.appendChild(createSvgElement('rect'");
    expect(inlineCode).toContain('const labelLayouts = records.map');
    expect(inlineCode).toContain('labelLayouts.forEach(layout =>');
  });

  it('renders the Distributions chart via distributionUtils and toggles the empty state (US1)', () => {
    expect(inlineCode).toContain('function setDistributionsMetric(');
    expect(inlineCode).toContain('function renderDistributionsChart(');
    expect(inlineCode).toContain('window.distributionUtils.filterActivitiesForDistribution');
    expect(inlineCode).toContain('window.distributionUtils.computeDistributionBuckets');
    expect(inlineCode).toContain("distributionsEmptyState");
    expect(inlineCode).toContain('activityCount === 0');
  });

  it('filters the Distributions chart by sport and time horizon (US2)', () => {
    expect(inlineCode).toContain('function setDistributionsSportFilter(');
    expect(inlineCode).toContain('function setDistributionsDateRange(');
    expect(inlineCode).toContain('selectedDistributionsSportFilter');
    expect(inlineCode).toContain('getDistributionsDateBounds()');
  });

  it('toggles the Distributions chart between histogram and smoothed line (US3)', () => {
    expect(inlineCode).toContain('function setDistributionsDisplayMode(');
    expect(inlineCode).toContain('selectedDistributionsDisplayMode');
    expect(inlineCode).toContain("cubicInterpolationMode: 'monotone'");
  });

  it('excludes average watts for non-Bike activities in processData() (019-distributions-refinements US1)', () => {
    expect(inlineCode).toContain("avgWatts: sportCategory === 'Bike' ? avgWatts : null");
  });

  it('renders one line per sport when All Sports + Line mode are both selected (019-distributions-refinements US2)', () => {
    expect(inlineCode).toContain('groupBucketCountsBySport');
    expect(inlineCode).toContain('showPerSportLines');
    expect(inlineCode).toMatch(/PB_SPORT_COLOR\[sport\]/);
  });

  it('uses the shared formatMetricValue helper for bucket labels instead of ad-hoc per-metric formatters (019-distributions-refinements US3)', () => {
    expect(inlineCode).not.toMatch(/formatValue:\s*v\s*=>/);
    expect(inlineCode).toContain('metricKey: selectedDistributionsMetric');
  });

  it('renders overflow buckets using an Infinity-safe x-value in both combined and per-sport line datasets (019-distributions-refinements US4)', () => {
    expect(inlineCode).toContain('getBucketLineX');
    expect(inlineCode).toContain('bucket.isOverflow ? bucket.rangeStart');
  });

  it('defaults the Distributions tab to All Sports + Line mode on first render (020-distributions-visual-polish US1)', () => {
    expect(inlineCode).toContain("let selectedDistributionsSportFilter = 'All';");
    expect(inlineCode).toContain("let selectedDistributionsDisplayMode = 'line';");
  });

  it('applies the selected distribution palette to bars and line points while keeping per-sport stroke colors (026-distributions-labels-colors US3)', () => {
    expect(inlineCode).toContain('window.distributionUtils.getDistributionColor');
    expect(inlineCode).toContain('selectedDistributionsColorScheme');
    expect(inlineCode).toContain('bucketColors');
    expect(inlineCode).toContain('PB_SPORT_COLOR[sport]');
  });

  it('exposes the two distribution color schemes and keeps fire as the default (026-distributions-labels-colors US3)', () => {
    expect(inlineCode).toContain("let selectedDistributionsColorScheme = 'fire';");
    expect(inlineCode).toContain('function setDistributionsColorScheme(');
    expect(html).toContain('id="distributionsColorScheme"');
    expect(html).toContain('value="fire" selected>On fire</option>');
    expect(html).toContain('value="monochrome-blue">Monochrome blue</option>');
  });

  it('uses filled circular markers and explicit metric axis units (026-distributions-labels-colors US1)', () => {
    expect(inlineCode).toContain('usePointStyle: true');
    expect(inlineCode).toContain("pointStyle: 'circle'");
    expect(inlineCode).toContain("length: 'Length (km)'");
    expect(inlineCode).toContain("elevation: 'Elevation gain (m)'");
    expect(inlineCode).toContain("power: 'Power (W)'");
    expect(inlineCode).toContain("'Pace (km/h)'");
  });

  it('shows N/A for All Sports histograms before rendering data (026-distributions-labels-colors US2)', () => {
    expect(inlineCode).toContain("selectedDistributionsSportFilter === 'All' && selectedDistributionsDisplayMode === 'histogram'");
    expect(inlineCode).toContain("N/A: Histogram is not available for All Sports.");
    expect(inlineCode).toContain('function showDistributionsEmptyState(');
    expect(inlineCode).toContain('distributionsChartInstance.destroy()');
  });

  it('uses boundary ticks, hides line points, and applies line/fill colors for distribution cleanup (027-distribution-chart-cleanup)', () => {
    expect(inlineCode).toContain('getHistogramBoundaryTicks');
    expect(inlineCode).toContain('pointRadius: 0');
    expect(inlineCode).toContain('pointHoverRadius: 0');
    expect(inlineCode).toContain('borderColor:');
    expect(inlineCode).toContain('backgroundColor:');
  });

  it('uses one km/h axis title and flat monochrome histogram color (027-distribution-chart-cleanup)', () => {
    expect(inlineCode).toContain("'Pace (km/h)'");
    expect(inlineCode).not.toContain("'Pace (mixed units)'");
    expect(inlineCode).toContain("selectedDistributionsColorScheme === 'monochrome-blue'");
  });

  it('maps Histogram category positions to metric boundary labels (028-distribution-axis-units)', () => {
    expect(inlineCode).toContain('getHistogramBoundaryTicks([bucket]');
    expect(inlineCode).toContain('bucketLabels[Number(value)]');
    expect(inlineCode).not.toContain('callback: value => selectedDistributionsDisplayMode === \'line\' ? getBucketLabelForX(Number(value)) : value');
  });

  it('keeps Histogram N/A cleanup and metric axis titles while rebuilding ticks (028-distribution-axis-units)', () => {
    expect(inlineCode).toContain('showDistributionsEmptyState(');
    expect(inlineCode).toContain("length: 'Length (km)'");
    expect(inlineCode).toContain("elevation: 'Elevation gain (m)'");
    expect(inlineCode).toContain("power: 'Power (W)'");
  });

  it('shows the Pace unit once on the axis title per sport and uses km/h for All Sports (027-distribution-chart-cleanup)', () => {
    expect(inlineCode).toContain("PACE_UNIT_BY_SPORT = { Run: 'min/km', Swim: 'min/100m', Bike: 'km/h' }");
    expect(inlineCode).toContain('axisTitleText');
  });

  it('enables the Pace underflow bucket and reverses the axis only for single-sport Run/Swim Pace views (020-distributions-visual-polish US5)', () => {
    expect(inlineCode).toContain("enableUnderflow: selectedDistributionsMetric === 'pace'");
    expect(inlineCode).toMatch(/shouldReverseAxis = selectedDistributionsMetric === 'pace' &&/);
    expect(inlineCode).toContain('reverse: shouldReverseAxis');
  });

  it('shows an N/A indicator for Elevation gain + Swim and excludes Swim from per-sport Elevation lines (020-distributions-visual-polish US6)', () => {
    expect(inlineCode).toContain("selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim'");
    expect(inlineCode).toContain('Elevation gain is not applicable to Swim activities.');
    expect(inlineCode).toContain('delete perSport.Swim;');
  });
});
