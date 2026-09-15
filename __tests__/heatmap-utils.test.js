const { hasGpsData, buildHeatmapPoints, computeHeatmapBounds } = require('../src/heatmap-utils');

describe('heatmap-utils', () => {
  const sampleTracks = {
    '1': { sport: 'Run', points: [[48.1, 11.5], [48.2, 11.6]] },
    '2': { sport: 'Bike', points: [[48.3, 11.7]] },
    '3': { sport: 'Swim', points: [] }
  };

  describe('hasGpsData', () => {
    it('returns false for missing or empty input', () => {
      expect(hasGpsData(null)).toBe(false);
      expect(hasGpsData(undefined)).toBe(false);
      expect(hasGpsData({})).toBe(false);
    });

    it('returns false when all tracks have no points', () => {
      expect(hasGpsData({ '1': { sport: 'Run', points: [] } })).toBe(false);
    });

    it('returns true when at least one track has points', () => {
      expect(hasGpsData(sampleTracks)).toBe(true);
    });
  });

  describe('buildHeatmapPoints', () => {
    it('flattens all tracks into [lat, lon, intensity] points by default', () => {
      const points = buildHeatmapPoints(sampleTracks);
      expect(points).toEqual([
        [48.1, 11.5, 1],
        [48.2, 11.6, 1],
        [48.3, 11.7, 1]
      ]);
    });

    it('filters points by sport when sportFilter is provided', () => {
      const points = buildHeatmapPoints(sampleTracks, { sportFilter: 'Bike' });
      expect(points).toEqual([[48.3, 11.7, 1]]);
    });

    it('returns an empty array for missing input', () => {
      expect(buildHeatmapPoints(null)).toEqual([]);
      expect(buildHeatmapPoints(undefined)).toEqual([]);
    });

    it('skips tracks without a points array', () => {
      const points = buildHeatmapPoints({ '1': { sport: 'Run' } });
      expect(points).toEqual([]);
    });
  });

  describe('computeHeatmapBounds', () => {
    it('returns null for empty input', () => {
      expect(computeHeatmapBounds([])).toBeNull();
      expect(computeHeatmapBounds(null)).toBeNull();
    });

    it('computes the bounding box of all points', () => {
      const points = [[48.1, 11.5, 1], [48.3, 11.9, 1], [47.9, 11.2, 1]];
      expect(computeHeatmapBounds(points)).toEqual([[47.9, 11.2], [48.3, 11.9]]);
    });
  });
});
