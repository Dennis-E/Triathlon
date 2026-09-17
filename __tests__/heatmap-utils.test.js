const {
  hasGpsData,
  buildRouteSegments,
  computeRouteSegmentBounds,
  computeRouteSegmentStyle,
  computeRouteFrequencyScale,
  normalizeRouteFrequency,
  computeRouteSegmentColor,
  buildFrequencyScaleGuide,
  distanceMeters,
  computeUndirectedHeading,
  headingDifferenceDegrees,
  interpolateTrackProbes,
  pointToSegmentDistance,
  buildActivitySummaryIndex,
  sampleDistinct,
  buildActivityTooltipModel,
  buildScreenSegmentIndex,
  hitTestScreenSegmentIndex,
  segmentIntersectsBounds,
  buildLowZoomRouteSegments,
  extendSegmentToMinLength,
  sortSegmentsForDrawOrder
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

  describe('geometry helpers', () => {
    it('computes geographic distance and rejects invalid coordinates', () => {
      expect(distanceMeters([48.1, 11.5], [48.10027, 11.5])).toBeCloseTo(30, 0);
      expect(distanceMeters([48.1, 11.5], [48.1, 11.5])).toBe(0);
      expect(distanceMeters([NaN, 11.5], [48.1, 11.5])).toBe(Infinity);
    });

    it('computes direction-independent headings and differences', () => {
      const forward = computeUndirectedHeading([48.1, 11.5], [48.11, 11.5]);
      const reverse = computeUndirectedHeading([48.11, 11.5], [48.1, 11.5]);
      expect(forward).toBeCloseTo(reverse, 6);
      expect(headingDifferenceDegrees(10, 40)).toBe(30);
      expect(headingDifferenceDegrees(5, 175)).toBe(10);
      expect(computeUndirectedHeading([48.1, 11.5], [48.1, 11.5])).toBeNull();
    });

    it('interpolates track probes no farther apart than the configured spacing', () => {
      const probes = interpolateTrackProbes([[48.1, 11.5], [48.101, 11.5]], 30);
      expect(probes.length).toBeGreaterThan(2);
      for (let index = 1; index < probes.length; index++) {
        expect(distanceMeters(probes[index - 1], probes[index])).toBeLessThanOrEqual(30.1);
      }
      expect(interpolateTrackProbes(null, 30)).toEqual([]);
    });

    it('computes point-to-segment distance including zero-length segments', () => {
      expect(pointToSegmentDistance([5, 3], [0, 0], [10, 0])).toBeCloseTo(3, 6);
      expect(pointToSegmentDistance([4, 5], [1, 1], [1, 1])).toBeCloseTo(5, 6);
      expect(pointToSegmentDistance([NaN, 0], [0, 0], [1, 1])).toBe(Infinity);
    });
  });

  describe('buildRouteSegments', () => {
    const offsetLon = (meters, latitude = 48.1) => meters / (111320 * Math.cos(latitude * Math.PI / 180));
    const northRoute = (lonOffsetMeters = 0, reverse = false) => {
      const lon = 11.5 + offsetLon(lonOffsetMeters);
      const points = [[48.1, lon], [48.103, lon]];
      return reverse ? points.reverse() : points;
    };

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
      expect(values.every(segment => segment.count === segment.activityIds.length)).toBe(true);
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
      expect(values.length).toBeGreaterThan(0);
      expect(values.every(segment => segment.count === 2)).toBe(true);
    });

    it('filters by sport', () => {
      const tracks = {
        '1': { sport: 'Run', points: [[48.1, 11.5], [48.11, 11.5]] },
        '2': { sport: 'Bike', points: [[48.2, 11.6], [48.21, 11.6]] }
      };
      const runSegments = buildRouteSegments(tracks, { sportFilter: 'Run' });
      const bikeSegments = buildRouteSegments(tracks, { sportFilter: 'Bike' });
      expect(Object.keys(runSegments).length).toBeGreaterThan(0);
      expect(Object.keys(bikeSegments).length).toBeGreaterThan(0);
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
      expect(Object.keys(segments).length).toBeGreaterThan(0);
    });

    it('keeps a valid route shorter than the matching continuity threshold visible', () => {
      const segments = Object.values(buildRouteSegments({
        short: { sport: 'Run', points: [[48.1, 11.5], [48.10045, 11.5]] }
      }));
      expect(segments).toHaveLength(1);
      expect(segments[0]).toMatchObject({ activityIds: ['short'], count: 1 });
    });

    it('matches sustained forward and reverse corridors within 30 meters', () => {
      const tracks = {
        c: { sport: 'Run', points: northRoute(29, true) },
        a: { sport: 'Run', points: northRoute(0) },
        b: { sport: 'Run', points: northRoute(20) }
      };
      const segments = Object.values(buildRouteSegments(tracks));
      const shared = segments.filter(segment => segment.count === 3);

      expect(shared.length).toBeGreaterThan(0);
      expect(shared.every(segment => segment.activityIds.join(',') === 'a,b,c')).toBe(true);
      expect(shared.every(segment => segment.count === segment.activityIds.length)).toBe(true);
    });

    it('keeps sustained routes outside 30 meters separate', () => {
      const segments = Object.values(buildRouteSegments({
        a: { sport: 'Run', points: northRoute(0) },
        b: { sport: 'Run', points: northRoute(31) }
      }));
      expect(segments.some(segment => segment.count === 2)).toBe(false);
    });

    it('does not merge a perpendicular crossing or a short adjacent contact', () => {
      const eastWest = [[48.1015, 11.497], [48.1015, 11.503]];
      const brieflyParallelThenDiverges = [[48.1, 11.5 + offsetLon(20)], [48.1004, 11.5 + offsetLon(20)], [48.103, 11.506]];
      const segments = Object.values(buildRouteSegments({
        base: { sport: 'Run', points: northRoute(0) },
        cross: { sport: 'Run', points: eastWest },
        diverge: { sport: 'Run', points: brieflyParallelThenDiverges }
      }));
      expect(segments.some(segment => segment.count > 1)).toBe(false);
    });

    it('is deterministic across object insertion order and counts a looping activity once', () => {
      const forward = northRoute(0);
      const loop = [...forward, ...forward.slice().reverse(), ...forward];
      const first = buildRouteSegments({ b: { sport: 'Run', points: northRoute(20) }, a: { sport: 'Run', points: loop } });
      const second = buildRouteSegments({ a: { sport: 'Run', points: loop }, b: { sport: 'Run', points: northRoute(20) } });
      expect(first).toEqual(second);
      expect(Object.values(first).every(segment => new Set(segment.activityIds).size === segment.activityIds.length)).toBe(true);
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
    it('returns the same fixed weight/opacity regardless of visit-frequency count (FR-007/FR-008)', () => {
      const low = computeRouteSegmentStyle(1);
      const mid = computeRouteSegmentStyle(50);
      const high = computeRouteSegmentStyle(100000);
      expect(mid).toEqual(low);
      expect(high).toEqual(low);
      expect(low.weight).toBeGreaterThan(0);
      expect(low.opacity).toBeGreaterThan(0);
    });

    it('handles invalid/out-of-range counts without throwing and without changing style', () => {
      const baseline = computeRouteSegmentStyle(1);
      expect(() => computeRouteSegmentStyle(0)).not.toThrow();
      expect(() => computeRouteSegmentStyle(-5)).not.toThrow();
      expect(() => computeRouteSegmentStyle(NaN)).not.toThrow();
      expect(computeRouteSegmentStyle(0)).toEqual(baseline);
      expect(computeRouteSegmentStyle(-5)).toEqual(baseline);
      expect(computeRouteSegmentStyle(NaN)).toEqual(baseline);
    });
  });

  describe('route frequency scale', () => {
    it('normalizes equal multiplicative steps evenly across the logarithmic range', () => {
      const segments = [1, 10, 100, 1000].map(count => ({ count }));
      const scale = computeRouteFrequencyScale(segments);

      expect(scale.minCount).toBe(1);
      expect(scale.maxCount).toBe(1000);
      expect(scale.logMin).toBeCloseTo(0, 10);
      expect(scale.logMax).toBeCloseTo(Math.log(1000), 10);
      expect(scale.midpointCount).toBeCloseTo(Math.sqrt(1000), 10);
      expect(scale.hasRange).toBe(true);
      expect(normalizeRouteFrequency(1, scale)).toBeCloseTo(0, 10);
      expect(normalizeRouteFrequency(10, scale)).toBeCloseTo(1 / 3, 10);
      expect(normalizeRouteFrequency(100, scale)).toBeCloseTo(2 / 3, 10);
      expect(normalizeRouteFrequency(1000, scale)).toBeCloseTo(1, 10);
    });

    it('accepts segment maps, clamps values, and does not mutate input', () => {
      const segments = {
        low: { count: 10 },
        high: { count: 100 }
      };
      const snapshot = JSON.parse(JSON.stringify(segments));
      const scale = computeRouteFrequencyScale(segments);

      expect(segments).toEqual(snapshot);
      expect(normalizeRouteFrequency(1, scale)).toBe(0);
      expect(normalizeRouteFrequency(1000, scale)).toBe(1);
    });

    it('excludes non-finite, non-positive, missing, and non-numeric counts', () => {
      const scale = computeRouteFrequencyScale([
        { count: NaN },
        { count: Infinity },
        { count: 0 },
        { count: -1 },
        { count: '5' },
        {},
        { count: 2 },
        { count: 20 }
      ]);

      expect(scale.minCount).toBe(2);
      expect(scale.maxCount).toBe(20);
      expect(computeRouteFrequencyScale([{ count: 0 }, { count: NaN }])).toBeNull();
      expect(computeRouteFrequencyScale(null)).toBeNull();
    });

    it('represents one or many equal values as a constant non-extreme domain', () => {
      const one = computeRouteFrequencyScale([{ count: 7 }]);
      const equal = computeRouteFrequencyScale([{ count: 7 }, { count: 7 }]);

      expect(one).toMatchObject({ minCount: 7, maxCount: 7, hasRange: false });
      expect(equal).toMatchObject({ minCount: 7, maxCount: 7, hasRange: false });
      expect(normalizeRouteFrequency(7, one)).toBe(0);
      expect(normalizeRouteFrequency(NaN, equal)).toBe(0);
    });

    it('derives the scale for hundreds of thousands of segments without overflowing the call stack', () => {
      const segments = Array.from({ length: 450000 }, (_, index) => ({ count: (index % 1000) + 1 }));

      expect(() => computeRouteFrequencyScale(segments)).not.toThrow();
      expect(computeRouteFrequencyScale(segments)).toMatchObject({ minCount: 1, maxCount: 1000, hasRange: true });
    });
  });

  describe('computeRouteSegmentColor', () => {
    const segments = [1, 10, 100, 1000].map(count => ({ count }));
    const scale = computeRouteFrequencyScale(segments);

    it('uses the specified colors at the low, logarithmic-midpoint, and maximum positions', () => {
      expect(computeRouteSegmentColor(1, scale)).toBe('#60A5FA');
      expect(computeRouteSegmentColor(scale.midpointCount, scale)).toBe('#9E6690');
      expect(computeRouteSegmentColor(1000, scale)).toBe('#DC2626');
    });

    it('maps equal logarithmic steps directly across the complete blue-red range', () => {
      const colors = segments.map(segment => computeRouteSegmentColor(segment.count, scale));
      expect(colors).toEqual(['#60A5FA', '#897BB3', '#B3506D', '#DC2626']);
      expect(computeRouteSegmentColor(10, scale)).toBe(colors[1]);
    });

    it('uses a custom palette when both endpoint colors are supplied', () => {
      expect(computeRouteSegmentColor(1, scale, {
        lowColor: '#000000',
        extremeColor: '#FF0000'
      })).toBe('#000000');
      expect(computeRouteSegmentColor(1000, scale, {
        lowColor: '#000000',
        extremeColor: '#FF0000'
      })).toBe('#FF0000');
      expect(computeRouteSegmentColor(1, scale, { lowColor: '#000000' })).toBe('#60A5FA');
    });

    it('keeps invalid and constant-domain values at the visible light-blue fallback', () => {
      const constantScale = computeRouteFrequencyScale([{ count: 5 }, { count: 5 }]);
      expect(computeRouteSegmentColor(5, constantScale)).toBe('#60A5FA');
      expect(computeRouteSegmentColor(0, scale)).toBe('#60A5FA');
      expect(computeRouteSegmentColor(-1, scale)).toBe('#60A5FA');
      expect(computeRouteSegmentColor(NaN, scale)).toBe('#60A5FA');
      expect(computeRouteSegmentColor(1, null)).toBe('#60A5FA');
    });

    it('keeps decade steps ordered and pairwise distinguishable across a thousand-fold range', () => {
      const colors = [1, 10, 100, 1000].map(count => computeRouteSegmentColor(count, scale));
      expect(new Set(colors).size).toBe(4);
      expect(colors[0]).toBe('#60A5FA');
      expect(colors[3]).toBe('#DC2626');
    });
  });

  describe('buildFrequencyScaleGuide', () => {
    it('describes a varied scale with a geometric midpoint and accessible text', () => {
      const scale = computeRouteFrequencyScale([1, 10, 100, 1000].map(count => ({ count })));
      expect(buildFrequencyScaleGuide(scale)).toEqual({
        visible: true,
        mode: 'range',
        minCount: 1,
        midpointCount: 32,
        maxCount: 1000,
        ariaLabel: 'Frequency scale from 1 visit (light blue) through about 32 visits (midpoint) to 1000 visits (red).'
      });
    });

    it('describes a constant scale as one blue value without a red range', () => {
      const scale = computeRouteFrequencyScale([{ count: 5 }, { count: 5 }]);
      expect(buildFrequencyScaleGuide(scale)).toEqual({
        visible: true,
        mode: 'constant',
        count: 5,
        ariaLabel: 'All displayed routes have 5 visits.'
      });
    });

    it('returns a hidden model when no valid scale exists', () => {
      expect(buildFrequencyScaleGuide(null)).toEqual({
        visible: false,
        mode: 'hidden',
        ariaLabel: ''
      });
    });
  });

  describe('activity tooltip helpers', () => {
    const activities = [
      { id: 1, name: 'Morning Run', date: new Date('2026-01-02T08:00:00Z'), sport: 'Run', distance: 5.25, duration: 1500 },
      { id: 2, name: 'Pool', date: new Date('2026-01-03T08:00:00Z'), sport: 'Swim', distance: 1.5, duration: 1800 },
      { id: 3, name: '', date: null, sport: null, distance: NaN, duration: -1 }
    ];

    it('indexes normalized summaries by distinct valid activity ID with fallbacks and sport units', () => {
      const index = buildActivitySummaryIndex([...activities, { ...activities[0], name: 'Duplicate' }, { name: 'No id' }]);
      expect(index.size).toBe(3);
      expect(index.get('1')).toMatchObject({
        id: '1', name: 'Morning Run', dateLabel: '2026-01-02', sport: 'Run', distanceLabel: '5.3 km', durationLabel: '25:00'
      });
      expect(index.get('2')).toMatchObject({ distanceLabel: '1500 m', durationLabel: '30:00' });
      expect(index.get('3')).toMatchObject({
        name: 'Unknown activity', dateLabel: 'Unknown date', sport: 'Unknown sport', distanceLabel: '--', durationLabel: '--'
      });
    });

    it('samples distinct values without replacement using injected randomness', () => {
      const values = ['a', 'b', 'a', 'c', 'd'];
      expect(sampleDistinct(values, 3, () => 0)).toEqual(['a', 'd', 'c']);
      expect(new Set(sampleDistinct(values, 10, () => 0.5))).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('lists all activities through ten and samples exactly ten above ten', () => {
      const manyActivities = Array.from({ length: 11 }, (_, index) => ({
        id: String(index + 1), name: `Activity ${index + 1}`, date: new Date('2026-01-01'), sport: 'Bike', distance: 20, duration: 3600
      }));
      const index = buildActivitySummaryIndex(manyActivities);
      const all = buildActivityTooltipModel(['1', '2'], index, { segmentKey: 'small', random: () => 0 });
      const sampled = buildActivityTooltipModel(manyActivities.map(activity => activity.id), index, { segmentKey: 'large', random: () => 0 });

      expect(all.heading).toBe('2 activities');
      expect(all.activities).toHaveLength(2);
      expect(all.sampled).toBe(false);
      expect(sampled.heading).toBe('Random 10 of 11 activities');
      expect(sampled.activities).toHaveLength(10);
      expect(new Set(sampled.activities.map(activity => activity.id)).size).toBe(10);
      expect(sampled.sampled).toBe(true);
    });

    it('reports unresolved IDs without fabricating activity rows', () => {
      const index = buildActivitySummaryIndex(activities);
      const model = buildActivityTooltipModel(['1', 'missing', '2', 'missing'], index, { segmentKey: 'partial' });
      expect(model.totalCount).toBe(3);
      expect(model.availableCount).toBe(2);
      expect(model.availabilityNote).toBe('2 of 3 activities available');
      expect(model.activities.map(activity => activity.id)).toEqual(['1', '2']);
    });
  });

  describe('screen segment hit testing', () => {
    const segments = [
      { key: 'low', p1: [0, 16], p2: [96, 16], lineWidth: 2, segment: { key: 'low', count: 2 } },
      { key: 'high', p1: [0, 20], p2: [96, 20], lineWidth: 4, segment: { key: 'high', count: 9 } },
      { key: 'point', p1: [64, 64], p2: [64, 64], lineWidth: 2, segment: { key: 'point', count: 1 } }
    ];

    it('indexes padded strokes into 32-pixel cells and resolves nearby hits', () => {
      const index = buildScreenSegmentIndex(segments, { cellSizePx: 32, paddingPx: 5 });
      expect(index.cells.size).toBeGreaterThan(1);
      expect(hitTestScreenSegmentIndex(index, [10, 15]).key).toBe('low');
      expect(hitTestScreenSegmentIndex(index, [64, 69]).key).toBe('point');
      expect(hitTestScreenSegmentIndex(index, [10, 100])).toBeNull();
    });

    it('resolves overlaps by distance, then count, then lexical key', () => {
      const overlap = buildScreenSegmentIndex([
        { key: 'z', p1: [0, 10], p2: [50, 10], lineWidth: 2, segment: { key: 'z', count: 5 } },
        { key: 'b', p1: [0, 10], p2: [50, 10], lineWidth: 2, segment: { key: 'b', count: 8 } },
        { key: 'a', p1: [0, 10], p2: [50, 10], lineWidth: 2, segment: { key: 'a', count: 8 } }
      ]);
      expect(hitTestScreenSegmentIndex(overlap, [25, 10]).key).toBe('a');
    });

    it('returns a safe empty index for invalid input', () => {
      const index = buildScreenSegmentIndex(null);
      expect(index.cells.size).toBe(0);
      expect(hitTestScreenSegmentIndex(index, [0, 0])).toBeNull();
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
        a: { coords: [[48.10000, 11.50000], [48.10001, 11.50001]], count: 2, activityIds: ['1', '2'] },
        b: { coords: [[48.10002, 11.50002], [48.10003, 11.50003]], count: 5, activityIds: ['2', '3', '4', '5', '6'] }
      };
      const aggregated = buildLowZoomRouteSegments(segments, { cellMeters: 300 });
      const values = Object.values(aggregated);
      expect(values.length).toBe(1);
      expect(values[0].activityIds).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(values[0].count).toBe(6);
      expect(values[0].colorCount).toBe(5);
    });

    it('uses safe empty membership and valid source counts for colorCount', () => {
      const segments = [
        { coords: [[48.10000, 11.50000], [48.10001, 11.50001]], count: 2, activityIds: ['a', 'b'] },
        { coords: [[48.10002, 11.50002], [48.10003, 11.50003]], count: -7 },
        { coords: [[48.10004, 11.50004], [48.10005, 11.50005]], count: NaN, activityIds: [] },
        { coords: [[48.10006, 11.50006], [48.10007, 11.50007]], count: 5, activityIds: ['b', 'c'] }
      ];
      const aggregated = Object.values(buildLowZoomRouteSegments(segments, { cellMeters: 300 }));

      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].activityIds).toEqual(['a', 'b', 'c']);
      expect(aggregated[0].count).toBe(3);
      expect(aggregated[0].colorCount).toBe(5);
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

  describe('sortSegmentsForDrawOrder', () => {
    it('sorts ascending by count so higher-frequency segments are drawn last (on top)', () => {
      const segments = [
        { key: 'b', count: 5 },
        { key: 'a', count: 1 },
        { key: 'c', count: 10 }
      ];
      const sorted = sortSegmentsForDrawOrder(segments);
      expect(sorted.map(s => s.key)).toEqual(['a', 'b', 'c']);
    });

    it('breaks ties between equal counts by ascending lexical segment key (FR-003)', () => {
      const segments = [
        { key: 'zzz', count: 3 },
        { key: 'aaa', count: 3 },
        { key: 'mmm', count: 3 }
      ];
      const sorted = sortSegmentsForDrawOrder(segments);
      expect(sorted.map(s => s.key)).toEqual(['aaa', 'mmm', 'zzz']);
    });

    it('produces identical output regardless of input order (import-order independence)', () => {
      const segments = [
        { key: 'b', count: 5 },
        { key: 'a', count: 1 },
        { key: 'c', count: 10 }
      ];
      const shuffled = [segments[2], segments[0], segments[1]];
      expect(sortSegmentsForDrawOrder(shuffled)).toEqual(sortSegmentsForDrawOrder(segments));
    });

    it('supports an alternate count field (e.g. colorCount for low-zoom aggregates, FR-010)', () => {
      const segments = [
        { key: 'b', count: 999, colorCount: 1 },
        { key: 'a', count: 1, colorCount: 10 }
      ];
      const sorted = sortSegmentsForDrawOrder(segments, 'colorCount');
      expect(sorted.map(s => s.key)).toEqual(['b', 'a']);
    });

    it('does not mutate the input array and handles empty/invalid input safely', () => {
      const segments = [{ key: 'b', count: 5 }, { key: 'a', count: 1 }];
      const snapshot = JSON.parse(JSON.stringify(segments));
      sortSegmentsForDrawOrder(segments);
      expect(segments).toEqual(snapshot);
      expect(sortSegmentsForDrawOrder([])).toEqual([]);
      expect(sortSegmentsForDrawOrder(null)).toEqual([]);
    });
  });
});

