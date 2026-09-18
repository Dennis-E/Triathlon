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

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '../index.html');
    html = fs.readFileSync(htmlPath, 'utf-8');
    inlineCode = extractInlineScripts(html);
  });

  it('contains at least one inline script block', () => {
    expect(inlineCode.length).toBeGreaterThan(100);
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
  });

  it('uses one opaque sticky sport header without a grid gap below it', () => {
    const panel = html.match(/<div id="vizPanelPersonalBests"[\s\S]*?<div id="pbEmptyState"/)[0];
    expect((panel.match(/sticky -top-6/g) || [])).toHaveLength(1);
    expect(panel).toContain('sticky -top-6 z-20 col-span-full -mb-3 grid grid-cols-3');
  });

  it('provides a per-tile full screen detail overlay', () => {
    expect(html).toContain('id="pbDetailOverlay"');
    expect(html).toContain('role="dialog" aria-modal="true"');
    expect(inlineCode).toContain("icon.setAttribute('data-lucide', 'maximize-2')");
    expect((inlineCode.match(/function appendPbDetailButton\(header,/g) || [])).toHaveLength(1);
    expect((inlineCode.match(/^\s*appendPbDetailButton\(header,/gm) || [])).toHaveLength(3);
    expect(inlineCode).toContain('border border-slate-600 bg-slate-900 text-slate-200');
    expect(inlineCode).toContain('window.lucide.createIcons()');
    expect(inlineCode).toContain("if (event.target.id === 'pbDetailOverlay') closePbDetail()");
  });

  it('provides branded export controls for every visualization', () => {
    const exportButtons = [
      'totalDistance',
      'heartratePace',
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
    expect(html).toContain("targetElementId: 'pbDetailCaptureTarget'");
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
    expect(inlineCode).toContain("target.contentFit === 'pb-tight' ? 1032 : 960");
    expect(inlineCode).toContain("target.contentFit === 'pb-tight' ? 560 : 500");
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

  it('keeps complete record histories and positions compact labels by direction', () => {
    expect((inlineCode.match(/return pbs;/g) || [])).toHaveLength(2);
    expect(inlineCode).not.toContain('return pbs.slice(0, PB_MAX_RESULTS)');
    expect(inlineCode).toContain("formatDurationHms(best.duration), color, 'right'");
    expect((inlineCode.match(/color, 'left'\)/g) || [])).toHaveLength(2);
    expect(inlineCode).toContain("label.setAttribute('font-weight', '700')");
  });

  it('includes activity titles in collision-protected detail labels', () => {
    expect(inlineCode).toContain('function wrapPbActivityTitle(title, maxCharacters = 24)');
    expect((inlineCode.match(/title: .*\.name \|\| 'Activity'/g) || [])).toHaveLength(3);
    expect(inlineCode).toContain("svg.appendChild(createSvgElement('rect'");
    expect(inlineCode).toContain('const labelLayouts = records.map');
    expect(inlineCode).toContain('labelLayouts.forEach(layout =>');
  });
});
