const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dashboardTabs = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-tabs.js'), 'utf8');
const wordcloudDashboard = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-wordcloud.js'), 'utf8');
const dashboardExport = fs.readFileSync(path.join(ROOT, 'src', 'dashboard-export.js'), 'utf8');

describe('Wordcloud dashboard contract', () => {
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
    expect(dashboardTabs).toContain('vizTabWordcloud');
  });

  it('provides a working branded Share/Export action targeting only the rendered canvas', () => {
    expect(html).toMatch(/onclick="exportVisualizationTab\('wordcloud'\)"/);
    expect(html).toMatch(/aria-label="Export for Insta \/ Strava: Workout Title Wordcloud"/);
    expect(html).toMatch(/id="wordcloudCanvas"/);
    expect(dashboardExport.includes("wordcloud: 'wordcloudCanvas'")).toBe(true);
    expect(dashboardExport.includes('wordcloud: !!(window.wordcloudDashboard && window.wordcloudDashboard.canRequestExport())')).toBe(true);
    expect(dashboardExport.includes('await window.wordcloudDashboard.waitForCurrentRender()')).toBe(true);
    expect(dashboardExport.includes("target.key === 'wordcloud' && !window.wordcloudDashboard.hasExportableCloud()")).toBe(true);
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
