const {
  computeSquareFit,
  computeContainFit,
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
  getExportTargetSlug
} = require('../src/export-utils');

describe('export-utils', () => {
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
    })).toMatchObject({ targetElementId: 'trainingCalendarYears', hasData: true });
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
      expect(getTabDisplayTitle('totalDistance')).toBe('Total distance');
      expect(getTabDisplayTitle('heartratePace')).toBe('Heartrate vs Pace');
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
      expect(generateExportFilename('heartratePace', date)).toBe('trianalytica-heart-rate-pace-20260917-090503.png');
      expect(generateExportFilename('totalDistance', date)).toBe('trianalytica-total-distance-20260917-090503.png');
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
    it('validates a visualization target and preserves its context', () => {
      const target = createExportTarget({
        kind: 'tab',
        key: 'heartratePace',
        title: 'Heartrate vs Pace',
        targetElementId: 'heartratePaceChartWrapper',
        hasData: true,
        filters: [{ label: 'Sport', value: 'Run' }],
        availableControls: [{
          label: 'Views',
          controls: [{ label: 'Heartrate vs Pace', selected: true }]
        }],
        legend: getExportLegend('heartratePace')
      });

      expect(target).toMatchObject({
        kind: 'tab',
        key: 'heartratePace',
        hasData: true,
        targetElementId: 'heartratePaceChartWrapper'
      });
      expect(target.filters).toEqual([{ label: 'Sport', value: 'Run' }]);
      expect(target.availableControls).toEqual([{
        label: 'Views',
        controls: [{ label: 'Heartrate vs Pace', selected: true }]
      }]);
      expect(target.legend.items.map(item => item.label)).toEqual(['Heart rate', 'Pace']);
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
      expect(getExportLegend('heartratePace').items).toHaveLength(2);
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
        logo: 'assets/logo.png',
        strava: 'assets/Strava_Logo.svg',
        instagram: 'assets/Instagram_logo_2016.svg',
        qrCode: 'assets/QR Code webpage.png'
      });
      expect(getExportTargetSlug({ kind: 'pb-tile', key: 'run-5k' })).toBe('pb-run-5k');
      expect(getExportTargetSlug({ kind: 'tab', key: 'heartratePace' })).toBe('heart-rate-pace');
    });

    it('exposes header-only layout and PB content-fit settings', () => {
      expect(getExportLayoutConfig()).toMatchObject({
        footer: false,
        headerIncludesDomain: true,
        headerIncludesQrCode: true,
        pbContentMargin: expect.any(Number)
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
