const {
  hasGpsData,
  snapToGridCell,
  buildRouteSegments,
  computeRouteSegmentBounds,
  computeRouteSegmentStyle,
  segmentIntersectsBounds,
  buildLowZoomRouteSegments,
  extendSegmentToMinLength
} = require('../src/heatmap-utils');

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

  describe('snapToGridCell', () => {
    it('returns null for invalid input', () => {
      expect(snapToGridCell(NaN, 11.5)).toBeNull();
      expect(snapToGridCell(48.1, undefined)).toBeNull();
    });

    it('maps points that are clearly within the same ~15m cell to the same key', () => {
      const base = snapToGridCell(48.1, 11.5);
      // ~2m north - well inside the same cell, away from any boundary
      const nearby = snapToGridCell(48.100018, 11.5);
      expect(nearby).toBe(base);
    });

    it('maps points that are clearly far apart to different keys', () => {
      const base = snapToGridCell(48.1, 11.5);
      // ~50m north - well beyond the 15m cell size
      const far = snapToGridCell(48.10045, 11.5);
      expect(far).not.toBe(base);
    });
  });

  describe('buildRouteSegments', () => {
    it('returns an empty object for missing input', () => {
      expect(buildRouteSegments(null)).toEqual({});
      expect(buildRouteSegments(undefined)).toEqual({});
    });

    it('builds a shared segment (count 2) and a unique segment (count 1) from two activities', () => {
      const sharedStart = [48.10000, 11.50000];
      const sharedEnd = [48.10500, 11.50000];
      const uniqueEnd = [48.10000, 11.51000];

      const tracks = {
        '1': { sport: 'Run', points: [sharedStart, sharedEnd] },
        '2': { sport: 'Run', points: [sharedStart, sharedEnd, uniqueEnd] }
      };

      const segments = buildRouteSegments(tracks);
      const values = Object.values(segments);

      const shared = values.find(s => s.count === 2);
      const unique = values.find(s => s.count === 1);
      expect(shared).toBeDefined();
      expect(unique).toBeDefined();
      expect(values.length).toBe(2);
    });

    it('merges GPS-noise traces that land in the same grid cell (order-independent)', () => {
      const a = [48.10000, 11.50000];
      const bForward = [48.10500, 11.50000];
      // Same physical point as bForward, but traversed in the opposite direction by another activity
      const tracks = {
        '1': { sport: 'Run', points: [a, bForward] },
        '2': { sport: 'Run', points: [bForward, a] }
      };

      const segments = buildRouteSegments(tracks);
      const values = Object.values(segments);
      expect(values.length).toBe(1);
      expect(values[0].count).toBe(2);
    });

    it('filters by sport', () => {
      const tracks = {
        '1': { sport: 'Run', points: [[48.1, 11.5], [48.11, 11.5]] },
        '2': { sport: 'Bike', points: [[48.2, 11.6], [48.21, 11.6]] }
      };
      const runSegments = buildRouteSegments(tracks, { sportFilter: 'Run' });
      const bikeSegments = buildRouteSegments(tracks, { sportFilter: 'Bike' });
      expect(Object.keys(runSegments).length).toBe(1);
      expect(Object.keys(bikeSegments).length).toBe(1);
      expect(Object.values(runSegments)[0].coords[0]).toEqual([48.1, 11.5]);
      expect(Object.values(bikeSegments)[0].coords[0]).toEqual([48.2, 11.6]);
    });

    it('excludes activities without GPS track data without throwing', () => {
      const tracks = {
        '1': { sport: 'Run', points: [] },
        '2': { sport: 'Run' },
        '3': { sport: 'Run', points: [[48.1, 11.5], [48.11, 11.5]] }
      };
      expect(() => buildRouteSegments(tracks)).not.toThrow();
      const segments = buildRouteSegments(tracks);
      expect(Object.keys(segments).length).toBe(1);
    });
  });

  describe('computeRouteSegmentBounds', () => {
    it('returns null for empty input', () => {
      expect(computeRouteSegmentBounds({})).toBeNull();
      expect(computeRouteSegmentBounds([])).toBeNull();
      expect(computeRouteSegmentBounds(null)).toBeNull();
    });

    it('computes bounds from a segment map', () => {
      const segments = {
        a: { coords: [[48.1, 11.5], [48.3, 11.9]] },
        b: { coords: [[47.9, 11.2], [48.0, 11.3]] }
      };
      expect(computeRouteSegmentBounds(segments)).toEqual([[47.9, 11.2], [48.3, 11.9]]);
    });

    it('computes bounds from a segment array', () => {
      const segments = [
        { coords: [[48.1, 11.5], [48.3, 11.9]] },
        { coords: [[47.9, 11.2], [48.0, 11.3]] }
      ];
      expect(computeRouteSegmentBounds(segments)).toEqual([[47.9, 11.2], [48.3, 11.9]]);
    });
  });

  describe('computeRouteSegmentStyle', () => {
    it('returns the legible minimum floor for a single visit', () => {
      const style = computeRouteSegmentStyle(1);
      expect(style.weight).toBeGreaterThan(0);
      expect(style.opacity).toBeGreaterThan(0);
      expect(style.weight).toBeLessThan(computeRouteSegmentStyle(50).weight);
    });

    it('increases weight and opacity monotonically with count', () => {
      const low = computeRouteSegmentStyle(1);
      const mid = computeRouteSegmentStyle(5);
      const high = computeRouteSegmentStyle(20);
      expect(mid.weight).toBeGreaterThan(low.weight);
      expect(high.weight).toBeGreaterThan(mid.weight);
      expect(mid.opacity).toBeGreaterThan(low.opacity);
      expect(high.opacity).toBeGreaterThan(mid.opacity);
    });

    it('clamps at the configured maximum regardless of how large count is', () => {
      const capped = computeRouteSegmentStyle(50, { maxWeight: 9, maxOpacity: 0.95 });
      const wayOver = computeRouteSegmentStyle(100000, { maxWeight: 9, maxOpacity: 0.95 });
      expect(wayOver.weight).toBeLessThanOrEqual(9);
      expect(wayOver.opacity).toBeLessThanOrEqual(0.95);
      expect(wayOver.weight).toBeCloseTo(capped.weight, 0);
    });

    it('handles invalid/out-of-range counts without throwing', () => {
      expect(() => computeRouteSegmentStyle(0)).not.toThrow();
      expect(() => computeRouteSegmentStyle(-5)).not.toThrow();
      expect(() => computeRouteSegmentStyle(NaN)).not.toThrow();
      expect(computeRouteSegmentStyle(0).weight).toBeGreaterThan(0);
    });
  });

  describe('segmentIntersectsBounds', () => {
    const viewportBounds = [[48.0, 11.0], [48.2, 11.2]];

    it('returns true for a segment fully inside the bounds', () => {
      const segment = { coords: [[48.05, 11.05], [48.1, 11.1]] };
      expect(segmentIntersectsBounds(segment, viewportBounds)).toBe(true);
    });

    it('returns false for a segment fully outside the bounds', () => {
      const segment = { coords: [[49.0, 12.0], [49.1, 12.1]] };
      expect(segmentIntersectsBounds(segment, viewportBounds)).toBe(false);
    });

    it('returns true for a segment straddling the bounds edge (partial overlap)', () => {
      const segment = { coords: [[48.15, 11.15], [48.25, 11.25]] };
      expect(segmentIntersectsBounds(segment, viewportBounds)).toBe(true);
    });

    it('returns true for a segment just outside bounds but within paddingDegrees', () => {
      const segment = { coords: [[48.21, 11.05], [48.22, 11.06]] };
      expect(segmentIntersectsBounds(segment, viewportBounds, 0)).toBe(false);
      expect(segmentIntersectsBounds(segment, viewportBounds, 0.05)).toBe(true);
    });

    it('returns false for invalid input', () => {
      expect(segmentIntersectsBounds(null, viewportBounds)).toBe(false);
      expect(segmentIntersectsBounds({ coords: [] }, viewportBounds)).toBe(false);
      expect(segmentIntersectsBounds({ coords: [[48.05, 11.05], [48.1, 11.1]] }, null)).toBe(false);
    });
  });

  describe('buildLowZoomRouteSegments', () => {
    it('merges several full-detail segments in the same coarse cell, summing counts', () => {
      const segments = {
        a: { coords: [[48.10000, 11.50000], [48.10001, 11.50001]], count: 2 },
        b: { coords: [[48.10002, 11.50002], [48.10003, 11.50003]], count: 5 }
      };
      const aggregated = buildLowZoomRouteSegments(segments, { cellMeters: 300 });
      const values = Object.values(aggregated);
      expect(values.length).toBe(1);
      expect(values[0].count).toBe(7);
    });

    it('does not mutate the input segments', () => {
      const segments = {
        a: { coords: [[48.1, 11.5], [48.10001, 11.50001]], count: 3 }
      };
      const snapshot = JSON.parse(JSON.stringify(segments));
      buildLowZoomRouteSegments(segments, { cellMeters: 300 });
      expect(segments).toEqual(snapshot);
    });

    it('returns an empty result for empty input without throwing', () => {
      expect(buildLowZoomRouteSegments({})).toEqual({});
      expect(buildLowZoomRouteSegments([])).toEqual({});
      expect(() => buildLowZoomRouteSegments(null)).not.toThrow();
    });
  });

  describe('extendSegmentToMinLength', () => {
    it('leaves points unchanged when already at or above the minimum length', () => {
      const [p1, p2] = extendSegmentToMinLength([0, 0], [10, 0], { minLengthPx: 5 });
      expect(p1).toEqual([0, 0]);
      expect(p2).toEqual([10, 0]);
    });

    it('extends symmetrically from the midpoint along the original direction when too short', () => {
      const [p1, p2] = extendSegmentToMinLength([0, 0], [1, 0], { minLengthPx: 5 });
      const length = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      expect(length).toBeCloseTo(5, 5);
      // midpoint should remain at (0.5, 0)
      expect((p1[0] + p2[0]) / 2).toBeCloseTo(0.5, 5);
    });

    it('draws a fixed horizontal dash for a degenerate zero-length segment', () => {
      const [p1, p2] = extendSegmentToMinLength([3, 4], [3, 4], { minLengthPx: 2 });
      const length = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      expect(length).toBeCloseTo(2, 5);
      expect(p1[1]).toBe(4);
      expect(p2[1]).toBe(4);
    });
  });
});
