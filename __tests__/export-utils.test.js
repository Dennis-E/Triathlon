const {
  computeSquareFit,
  computeContainFit,
  computeExportContentFit,
  computeExportContentLayout,
  computeTooltipAnnotationLayout,
  computeTooltipCalloutLayout,
  computeExportMetadataLayout,
  computeFilterRowLayout,
  getTabDisplayTitle,
  generateExportFilename,
  hasExportableContent,
  createExportTarget,
  summarizeFilters,
  summarizeAvailableControls,
  getExportLegend,
  getExportAssetPaths,
  getExportBrandConfig,
  getExportControlConfig,
  getExportLayoutConfig,
  getExportTargetSlug,
  getExportPngDimensions,
  getExportFormatConfig,
  computeSocialExportLayout,
  createSocialExportMetadata,
  getSocialExportStyleConfig,
  getContrastRatio,
  wrapExportText,
  planExportPages
} = require('../src/export-utils');

describe('F080 T011 prominent export punchline layout', () => {
  const snapshot = { targetKey: 'equipment', selectionId: 'selection-layout',
    familyData: { items: [{ name: 'Training shoes', value: 12 }] } };

  test.each([['story', 1920], ['square', 1080], ['portrait', 1350]])(
    'puts a readable punchline before compact context in %s', (format, height) => {
      const presentation = { headline: 'My training', context: [{ label: 'Period', value: '2024-2025' },
        { label: 'Unit', value: 'km' }], secondaryLine: 'One session, then another. This is my training story.' };
      const measure = { measureText: (text, size) => String(text).length * size * 0.48 };
      const plan = planExportPages(snapshot, { format, presentation, humorEnabled: true }, measure);
      const plain = planExportPages(snapshot, { format, presentation, humorEnabled: false }, measure);
      const caption = plan.textBlocks.find(block => block.role === 'caption');
      const context = plan.textBlocks.find(block => block.role === 'context');
      expect(plan.width).toBe(1080);
      expect(plan.height).toBe(height);
      expect(caption.fontSize).toBeGreaterThanOrEqual(context.fontSize * 1.25);
      expect(caption.fontSize).toBeGreaterThanOrEqual(36);
      expect(caption.lines.length).toBeLessThanOrEqual(2);
      expect(caption.y).toBeLessThan(context.y);
      expect(context.lines.join(' ')).not.toMatch(/Period:|Unit:/);
      expect(plain.captionHeight).toBe(0);
      expect(plain.pages[0].visualization.height).toBeGreaterThan(plan.pages[0].visualization.height);
      expect(plain.textBlocks.filter(block => block.role === 'caption')).toHaveLength(0);
    }
  );
});

describe('F080 T019 lossless caption fitting', () => {
  const snapshot = { targetKey: 'equipment', familyData: { items: [{ name: 'Shoes', value: 1 }] } };

  it('does not normalize inner whitespace or silently cut long custom text', () => {
    const text = 'One  two   <b>three</b> four five six seven eight nine ten eleven twelve';
    const plan = planExportPages(snapshot, { format: 'story', humorEnabled: true, caption: text },
      { measureText: text => String(text).length * 12 });
    expect(plan.textBlocks.find(block => block.role === 'caption').lines.join('')).toBe(text);
  });

  it('keeps explicit internal line breaks and rejects a third caption line', () => {
    const plan = planExportPages(snapshot, { format: 'square', humorEnabled: true, caption: 'First line\nSecond line' });
    expect(plan.textBlocks.find(block => block.role === 'caption').lines).toEqual(['First line', 'Second line']);
    expect(() => planExportPages(snapshot, { format: 'square', humorEnabled: true, caption: 'First\nSecond\nThird' }))
      .toThrow(/two|2|line|fit/i);
  });

  it('separately validates character length and format-dependent fit without shrinking or truncation', () => {
    const text = 'W'.repeat(42);
    const measurements = { measureText: value => Array.from(value).reduce((sum, character) => sum + (character === 'W' ? 45 : 12), 0) };
    const square = planExportPages(snapshot, { format: 'square', humorEnabled: true, caption: text }, measurements);
    expect(square.textBlocks.find(block => block.role === 'caption').lines.join('')).toBe(text);
    expect(() => planExportPages(snapshot, { format: 'story', humorEnabled: true, caption: text }, measurements))
      .toThrow(/two|2|line|fit/i);
  });
});

describe('F080 T033 measured PB source pagination', () => {
  test.each(['square', 'portrait', 'story'])('preserves long attributed records on measured continuation pages in %s', format => {
    const records = Array.from({ length: 8 }, (_, index) => ({ value: 1200 - index, displayValue: '20:00',
      date: Date.UTC(2018 + index, 0, 1), source: { workoutTitle: `Synthetic long workout title ${index} with distinguishing training details and a deliberately extended name`,
        kind: 'full-activity', estimated: false, activityDate: Date.UTC(2018 + index, 0, 1) } }));
    const selected = { targetKey: 'personalBests', familyData: { records, xAxisMode: 'time', unit: 's', title: 'Run 5 km' } };
    const before = JSON.stringify(selected);
    const plan = planExportPages(selected, { format }, { measureText: text => String(text).length * 18 });
    expect(plan.pages.flatMap(page => page.itemIndexes)).toEqual(records.map((_record, index) => index));
    expect(plan.pages.length).toBeGreaterThan(1);
    for (const page of plan.pages) {
      expect(page.rowHeights).toHaveLength(page.itemIndexes.length);
      expect(page.rowHeights.every(height => height > 52)).toBe(true);
      expect(page.repeatFullChart).toBe(true);
    }
    expect(JSON.stringify(selected)).toBe(before);
  });
});

