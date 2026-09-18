const {
  computeSquareFit,
  getTabDisplayTitle,
  generateExportFilename,
  hasExportableContent
} = require('../src/export-utils');

describe('export-utils', () => {
  describe('module shape', () => {
    it('exposes the expected functions', () => {
      expect(typeof computeSquareFit).toBe('function');
      expect(typeof getTabDisplayTitle).toBe('function');
      expect(typeof generateExportFilename).toBe('function');
      expect(typeof hasExportableContent).toBe('function');
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

  describe('getTabDisplayTitle', () => {
    it('returns the expected label for every supported tab', () => {
      expect(getTabDisplayTitle('totalDistance')).toBe('Total distance');
      expect(getTabDisplayTitle('heartratePace')).toBe('Heartrate vs Pace');
      expect(getTabDisplayTitle('equipment')).toBe('Equipment mileage');
      expect(getTabDisplayTitle('equipmentTimeline')).toBe('Equipment Timeline');
      expect(getTabDisplayTitle('personalBests')).toBe('Personal Bests');
      expect(getTabDisplayTitle('heatmap')).toBe('GPS Heatmap');
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
});