describe('export-utils', () => {
  describe('family export page planning', () => {
    const options = { format: 'story', humorEnabled: false };
    const measurements = { measureText: text => String(text).length * 18 };
    const snapshot = (targetKey, familyData) => ({ targetKey, selectionId: 'selection-test',
      filters: [], familyData, period: '2013-2025', metric: 'Distance', units: 'km' });

    it('paginates long equipment names without losing rows, changing rank scales or shrinking text', () => {
      const items = Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, name: `Long equipment model ${index + 1} with meaningful distinguishing details`, value: 1000 - index * 10 }));
      const plan = planExportPages(snapshot('equipment', { items }), options, measurements);
      expect(plan).toMatchObject({ format: 'story', width: 1080, height: 1920,
        contentBounds: { x: 72, y: 240, width: 888, height: 1320 }, minFontSize: 36 });
      expect(plan.pages.length).toBeGreaterThan(1);
      expect(plan.pages.flatMap(page => page.itemIndexes)).toEqual(items.map((_item, index) => index));
      for (const page of plan.pages) {
        expect(page.scale).toEqual({ min: 0, max: 1000 });
        expect(page.visualization.x).toBeGreaterThanOrEqual(72);
        expect(page.visualization.y).toBeGreaterThanOrEqual(240);
        expect(page.visualization.x + page.visualization.width).toBeLessThanOrEqual(960);
        expect(page.visualization.y + page.visualization.height).toBeLessThanOrEqual(1560);
      }
    });

    it('keeps every selected chronological period rather than taking the last ten years', () => {
      const periodLabels = Array.from({ length: 25 }, (_, index) => String(2001 + index));
      const plan = planExportPages(snapshot('totalDistance', { aggregation: 'yearly', periodLabels,
        series: [{ label: 'Run', values: periodLabels.map((_label, index) => index + 1) }] }), options, measurements);
      expect(plan.pages.flatMap(page => page.itemIndexes)).toEqual(periodLabels.map((_label, index) => index));
      expect(plan.pages.every(page => page.scale.max === 25)).toBe(true);
    });

    it('measures yearly labels beside the value axis and preserves the selected central fact', () => {
      const selected = snapshot('totalDistance', { aggregation: 'yearly', periodLabels: ['2023', '2024', '2025'],
        series: [{ label: 'Run', values: [1000, 1000, 1000] }] });
      const plan = planExportPages(selected, { ...options, presentation: { headline: 'My training years',
        centralValue: 3000, unit: 'km' } }, { measureText: text => String(text).length * 26 });
      expect(plan.textBlocks.find(block => block.role === 'centralValue')).toMatchObject({ fontSize: 88, lines: ['3,000 km'] });
      const maximumYearWidth = 4 * 26 + 24;
      for (const page of plan.pages) expect(page.itemIndexes.length * maximumYearWidth + 7 * 26 + 30).toBeLessThanOrEqual(888);
    });

    it('preserves naturally coincident scatter observations without jitter or point-dropping pages', () => {
      const points = [{ x: 5, y: 140, r: 8 }, { x: 5, y: 140, r: 8 }];
      const selected = snapshot('paceMetrics', { points, xAxisTitle: 'Pace (min/km)', yAxisTitle: 'Heart rate (bpm)' });
      const before = JSON.stringify(selected);
      const plan = planExportPages(selected, options, measurements);
      expect(plan.pages).toHaveLength(1);
      expect(plan.pages[0].itemIndexes).toEqual([0, 1]);
      expect(plan.layoutKind).not.toBe('ranking');
      expect(JSON.stringify(selected)).toBe(before);
    });

    it('continues a dense pie legend while retaining the complete chart and original denominator', () => {
      const slices = Array.from({ length: 30 }, (_, index) => ({ label: `Category ${index + 1}`, value: index + 1, color: '#20c9b2' }));
      const plan = planExportPages(snapshot('pieCharts', { slices }), options, measurements);
      expect(plan.pages.length).toBeGreaterThan(1);
      expect(plan.pages.flatMap(page => page.itemIndexes)).toEqual(slices.map((_slice, index) => index));
      expect(plan.pages.every(page => page.repeatFullChart === true && page.denominator === 465)).toBe(true);
    });

    it('rebalances caption-off space and rejects unsupported formats, missing data and unknown families', () => {
      const selected = snapshot('equipment', { items: [{ name: 'Only pair', value: 12 }] });
      const plain = planExportPages(selected, options, measurements);
      const humor = planExportPages(selected, { ...options, humorEnabled: true, caption: 'They have seen things.' }, measurements);
      expect(plain.captionHeight).toBe(0);
      expect(humor.captionHeight).toBeGreaterThan(0);
      expect(plain.pages[0].visualization.height).toBeGreaterThan(humor.pages[0].visualization.height);
      expect(() => planExportPages(selected, { format: 'unsupported' }, measurements)).toThrow(/format/i);
      expect(() => planExportPages(snapshot('unknown', {}), options, measurements)).toThrow(/family|target/i);
      expect(() => planExportPages(snapshot('equipment', { items: [] }), options, measurements)).toThrow(/data|empty/i);
    });

    it('uses the full media column and available height for a single selected collage image', () => {
      const selected = snapshot('mediaGallery', { mediaKind: 'collage', includeRoutes: false,
        items: [{ assetKey: 'video.mp4', caption: 'Synthetic training frame', date: Date.parse('2025-01-04') }] });
      const plan = planExportPages(selected, options, measurements);
      expect(plan.pages).toHaveLength(1);
      expect(plan.pages[0].columns).toBe(1);
      expect(plan.pages[0].imageHeight).toBeGreaterThan(300);
      expect(plan.pages[0].imageHeight).toBeLessThan(plan.pages[0].visualization.height);
    });
  });

  it('copies sample provenance into an immutable export snapshot', () => {
    const sampleProvenance = { datasetId: 'sample-v1', synthetic: true, label: 'Synthetic sample training data' };
    const target = createExportTarget({ kind: 'tab', key: 'totalDistance', title: 'Distance',
      targetElementId: 'capture', hasData: true, sampleProvenance });
    sampleProvenance.label = 'Changed active data';
    expect(target.sampleProvenance).toEqual({ datasetId: 'sample-v1', synthetic: true, label: 'Synthetic sample training data' });
  });

  describe('social export format and metadata', () => {
    it('defines specification minimums and passes text/mark contrast thresholds', () => {
      const style = getSocialExportStyleConfig();
      expect(style).toMatchObject({
        safeMargin: 48,
        typography: {
          headline: { min: 56, max: 72 },
          centralValue: { min: 88, max: 120 },
          essential: 36,
          axis: 36,
          context: 36,
          branding: 36
        }
      });
      expect(getContrastRatio(style.colors.headline, style.colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(style.colors.secondary, style.colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(style.colors.accent, style.colors.surface)).toBeGreaterThanOrEqual(3);
    });

    it('wraps long labels without dropping characters and rejects content beyond its line budget', () => {
      const measureText = value => String(value).length * 10;
      const lines = wrapExportText('Long Shoe Model 123456', 90, measureText, 3);
      expect(lines.join(' ').replace(/\s/g, '')).toBe('LongShoeModel123456');
      expect(lines.every(line => measureText(line) <= 90)).toBe(true);
      expect(() => wrapExportText('A long label that cannot fit', 40, measureText, 1)).toThrow(/line/i);
    });

    it('defaults to square and returns exact dimensions for all three formats', () => {
      expect(getExportFormatConfig()).toEqual({ key: 'square', width: 1080, height: 1080 });
      expect(getExportFormatConfig('portrait')).toEqual({ key: 'portrait', width: 1080, height: 1350 });
      expect(getExportFormatConfig('story')).toEqual({ key: 'story', width: 1080, height: 1920 });
      expect(getExportFormatConfig('unsupported')).toBeNull();
    });

    it('plans story content within the exact asymmetric safe area', () => {
      const layout = computeSocialExportLayout('story', { headerHeight: 180, footerHeight: 72 });
      expect(layout).toMatchObject({
        format: 'story', width: 1080, height: 1920,
        contentBounds: { x: 72, y: 240, width: 888, height: 1320 },
        visualization: { x: 72, y: 435, width: 888 }
      });
      expect(layout.visualization.y + layout.visualization.height).toBeLessThanOrEqual(1560 - 72);
    });

    it('does not allow caller dimensions or margins to escape story safe bounds', () => {
      const layout = computeSocialExportLayout('story', {
        canvasWidth: 2000, canvasHeight: 3000, marginX: 0,
        headerHeight: 100, bottomMargin: 0, contextHeight: 48, annotationHeight: 40
      });
      for (const rect of [layout.context, layout.visualization, layout.annotation].filter(Boolean)) {
        expect(rect.x).toBeGreaterThanOrEqual(72);
        expect(rect.y).toBeGreaterThanOrEqual(240);
        expect(rect.x + rect.width).toBeLessThanOrEqual(960);
        expect(rect.y + rect.height).toBeLessThanOrEqual(1560);
      }
      expect(() => computeSocialExportLayout('story', { headerHeight: 2000 })).toThrow(/fit|space|content/i);
    });

    it('keeps all essential text at phone-readable source size and contrast', () => {
      const style = getSocialExportStyleConfig();
      for (const role of ['essential', 'axis', 'context', 'branding']) {
        expect(style.typography[role]).toBeGreaterThanOrEqual(36);
      }
      expect(getContrastRatio(style.colors.secondary, style.colors.background)).toBeGreaterThanOrEqual(4.5);
      const browser = { window: {} };
      require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '../src/export-utils.js'), 'utf8'), browser);
      expect(browser.window.exportUtils.getExportFormatConfig('story')).toEqual({ key: 'story', width: 1080, height: 1920 });
      expect(browser.window.exportUtils.computeSocialExportLayout('story').contentBounds).toEqual({ x: 72, y: 240, width: 888, height: 1320 });
    });

    it('computes a deterministic composition inside the selected format and safe margins', () => {
      const square = computeSocialExportLayout('square', { headerHeight: 180, footerHeight: 48, contextHeight: 36 });
      const portrait = computeSocialExportLayout('portrait', { headerHeight: 180, footerHeight: 48, contextHeight: 36 });

      expect(square).toMatchObject({
        format: 'square',
        width: 1080,
        height: 1080,
        visualization: { x: 48, width: 984 }
      });
      expect(portrait).toMatchObject({
        format: 'portrait',
        width: 1080,
        height: 1350,
        visualization: { x: 48, width: 984 }
      });
      expect(square.visualization.y + square.visualization.height).toBeLessThanOrEqual(1080 - 48);
      expect(portrait.visualization.y + portrait.visualization.height).toBeLessThanOrEqual(1350 - 48);
      expect(() => computeSocialExportLayout('unsupported')).toThrow(/format/i);
    });

    it('validates factual headline and optional humor word limits without inventing context', () => {
      expect(createSocialExportMetadata({
        headline: 'My running years',
        context: [{ label: 'Sport', value: 'Run' }],
        secondaryLine: 'Apparently, I do not sit still.'
      })).toEqual({
        headline: 'My running years',
        context: [{ label: 'Sport', value: 'Run' }],
        secondaryLine: 'Apparently, I do not sit still.'
      });
      expect(() => createSocialExportMetadata({ headline: 'One two three four five six seven eight' })).toThrow(/seven words/i);
      expect(() => createSocialExportMetadata({ headline: 'My running years', secondaryLine: 'One two three four five six seven eight nine ten eleven' })).toThrow(/ten words/i);
    });
  });

  describe('PNG byte validation', () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XcAAAAASUVORK5CYII=', 'base64');

    it('reads dimensions from a genuine PNG', () => {
      expect(getExportPngDimensions(png)).toEqual({ width: 1, height: 1 });
    });

    it.each([null, new Uint8Array(), Buffer.from('hello'), png.subarray(0, 20)])('rejects missing or truncated PNG bytes: %p', bytes => {
      expect(() => getExportPngDimensions(bytes)).toThrow(/PNG/i);
    });

    it.each([0, 8, 12, 16, 20])('rejects a corrupt signature, header or dimension at byte %i', offset => {
      const invalid = Buffer.from(png);
      invalid.fill(0, offset, offset + 4);
      expect(() => getExportPngDimensions(invalid)).toThrow(/PNG/i);
    });

    it('exposes the validator through the classic browser bridge', () => {
      const context = { window: {} };
      require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '../src/export-utils.js'), 'utf8'), context);
      expect(context.window.exportUtils.getExportPngDimensions(png)).toEqual({ width: 1, height: 1 });
    });
  });

  it('preserves the heatmap capture target and selected Swim context', () => {
    const target = createExportTarget({
      kind: 'tab', key: 'heatmap', title: getTabDisplayTitle('heatmap'),
      targetElementId: 'heatmapMapContainer', hasData: true,
      filters: [{ label: 'Sport', value: 'Swim' }]
    });
    expect(target).toMatchObject({ key: 'heatmap', targetElementId: 'heatmapMapContainer', filters: [{ label: 'Sport', value: 'Swim' }] });
    expect(generateExportFilename(target, new Date(2026, 9, 21, 10, 0, 0))).toBe('trianalytica-heatmap-20261021-100000.png');
    expect(hasExportableContent('heatmap', { heatmap: false })).toBe(false);
  });

  it('supports the media gallery local export title, filename, and capture metadata', () => {
    expect(getTabDisplayTitle('mediaGallery')).toBe('Media Gallery');
    expect(getExportTargetSlug('mediaGallery')).toBe('media-gallery');
    expect(generateExportFilename('mediaGallery', new Date(2026, 9, 21, 10, 0, 0)))
      .toBe('trianalytica-media-gallery-20261021-100000.png');
    expect(createExportTarget({
      kind: 'tab', key: 'mediaGallery', title: 'Media Gallery',
      targetElementId: 'mediaGalleryExportArea', hasData: true,
      filters: [{ label: 'Year', value: '2025' }]
    })).toMatchObject({
      targetElementId: 'mediaGalleryExportArea', hasData: true,
      filters: [{ label: 'Year', value: '2025' }]
    });
  });

  describe('module shape', () => {
    it('exposes the expected functions', () => {
      expect(typeof computeSquareFit).toBe('function');
      expect(typeof getTabDisplayTitle).toBe('function');
      expect(typeof generateExportFilename).toBe('function');
      expect(typeof hasExportableContent).toBe('function');
      expect(typeof createExportTarget).toBe('function');
      expect(typeof summarizeFilters).toBe('function');
      expect(typeof getExportLegend).toBe('function');
      expect(typeof getExportAssetPaths).toBe('function');
      expect(typeof getExportControlConfig).toBe('function');
      expect(typeof getExportTargetSlug).toBe('function');
    });
  });

  it.each(['totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests', 'heatmap', 'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics', 'mediaGallery'])('preserves export context and no-data availability for %s', key => {
    const filters = [{ label: 'Sport', value: 'Run' }];
    const target = createExportTarget({ kind: 'tab', key, title: key, targetElementId: `${key}Target`, hasData: true, filters });
    expect(target).toMatchObject({ key, targetElementId: `${key}Target`, filters });
    expect(generateExportFilename(target, new Date(2026, 9, 22, 10, 0, 0))).toMatch(/^trianalytica-.+\.png$/);
    expect(hasExportableContent(key, { [key]: true })).toBe(true);
    expect(hasExportableContent(key, { [key]: false })).toBe(false);
  });

  it('preserves PB detail identity, filters and branded filename metadata', () => {
    const target = createExportTarget({ kind: 'pb-tile', key: '5km', title: '5km Run', targetElementId: 'pbDetailCaptureTarget', hasData: true, detailKey: 'run-5km', filters: [{ label: 'Sport', value: 'Run' }] });
    expect(target).toMatchObject({ kind: 'pb-tile', detailKey: 'run-5km', contentFit: 'pb-tight' });
    expect(generateExportFilename(target, new Date(2026, 9, 22, 10, 0, 0))).toMatch(/^trianalytica-.+\.png$/);
    expect(getExportBrandConfig().domain).toContain('Triathlon');
  });

  it('supports the Training Calendar export target', () => {
    expect(getTabDisplayTitle('trainingCalendar')).toBe('Training Calendar');
    expect(generateExportFilename('trainingCalendar', new Date(2026, 8, 24, 12, 30, 0))).toContain('training-calendar');
    expect(createExportTarget({
      kind: 'tab',
      key: 'trainingCalendar',
      title: 'Training Calendar',
      targetElementId: 'trainingCalendarYears',
      hasData: true,
      filters: [{ label: 'Palette', value: 'Fire' }, { label: 'Sport', value: 'All Sports' }]
    })).toMatchObject({
      targetElementId: 'trainingCalendarYears',
      hasData: true,
      filters: [{ label: 'Palette', value: 'Fire' }, { label: 'Sport', value: 'All Sports' }]
    });
  });

  it('supports Wordcloud export title, filename slug, and canvas target', () => {
    expect(getTabDisplayTitle('wordcloud')).toBe('Workout Title Wordcloud');
    expect(generateExportFilename('wordcloud', new Date(2026, 9, 5, 10, 11, 12)))
      .toBe('trianalytica-wordcloud-20261005-101112.png');
    expect(createExportTarget({
      kind: 'tab',
      key: 'wordcloud',
      title: 'Workout Title Wordcloud',
      targetElementId: 'wordcloudCanvas',
      hasData: true
    })).toMatchObject({
      kind: 'tab',
      key: 'wordcloud',
      title: 'Workout Title Wordcloud',
      targetElementId: 'wordcloudCanvas',
      hasData: true
    });
  });

  it('supports the Lifetime Statistics export title, filename slug, and capture target', () => {
    expect(getTabDisplayTitle('lifetimeStatistics')).toBe('Lifetime Statistics');
    expect(generateExportFilename('lifetimeStatistics', new Date(2026, 9, 7, 14, 5, 6)))
      .toBe('trianalytica-lifetime-statistics-20261007-140506.png');
    expect(createExportTarget({
      kind: 'tab',
      key: 'lifetimeStatistics',
      title: 'Lifetime Statistics',
      targetElementId: 'lifetimeStatisticsCaptureArea',
      hasData: true
    })).toMatchObject({
      key: 'lifetimeStatistics',
      targetElementId: 'lifetimeStatisticsCaptureArea',
      hasData: true
    });
  });

  describe('computeSquareFit', () => {
    it('fits a wider-than-tall source fully inside the square, centered vertically', () => {
      const result = computeSquareFit(800, 400, 500);
      expect(result.drawWidth).toBeCloseTo(500);
      expect(result.drawHeight).toBeCloseTo(250);
      expect(result.offsetX).toBeCloseTo(0);
      expect(result.offsetY).toBeCloseTo(125);
    });

    it('fits a taller-than-wide source fully inside the square, centered horizontally', () => {
      const result = computeSquareFit(300, 900, 600);
      expect(result.drawWidth).toBeCloseTo(200);
      expect(result.drawHeight).toBeCloseTo(600);
      expect(result.offsetX).toBeCloseTo(200);
      expect(result.offsetY).toBeCloseTo(0);
    });

    it('never exceeds the target square in either dimension', () => {
      const cases = [
        [1920, 480, 1080],
        [50, 50, 1080],
        [1, 5000, 1080]
      ];
      cases.forEach(([w, h, target]) => {
        const { drawWidth, drawHeight } = computeSquareFit(w, h, target);
        expect(drawWidth).toBeLessThanOrEqual(target);
        expect(drawHeight).toBeLessThanOrEqual(target);
      });
    });

    it('returns a zeroed result for invalid input', () => {
      expect(computeSquareFit(0, 100, 500)).toEqual({ drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 });
      expect(computeSquareFit(100, -1, 500)).toEqual({ drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 });
      expect(computeSquareFit(100, 100, 0)).toEqual({ drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 });
    });
  });

  describe('computeContainFit', () => {
    it('fits wide and tall logo sources without distortion', () => {
      expect(computeContainFit(432, 91, 180, 60)).toEqual({
        drawWidth: expect.closeTo(180),
        drawHeight: expect.closeTo(37.9166666667),
        offsetX: expect.closeTo(0),
        offsetY: expect.closeTo(11.0416666667)
      });
      expect(computeContainFit(300, 900, 100, 160)).toEqual({
        drawWidth: expect.closeTo(53.3333333333),
        drawHeight: expect.closeTo(160),
        offsetX: expect.closeTo(23.3333333333),
        offsetY: expect.closeTo(0)
      });
    });

    it('returns a zeroed result for invalid bounding boxes', () => {
      expect(computeContainFit(100, 100, 0, 50)).toEqual({ drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 });
      expect(computeContainFit(100, 100, 50, -1)).toEqual({ drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 });
    });
  });

  describe('computeExportContentFit', () => {
    it('uses at least 85% of both plot dimensions when source and content aspect ratios match', () => {
      const fit = computeExportContentFit(960, 500, 960, 500);

      expect(fit).toMatchObject({
        drawWidth: 960,
        drawHeight: 500,
        offsetX: 0,
        offsetY: 0,
        widthUtilization: 1,
        heightUtilization: 1
      });
      expect(fit.widthUtilization).toBeGreaterThanOrEqual(0.85);
      expect(fit.heightUtilization).toBeGreaterThanOrEqual(0.85);
    });

    it('preserves aspect ratio and reports when one dimension cannot reach 85%', () => {
      const fit = computeExportContentFit(1920, 500, 960, 500);

      expect(fit.drawWidth).toBe(960);
      expect(fit.drawHeight).toBe(250);
      expect(fit.widthUtilization).toBe(1);
      expect(fit.heightUtilization).toBe(0.5);
      expect(fit.drawWidth / fit.drawHeight).toBe(1920 / 500);
    });

    it('returns zero utilization for invalid dimensions', () => {
      expect(computeExportContentFit(960, 500, 0, 500)).toEqual({
        drawWidth: 0,
        drawHeight: 0,
        offsetX: 0,
        offsetY: 0,
        widthUtilization: 0,
        heightUtilization: 0
      });
    });
  });

  describe('computeTooltipAnnotationLayout', () => {
    const measureText = text => Array.from(text).reduce((width, character) => width + (character.codePointAt(0) > 127 ? 20 : 10), 0);
    const options = { maxWidth: 400, maxHeight: 280, measureText };
    const content = {
      title: 'Morning run', itemLabel: 'Activity 42',
      sections: [{ heading: 'Summary', rows: [{ label: 'Distance', value: 0, unit: 'km' }, { label: 'Pace', value: 'Unavailable' }] }],
      footerLines: ['Total: 1 activity'], notes: ['Estimated data']
    };

    it('preserves ordered full semantic content and returns exact padded dimensions', () => {
      const before = JSON.parse(JSON.stringify(content));
      expect(computeTooltipAnnotationLayout({ ...options, content })).toEqual({
        mode: 'full',
        lines: ['Morning run', 'Activity 42', 'Summary', 'Distance: 0 km', 'Pace: Unavailable', 'Total: 1 activity', 'Estimated data'],
        width: 194, height: 192, fontSize: 18, lineHeight: 24, padding: 12
      });
      expect(content).toEqual(before);
    });

    it('compacts many detail rows to the whole wrapped title without truncation or shrinking', () => {
      const title = 'Complete grouped activity title';
      const result = computeTooltipAnnotationLayout({
        ...options, maxWidth: 184, maxHeight: 96,
        content: { title, sections: [{ rows: Array.from({ length: 100 }, () => ({ label: 'Distance', value: '12', unit: 'km' })) }] }
      });
      expect(result).toEqual({ mode: 'headline', lines: ['Complete grouped', 'activity title'], width: 184, height: 72, fontSize: 18, lineHeight: 24, padding: 12 });
      expect(result.lines.join(' ')).toBe(title);
    });

    it('uses the complete item/group label when the title is absent or blank', () => {
      const result = computeTooltipAnnotationLayout({
        ...options, maxHeight: 48,
        content: { title: '  ', itemLabel: 'Group of 3 runs', notes: ['Detail not omitted from the original model'] }
      });
      expect(result).toMatchObject({ mode: 'headline', lines: ['Group of 3 runs'], height: 48 });
      expect(computeTooltipAnnotationLayout({ ...options, content: { itemLabel: 'Group of 3 runs' } }).lines).toEqual(['Group of 3 runs']);
    });

    it.each(['outside current view', 'not in export'])('retains required association in full and headline modes: %s', associationNote => {
      const full = computeTooltipAnnotationLayout({ ...options, content: { title: 'Run' }, associationNote });
      const compact = computeTooltipAnnotationLayout({ ...options, maxHeight: 72, content, associationNote });
      expect(full.mode).toBe('full');
      expect(compact.mode).toBe('headline');
      expect(full.lines).toEqual(['Run', associationNote]);
      expect(compact.lines).toEqual(['Morning run', associationNote]);
    });

    it('wraps the entire required association and fits exactly at the compact height boundary', () => {
      const bounds = {
        ...options, maxWidth: 124, maxHeight: 144,
        content: { title: 'Group title', notes: ['Detail '.repeat(100)] },
        associationNote: 'outside current view'
      };
      expect(computeTooltipAnnotationLayout(bounds)).toEqual({
        mode: 'headline', lines: ['Group', 'title', 'outside', 'current', 'view'],
        width: 94, height: 144, fontSize: 18, lineHeight: 24, padding: 12
      });
      expect(() => computeTooltipAnnotationLayout({ ...bounds, maxHeight: 143 })).toThrow(/tooltip annotation.*fit/i);
    });

    it('measures wide Unicode code points and long words without losing text', () => {
      const title = '\u754c\u754c\u{1F3C3}\u754cABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const result = computeTooltipAnnotationLayout({ ...options, maxWidth: 84, maxHeight: 280, content: { title } });
      expect(result.mode).toBe('full');
      expect(result.lines.join('')).toBe(title);
      expect(result.lines.every(line => measureText(line) <= 60)).toBe(true);
      expect(result.width).toBeLessThanOrEqual(84);
      expect(result.lines).toContain('\u754c\u754c\u{1F3C3}');
    });

    it('wraps explicit newlines and keeps unbroken detail values and units', () => {
      const result = computeTooltipAnnotationLayout({
        ...options, maxWidth: 124,
        content: { title: 'Run\nBike', sections: [{ rows: [{ label: 'ID', value: 'ABCDEFGHIJKLMNOP', unit: 'km' }] }] }
      });
      expect(result.lines.slice(0, 2)).toEqual(['Run', 'Bike']);
      expect(result.lines.slice(2).join('').replace(/\s/g, '')).toBe('ID:ABCDEFGHIJKLMNOPkm');
    });

    it('accepts canvas TextMetrics measurements and never lowers the requested font', () => {
      const measure = jest.fn(() => ({ width: 60 }));
      const result = computeTooltipAnnotationLayout({ ...options, content: { title: 'Run' }, measureText: measure, fontSize: 22, lineHeight: 28, padding: 8 });
      expect(result).toEqual({ mode: 'full', lines: ['Run'], width: 76, height: 44, fontSize: 22, lineHeight: 28, padding: 8 });
      expect(measure).toHaveBeenCalledWith('Run', 22);
      expect(computeTooltipAnnotationLayout({ ...options, content: { title: 'Run' }, fontSize: 12, lineHeight: 10 })).toMatchObject({ fontSize: 18, lineHeight: 18 });
    });

    it('compacts instead of shrinking a larger requested font to fit more details', () => {
      const measure = (value, size) => Array.from(value).length * size;
      expect(computeTooltipAnnotationLayout({
        ...options, content: { title: 'Run', notes: ['Detail'] }, measureText: measure,
        fontSize: 30, lineHeight: 36, maxHeight: 60
      })).toEqual({ mode: 'headline', lines: ['Run'], width: 114, height: 60, fontSize: 30, lineHeight: 36, padding: 12 });
    });

    it('uses headline when only a detail character cannot fit', () => {
      expect(computeTooltipAnnotationLayout({
        ...options, maxWidth: 34, content: { title: 'A', notes: ['\u754c'] }
      })).toMatchObject({ mode: 'headline', lines: ['A'] });
    });

    it.each([
      { maxWidth: 33, maxHeight: 280, content: { title: 'A' } },
      { maxWidth: 400, maxHeight: 47, content: { title: 'Run' } },
      { maxWidth: 400, maxHeight: 71, content: { title: 'Run' }, associationNote: 'outside current view' }
    ])('throws an explicit fit error only when the complete headline plus association cannot fit: %p', bounds => {
      expect(() => computeTooltipAnnotationLayout({ ...options, ...bounds })).toThrow(/tooltip annotation.*fit/i);
    });

    it('exposes the helper through the existing browser bridge', () => {
      const context = { window: {} };
      require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '../src/export-utils.js'), 'utf8'), context);
      expect(context.window.exportUtils.computeTooltipAnnotationLayout({ ...options, content: { title: 'Run' } })).toEqual(
        computeTooltipAnnotationLayout({ ...options, content: { title: 'Run' } })
      );
    });
  });

  describe('computeTooltipCalloutLayout', () => {
    const options = {
      content: { title: 'Morning run', sections: [{ rows: [{ label: 'Distance', value: '12 km' }] }] },
      anchor: { visibility: 'visible', capturePoint: { x: 0.5, y: 0.5 } },
      visualizationRect: { x: 60, y: 205, width: 960, height: 800 },
      bounds: { x: 24, y: 205, width: 1032, height: 827 },
      protectedRects: [], measureText: text => text.length * 10
    };

    it.each([[0.01, 0.01], [0.99, 0.01], [0.01, 0.99], [0.99, 0.99], [0.5, 0.5]])('keeps body and tail inside bounds for anchor %p/%p', (x, y) => {
      const layout = computeTooltipCalloutLayout({ ...options, anchor: { visibility: 'visible', capturePoint: { x, y } } });
      expect(layout.body.x).toBeGreaterThanOrEqual(24);
      expect(layout.body.y).toBeGreaterThanOrEqual(205);
      expect(layout.body.x + layout.body.width).toBeLessThanOrEqual(1056);
      expect(layout.body.y + layout.body.height).toBeLessThanOrEqual(1032);
      expect(layout.body.width).toBeLessThan(480);
      expect(layout.tail).not.toBeNull();
      expect(Math.hypot(layout.tail.tip.x - (60 + x * 960), layout.tail.tip.y - (205 + y * 800))).toBeCloseTo(10);
      expect(layout.candidateChecks).toBeLessThanOrEqual(8);
    });

    it('adapts sides and avoids protected content instead of drawing a bottom bar', () => {
      const top = computeTooltipCalloutLayout({ ...options, anchor: { visibility: 'visible', capturePoint: { x: 0.5, y: 0.01 } } });
      const bottom = computeTooltipCalloutLayout({ ...options, anchor: { visibility: 'visible', capturePoint: { x: 0.5, y: 0.99 } } });
      expect(top.side).toBe('below');
      expect(bottom.side).toBe('above');
      const protectedRects = [{ x: 24, y: 205, width: 1032, height: 380 }];
      const placed = computeTooltipCalloutLayout({ ...options, protectedRects });
      expect(placed.side).toBe('below');
      expect(placed.body.y).toBeGreaterThanOrEqual(585);
    });

    it('falls back to the complete headline when full content has no place', () => {
      const content = { title: 'Run', notes: Array.from({ length: 7 }, () => 'Detailed content') };
      const layout = computeTooltipCalloutLayout({ ...options, content,
        visualizationRect: { x: 0, y: 0, width: 400, height: 240 },
        bounds: { x: 0, y: 0, width: 400, height: 240 } });
      expect(layout.mode).toBe('headline');
      expect(layout.lines).toEqual(['Run']);
      expect(layout.candidateChecks).toBeLessThanOrEqual(8);
      expect(content.notes).toHaveLength(7);
    });

    it.each(['outside-view', 'not-in-export'])('keeps explicit association without a tail for %s', visibility => {
      const layout = computeTooltipCalloutLayout({ ...options, content: { title: 'Run', notes: ['Long '.repeat(400)] },
        anchor: { visibility, associationLabel: 'Run is outside the capture' } });
      expect(layout.mode).toBe('headline');
      expect(layout.lines.join(' ')).toContain('Run is outside the capture');
      expect(layout.tail).toBeNull();
      expect(layout.side).toBe('unanchored');
    });

    it('rejects invalid anchors and impossible fits instead of omitting details', () => {
      expect(() => computeTooltipCalloutLayout({ ...options, anchor: { visibility: 'visible' } })).toThrow(/anchor/i);
      expect(() => computeTooltipCalloutLayout({ ...options, bounds: { x: 0, y: 0, width: 10, height: 20 } })).toThrow(RangeError);
      expect(() => computeTooltipCalloutLayout({ ...options, protectedRects: [options.bounds] })).toThrow(RangeError);
    });

    it('has bounded placement work independent of activity collections and exposes its browser bridge', () => {
      const activities = new Proxy([], { get() { throw new Error('Must not scan activities'); } });
      const first = computeTooltipCalloutLayout({ ...options, activities });
      expect(first.candidateChecks).toBe(4);
      expect(computeTooltipCalloutLayout(options)).toEqual(first);
      const context = { window: {} };
      require('vm').runInNewContext(fsSource(), context);
      expect(context.window.exportUtils.computeTooltipCalloutLayout(options)).toEqual(first);
    });

    function fsSource() {
      return require('fs').readFileSync(require('path').join(__dirname, '../src/export-utils.js'), 'utf8');
    }
  });

  describe('computeExportContentLayout', () => {
    const canvas = {
      canvasWidth: 1080,
      canvasHeight: 1080,
      headerHeight: 190,
      marginX: 60,
      topGap: 15,
      bottomMargin: 24,
      contextGap: 12
    };

    it.each([
      ['square', 1080, 1080, { x: 48, y: 253, width: 984, height: 779 }],
      ['portrait', 1080, 1350, { x: 48, y: 253, width: 984, height: 1049 }]
    ])('keeps the %s visualization inside the fixed export dimensions', (_format, canvasWidth, canvasHeight, expectedVisualization) => {
      const layout = computeExportContentLayout({
        canvasWidth,
        canvasHeight,
        headerHeight: 190,
        marginX: 48,
        topGap: 15,
        bottomMargin: 48,
        contextHeight: 36,
        contextGap: 12
      });

      expect(layout.visualization).toEqual(expectedVisualization);
      expect(layout.visualization.x).toBeGreaterThanOrEqual(48);
      expect(layout.visualization.x + layout.visualization.width).toBeLessThanOrEqual(canvasWidth - 48);
      expect(layout.visualization.y + layout.visualization.height).toBeLessThanOrEqual(canvasHeight - 48);
    });

    it('omits the context region and gives the chart the remaining height when context is empty', () => {
      const layout = computeExportContentLayout({ ...canvas, contextHeight: 0 });

      expect(layout.context).toBeNull();
      expect(layout.visualization).toEqual({ x: 60, y: 205, width: 960, height: 851 });
    });

    it('reserves only the compact context height and keeps the remaining chart bounds', () => {
      const layout = computeExportContentLayout({ ...canvas, contextHeight: 36 });

      expect(layout.context).toEqual({ x: 60, y: 205, width: 960, height: 36 });
      expect(layout.visualization).toEqual({ x: 60, y: 253, width: 960, height: 803 });
    });

    it.each([undefined, 0, -24])('preserves the exact no-pin output for annotationHeight %p', annotationHeight => {
      expect(computeExportContentLayout({ ...canvas, contextHeight: 36, annotationHeight })).toEqual({
        context: { x: 60, y: 205, width: 960, height: 36 },
        visualization: { x: 60, y: 253, width: 960, height: 803 }
      });
    });

    it('preserves the exact default output and reserves annotation below a context-free visualization', () => {
      expect(computeExportContentLayout()).toEqual({
        context: null, visualization: { x: 60, y: 205, width: 960, height: 851 }
      });
      expect(computeExportContentLayout({ annotationHeight: 280 })).toEqual({
        context: null,
        visualization: { x: 60, y: 205, width: 960, height: 571 },
        annotation: { x: 60, y: 776, width: 960, height: 280 }
      });
    });

    it('reserves a separate annotation below the chart without moving header/context/legend capture bounds', () => {
      const annotation = computeTooltipAnnotationLayout({ content: { title: 'Run' }, maxWidth: 960, maxHeight: 280, measureText: text => text.length * 10 });
      const layout = computeExportContentLayout({ ...canvas, contextHeight: 36, annotationHeight: annotation.height });
      expect(layout).toEqual({
        context: { x: 60, y: 205, width: 960, height: 36 },
        visualization: { x: 60, y: 253, width: 960, height: 755 },
        annotation: { x: 60, y: 1008, width: 960, height: 48 }
      });
      expect(layout.annotation.y).toBe(layout.visualization.y + layout.visualization.height);
      expect(layout.annotation.y + layout.annotation.height).toBe(canvas.canvasHeight - canvas.bottomMargin);
    });

    it('rejects annotation reservations that would overlap protected context or overflow the canvas', () => {
      expect(() => computeExportContentLayout({ ...canvas, contextHeight: 36, annotationHeight: 804 })).toThrow(/annotation.*fit/i);
    });

    it.each([[1600, 900], [400, 900]])('fits a %i x %i capture proportionally within the available visualization bounds', (sourceWidth, sourceHeight) => {
      const bounds = computeExportContentLayout({ ...canvas, contextHeight: 36 }).visualization;
      const fit = computeContainFit(sourceWidth, sourceHeight, bounds.width, bounds.height);

      expect(fit.drawWidth).toBeLessThanOrEqual(bounds.width);
      expect(fit.drawHeight).toBeLessThanOrEqual(bounds.height);
      expect(fit.drawWidth / fit.drawHeight).toBeCloseTo(sourceWidth / sourceHeight);
      expect(Math.max(fit.drawWidth / bounds.width, fit.drawHeight / bounds.height)).toBeCloseTo(1);
    });
  });

  describe('computeExportMetadataLayout', () => {
    it('places each metadata block after the previous block', () => {
      const layout = computeExportMetadataLayout({
        startY: 740,
        filterHeight: 50,
        controlsHeight: 100,
        legendHeight: 28,
        footerStart: 960,
        spacing: 12
      });

      expect(layout.filters).toEqual({ y: 740, height: 50 });
      expect(layout.controls.y).toBe(802);
      expect(layout.legend.y).toBe(914);
      expect(layout.legend.y).toBeGreaterThanOrEqual(layout.controls.y + layout.controls.height + 12);
      expect(layout.contentBottom).toBeLessThanOrEqual(960);
    });

    it('clamps oversized metadata before the footer boundary', () => {
      const layout = computeExportMetadataLayout({
        startY: 740,
        filterHeight: 80,
        controlsHeight: 180,
        legendHeight: 40,
        footerStart: 930,
        spacing: 12
      });

      expect(layout.contentBottom).toBeLessThanOrEqual(930);
      expect(layout.overflow).toBe(true);
    });
  });

  describe('computeFilterRowLayout', () => {
    it('keeps one row fully padded and separates wrapped rows', () => {
      const layout = computeFilterRowLayout({
        widths: [120, 140, 100],
        availableWidth: 400,
        rowHeight: 34,
        rowPaddingBottom: 12,
        gap: 10
      });

      expect(layout.rows).toHaveLength(1);
      expect(layout.rows[0].bottom - layout.rows[0].start).toBe(46);
      expect(layout.totalHeight).toBe(46);
    });

    it('creates non-overlapping rows for narrow content', () => {
      const layout = computeFilterRowLayout({
        widths: [200, 200, 200],
        availableWidth: 400,
        rowHeight: 34,
        rowPaddingBottom: 12,
        gap: 10
      });

      expect(layout.rows).toHaveLength(3);
      expect(layout.rows[1].start).toBeGreaterThan(layout.rows[0].bottom);
      expect(layout.rows[2].start).toBeGreaterThan(layout.rows[1].bottom);
    });
  });

  describe('getTabDisplayTitle', () => {
    it('returns the expected label for every supported tab', () => {
      expect(getTabDisplayTitle('totalDistance')).toBe('Distance');
      expect(getTabDisplayTitle('paceMetrics')).toBe('Pace vs ...');
      expect(getTabDisplayTitle('equipment')).toBe('Equipment mileage');
      expect(getTabDisplayTitle('equipmentTimeline')).toBe('Equipment Timeline');
      expect(getTabDisplayTitle('personalBests')).toBe('Personal Bests');
      expect(getTabDisplayTitle('heatmap')).toBe('GPS Heatmap');
      expect(getTabDisplayTitle('workoutTime')).toBe('Workout Time');
    });

    it('returns null for an unknown tab', () => {
      expect(getTabDisplayTitle('somethingElse')).toBeNull();
    });
  });

  describe('generateExportFilename', () => {
    it('matches the trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png pattern', () => {
      const date = new Date(2026, 8, 17, 9, 5, 3); // 2026-09-17 09:05:03 local
      expect(generateExportFilename('paceMetrics', date)).toBe('trianalytica-pace-metrics-20260917-090503.png');
      expect(generateExportFilename('totalDistance', date)).toBe('trianalytica-distance-20260917-090503.png');
      expect(generateExportFilename('equipmentTimeline', date)).toBe('trianalytica-equipment-timeline-20260917-090503.png');
      expect(generateExportFilename('workoutTime', date)).toBe('trianalytica-workout-time-20260917-090503.png');
    });

    it('returns null for an unknown tab or invalid date', () => {
      expect(generateExportFilename('unknown', new Date())).toBeNull();
      expect(generateExportFilename('heatmap', new Date('not-a-date'))).toBeNull();
    });
  });

  describe('hasExportableContent', () => {
    it('returns the boolean flag for the given tab', () => {
      expect(hasExportableContent('heatmap', { heatmap: true })).toBe(true);
      expect(hasExportableContent('heatmap', { heatmap: false })).toBe(false);
    });

    it('returns false when the flag is missing or flags object is absent', () => {
      expect(hasExportableContent('heatmap', {})).toBe(false);
      expect(hasExportableContent('heatmap', null)).toBe(false);
      expect(hasExportableContent('heatmap', undefined)).toBe(false);
    });
  });

  describe('export target metadata', () => {
    it('deep-copies legend metadata and keeps all existing target metadata independent in both directions', () => {
      const input = {
        kind: 'tab', key: 'paceMetrics', title: 'Pace', targetElementId: 'chart', hasData: true,
        filters: [{ label: 'Sport', value: 'Run' }],
        availableControls: [{ label: 'View', controls: [{ label: 'Pace', selected: true }] }],
        legend: { title: 'Measures', items: [{ label: 'Pace', color: '#123456', metadata: { units: ['min/km'] } }], metadata: { palette: ['red'] } }
      };
      const target = createExportTarget(input);
      expect(target.legend).toEqual(input.legend);
      input.legend.items[0].metadata.units[0] = 'km/h';
      input.legend.items.push({ label: 'Speed' });
      input.legend.metadata.palette[0] = 'blue';
      input.filters[0].value = 'Bike';
      input.availableControls[0].controls[0].selected = false;
      expect(target.legend.items).toEqual([{ label: 'Pace', color: '#123456', metadata: { units: ['min/km'] } }]);
      expect(target.legend.metadata.palette).toEqual(['red']);
      expect(target.filters[0].value).toBe('Run');
      expect(target.availableControls[0].controls[0].selected).toBe(true);
      target.legend.items[0].label = 'Changed';
      target.legend.metadata.palette.push('green');
      expect(input.legend.items[0].label).toBe('Pace');
      expect(input.legend.metadata.palette).toEqual(['blue']);
    });

    it('validates a visualization target and preserves its context', () => {
      const target = createExportTarget({
        kind: 'tab',
        key: 'paceMetrics',
        title: 'Pace vs ...',
        targetElementId: 'paceMetricsChartWrapper',
        hasData: true,
        filters: [{ label: 'Sport', value: 'Run' }],
        availableControls: [{
          label: 'Views',
          controls: [{ label: 'Pace vs ...', selected: true }]
        }],
        legend: getExportLegend('paceMetrics')
      });

      expect(target).toMatchObject({
        kind: 'tab',
        key: 'paceMetrics',
        hasData: true,
        targetElementId: 'paceMetricsChartWrapper'
      });
      expect(target.filters).toEqual([{ label: 'Sport', value: 'Run' }]);
      expect(target.availableControls).toEqual([{
        label: 'Views',
        controls: [{ label: 'Pace vs ...', selected: true }]
      }]);
      expect(target.legend).toBeNull();
    });

    it('rejects incomplete or unsupported targets', () => {
      expect(() => createExportTarget({ kind: 'tab', key: 'unknown', title: 'X', targetElementId: 'x', hasData: true }))
        .toThrow('Unsupported export target');
      expect(() => createExportTarget({ kind: 'pb-tile', key: 'run-5k', title: '5K', hasData: true }))
        .toThrow('Export target requires a DOM element id');
    });
  });

  describe('filter and legend context', () => {
    it('keeps only non-empty filter summaries', () => {
      expect(summarizeFilters([
        { label: 'Sport', value: 'Run' },
        { label: 'Date range', value: 'All' },
        { label: 'Metric', value: '' },
        { label: '', value: 'Ignored' }
      ])).toEqual([
        { label: 'Sport', value: 'Run' },
        { label: 'Date range', value: 'All' }
      ]);
    });

    it('provides only applicable legends', () => {
      expect(getExportLegend('paceMetrics')).toBeNull();
      expect(getExportLegend('totalDistance')).toBeNull();
      expect(getExportLegend('personalBests')).toBeNull();
    });

    it('keeps available control labels and selected states in order', () => {
      expect(summarizeAvailableControls([
        {
          label: 'Sport',
          controls: [
            { label: 'All Sports', selected: true },
            { label: 'Run', selected: false },
            { label: '', selected: true, available: true },
            { label: 'Hidden', selected: false, available: false }
          ]
        },
        { label: 'Empty', controls: [] }
      ])).toEqual([
        {
          label: 'Sport',
          controls: [
            { label: 'All Sports', selected: true },
            { label: 'Run', selected: false }
          ]
        }
      ]);
    });
  });

  describe('asset paths and target slugs', () => {
    it('returns local asset paths and stable PB tile slugs', () => {
      expect(getExportAssetPaths()).toEqual({
        logo: 'assets/logo.png'
      });
      expect(getExportTargetSlug({ kind: 'pb-tile', key: 'run-5k' })).toBe('pb-run-5k');
      expect(getExportTargetSlug({ kind: 'tab', key: 'paceMetrics' })).toBe('pace-metrics');
    });

    it('exposes header-only layout and PB content-fit settings', () => {
      expect(getExportLayoutConfig()).toMatchObject({
        footer: true,
        headerIncludesDomain: false,
        headerIncludesQrCode: false,
        pbContentMargin: 48
      });
    });

    it('preserves a stable browser-capturable PB wrapper target', () => {
      expect(createExportTarget({
        kind: 'pb-tile',
        key: 'run-5k',
        title: 'Run 5K',
        targetElementId: 'pbDetailCaptureTarget',
        hasData: true,
        detailKey: 'run-5k'
      })).toMatchObject({
        kind: 'pb-tile',
        targetElementId: 'pbDetailCaptureTarget',
        detailKey: 'run-5k'
      });
    });

    it('returns the canonical public domain', () => {
      expect(getExportBrandConfig().domain).toBe('https://dennis-e.github.io/Triathlon/');
    });
  });
});
