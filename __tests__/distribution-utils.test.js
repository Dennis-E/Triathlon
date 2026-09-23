const {
  getMetricValue,
  filterActivitiesForDistribution,
  computeDistributionBuckets,
  formatMetricValue,
  groupBucketCountsBySport,
  computeIqrOutlierThreshold,
  getFireGradientColor,
  computeDurationNiceStep,
  getDistributionColor,
  getHistogramBoundaryTicks,
  getAllSportsPaceValue
} = require('../src/distribution-utils');

function makeActivity(overrides = {}) {
  return {
    sport: 'Run',
    date: new Date(2024, 0, 1),
    distance: 10,
    duration: 3000,
    elevationGain: 100,
    avgWatts: null,
    ...overrides
  };
}

describe('distribution-utils', () => {
  describe('getMetricValue', () => {
    it('returns distance for length metric', () => {
      expect(getMetricValue(makeActivity({ distance: 12.5 }), 'length')).toBe(12.5);
    });

    it('returns duration for duration metric', () => {
      expect(getMetricValue(makeActivity({ duration: 1800 }), 'duration')).toBe(1800);
    });

    it('returns elevationGain for elevation metric', () => {
      expect(getMetricValue(makeActivity({ elevationGain: 250 }), 'elevation')).toBe(250);
    });

    it('returns avgWatts for power metric, or null when missing', () => {
      expect(getMetricValue(makeActivity({ avgWatts: 210 }), 'power')).toBe(210);
      expect(getMetricValue(makeActivity({ avgWatts: null }), 'power')).toBeNull();
    });

    it('returns a sport-specific performance value for pace metric', () => {
      const runActivity = makeActivity({ sport: 'Run', distance: 10, duration: 3000 });
      expect(getMetricValue(runActivity, 'pace')).toBeCloseTo(5, 1);
    });

    it('returns null for pace when the activity has no sport', () => {
      expect(getMetricValue(makeActivity({ sport: null }), 'pace')).toBeNull();
    });
  });

  describe('filterActivitiesForDistribution', () => {
    const activities = [
      makeActivity({ sport: 'Run', date: new Date(2023, 5, 1), distance: 5, duration: 1500, avgWatts: null }),
      makeActivity({ sport: 'Bike', date: new Date(2024, 5, 1), distance: 40, duration: 7200, avgWatts: 200 }),
      makeActivity({ sport: 'Swim', date: new Date(2024, 6, 1), distance: 2, duration: 2400, avgWatts: null }),
      makeActivity({ sport: 'Run', date: new Date(2024, 7, 1), distance: 8, duration: null, avgWatts: null })
    ];

    it('excludes activities outside the sport filter', () => {
      const result = filterActivitiesForDistribution(activities, { metric: 'length', sport: 'Run' });
      expect(result).toHaveLength(2);
      expect(result.every(a => a.sport === 'Run')).toBe(true);
    });

    it('excludes activities outside the date range', () => {
      const result = filterActivitiesForDistribution(activities, {
        metric: 'length',
        sport: 'All',
        minDate: new Date(2024, 0, 1),
        maxDate: new Date(2024, 11, 31)
      });
      expect(result).toHaveLength(3);
    });

    it('excludes activities missing the selected metric value', () => {
      const result = filterActivitiesForDistribution(activities, { metric: 'duration', sport: 'All' });
      expect(result).toHaveLength(3);
      expect(result.some(a => a.duration === null)).toBe(false);
    });

    it('excludes activities missing power data for the power metric', () => {
      const result = filterActivitiesForDistribution(activities, { metric: 'power', sport: 'All' });
      expect(result).toHaveLength(1);
      expect(result[0].sport).toBe('Bike');
    });

    it('combines multiple sports for pace when sport is All using km/h values', () => {
      const result = filterActivitiesForDistribution(activities, { metric: 'pace', sport: 'All' });
      const sports = result.map(a => a.sport);
      expect(sports).toEqual(expect.arrayContaining(['Run', 'Bike', 'Swim']));
      expect(getAllSportsPaceValue(activities[0])).toBe(12);
    });

    it('excludes invalid All Sports Pace conversions without mutating activities', () => {
      const activity = makeActivity({ sport: 'Run', distance: 10, duration: 3000 });
      const snapshot = { ...activity };
      expect(getAllSportsPaceValue(activity)).toBe(12);
      expect(getAllSportsPaceValue(makeActivity({ distance: 0 }))).toBeNull();
      expect(getAllSportsPaceValue(makeActivity({ duration: 0 }))).toBeNull();
      expect(activity).toEqual(snapshot);
    });
  });

  describe('computeDistributionBuckets', () => {
    it('produces nice, round bucket boundaries spanning min/max whose counts sum to the input length', () => {
      const values = Array.from({ length: 50 }, (_, i) => i + 1);
      const { buckets, activityCount } = computeDistributionBuckets(values);

      expect(buckets.length).toBeGreaterThanOrEqual(10);
      expect(buckets.length).toBeLessThanOrEqual(15);
      expect(buckets[0].rangeStart).toBe(0);
      expect(buckets[buckets.length - 1].rangeEnd).toBe(50);
      expect(buckets.every(b => !b.isOverflow)).toBe(true);
      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(activityCount);
      expect(activityCount).toBe(50);
    });

    it('produces exactly one bucket when all values are equal', () => {
      const { buckets, activityCount } = computeDistributionBuckets([7, 7, 7]);
      expect(buckets).toHaveLength(1);
      expect(buckets[0].count).toBe(3);
      expect(activityCount).toBe(3);
    });

    it('produces one overflow bucket for a dataset with a clear outlier, without stretching regular buckets to reach it', () => {
      const values = [...Array.from({ length: 49 }, (_, i) => i + 1), 500];
      const { buckets, activityCount } = computeDistributionBuckets(values);

      const overflowBuckets = buckets.filter(b => b.isOverflow);
      expect(overflowBuckets).toHaveLength(1);
      expect(overflowBuckets[0].label).toMatch(/^> /);
      expect(overflowBuckets[0].rangeEnd).toBe(Infinity);

      const regularBuckets = buckets.filter(b => !b.isOverflow);
      expect(regularBuckets[regularBuckets.length - 1].rangeEnd).toBeLessThan(500);
      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(activityCount);
      expect(activityCount).toBe(50);
    });

    it('produces no overflow bucket when there are no statistical outliers', () => {
      const values = Array.from({ length: 50 }, (_, i) => i + 1);
      const { buckets } = computeDistributionBuckets(values);
      expect(buckets.some(b => b.isOverflow)).toBe(false);
    });

    it('labels a Length overflow bucket as 50+ without adding one to shorter datasets', () => {
      const values = [...Array.from({ length: 49 }, (_, i) => i + 1), 500];
      const result = computeDistributionBuckets(values, { metricKey: 'length', sport: null });
      expect(result.buckets.find(bucket => bucket.isOverflow).label).toBe('50+');

      const shortResult = computeDistributionBuckets([1, 2, 3, 4, 5], { metricKey: 'length', sport: null });
      expect(shortResult.buckets.some(bucket => bucket.label === '50+')).toBe(false);
    });

    it('formats bucket labels using the sport-specific formatter when a single sport is provided, without repeating the unit (per 020-distributions-visual-polish FR-006)', () => {
      const values = [4, 4.5, 5, 5.5, 6];
      const { buckets } = computeDistributionBuckets(values, { metricKey: 'pace', sport: 'Run', targetBucketCount: 4 });
      expect(buckets[0].label).not.toMatch(/min\/km/);
      expect(buckets[0].label).toMatch(/^\d+:\d{2}/);
    });

    it('returns an empty result for an empty input array', () => {
      const { buckets, activityCount } = computeDistributionBuckets([]);
      expect(buckets).toEqual([]);
      expect(activityCount).toBe(0);
    });
  });

  describe('computeIqrOutlierThreshold', () => {
    it('returns an upperFence below a clear outlier and above the bulk of the data', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
      const { upperFence } = computeIqrOutlierThreshold(values);
      expect(upperFence).toBeLessThan(100);
      expect(upperFence).toBeGreaterThanOrEqual(9);
    });

    it('returns an upperFence at or above the max for a dataset with no outliers', () => {
      const values = [1, 2, 3, 4, 5];
      const { upperFence } = computeIqrOutlierThreshold(values);
      expect(upperFence).toBeGreaterThanOrEqual(Math.max(...values));
    });
  });

  describe('formatMetricValue', () => {
    it('formats duration as whole minutes below 60 minutes', () => {
      expect(formatMetricValue('duration', 125)).toBe('2m');
    });

    it('formats duration as hours and minutes at or above 60 minutes', () => {
      expect(formatMetricValue('duration', 3600)).toBe('1h 0m');
      expect(formatMetricValue('duration', 5400)).toBe('1h 30m');
    });

    it('formats pace as mm:ss with unit for Run and Swim', () => {
      expect(formatMetricValue('pace', 5.5, 'Run')).toBe('5:30 min/km');
      expect(formatMetricValue('pace', 1.75, 'Swim')).toBe('1:45 min/100m');
    });

    it('formats pace as a decimal km/h speed for Bike', () => {
      expect(formatMetricValue('pace', 32, 'Bike')).toBe('32 km/h');
      expect(formatMetricValue('pace', 32.6, 'Bike')).toBe('33 km/h');
    });

    it('omits the unit when includeUnit is false for pace', () => {
      expect(formatMetricValue('pace', 5.5, 'Run', { includeUnit: false })).toBe('5:30');
      expect(formatMetricValue('pace', 1.75, 'Swim', { includeUnit: false })).toBe('1:45');
      expect(formatMetricValue('pace', 32, 'Bike', { includeUnit: false })).toBe('32');
    });

    it('formats elevation as whole meters', () => {
      expect(formatMetricValue('elevation', 120.6)).toBe('121 m');
    });

    it('formats length as whole or one-decimal kilometers', () => {
      expect(formatMetricValue('length', 12.0)).toBe('12 km');
      expect(formatMetricValue('length', 12.549)).toBe('12.5 km');
    });

    it('formats power as whole watts', () => {
      expect(formatMetricValue('power', 209.6)).toBe('210 W');
    });
  });

  describe('groupBucketCountsBySport', () => {
    const buckets = [
      { rangeStart: 0, rangeEnd: 5, label: '0-5' },
      { rangeStart: 5, rangeEnd: 10, label: '5-10' }
    ];

    const activities = [
      makeActivity({ sport: 'Run', distance: 3 }),
      makeActivity({ sport: 'Run', distance: 7 }),
      makeActivity({ sport: 'Bike', distance: 2 }),
      makeActivity({ sport: 'Swim', distance: 0 }) // distance <= 0 has no valid length value
    ];

    it('groups each sport\'s activities into the same bucket boundaries with sport-specific counts', () => {
      const result = groupBucketCountsBySport(activities, 'length', buckets);

      expect(result.Run.buckets.map(b => ({ rangeStart: b.rangeStart, rangeEnd: b.rangeEnd }))).toEqual(
        buckets.map(b => ({ rangeStart: b.rangeStart, rangeEnd: b.rangeEnd }))
      );
      expect(result.Run.activityCount).toBe(2);
      expect(result.Run.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(2);
      expect(result.Bike.activityCount).toBe(1);
    });

    it('omits sports with zero qualifying activities', () => {
      const result = groupBucketCountsBySport(activities, 'length', buckets);
      expect(result.Swim).toBeUndefined();
    });
  });

  describe('getFireGradientColor', () => {
    it('returns the yellow stop at position 0 and the red stop at position 1', () => {
      expect(getFireGradientColor(0)).toBe('#FDE047');
      expect(getFireGradientColor(1)).toBe('#DC2626');
    });

    it('returns a distinct color at position 0.5', () => {
      const mid = getFireGradientColor(0.5);
      expect(mid).not.toBe(getFireGradientColor(0));
      expect(mid).not.toBe(getFireGradientColor(1));
    });

    it('clamps positions outside [0, 1]', () => {
      expect(getFireGradientColor(-0.2)).toBe(getFireGradientColor(0));
      expect(getFireGradientColor(1.5)).toBe(getFireGradientColor(1));
    });
  });

  describe('getDistributionColor', () => {
    it('uses fire as the default scheme and preserves fire endpoints', () => {
      expect(getDistributionColor(0)).toBe('#FDE047');
      expect(getDistributionColor(1, 'fire')).toBe('#DC2626');
    });

    it('provides one stable monochrome-blue color and clamps positions', () => {
      const start = getDistributionColor(0, 'monochrome-blue');
      const middle = getDistributionColor(0.5, 'monochrome-blue');
      const end = getDistributionColor(1, 'monochrome-blue');
      expect(start).toBe('#2563EB');
      expect(middle).toBe(start);
      expect(end).toBe(start);
      expect(getDistributionColor(-1, 'monochrome-blue')).toBe(start);
      expect(getDistributionColor(2, 'monochrome-blue')).toBe(end);
    });
  });

  describe('getHistogramBoundaryTicks', () => {
    it('returns individual numeric boundaries and removes duplicate labels', () => {
      const buckets = [
        { rangeStart: 0, rangeEnd: 50, label: '0-50 km' },
        { rangeStart: 50, rangeEnd: 100, label: '50-100 km' },
        { rangeStart: 100, rangeEnd: 150, label: '100-150 km' }
      ];
      expect(getHistogramBoundaryTicks(buckets, 'length')).toEqual(['0', '50', '100', '150']);
      expect(getHistogramBoundaryTicks([
        { rangeStart: 0, rangeEnd: 50.01, label: '0-50 km' },
        { rangeStart: 50.004, rangeEnd: 100, label: '50-100 km' }
      ], 'length')).toEqual(['0', '50', '100']);
    });

    it('preserves open-ended overflow meaning without range labels', () => {
      const buckets = [
        { rangeStart: 0, rangeEnd: 50, label: '0-50 km' },
        { rangeStart: 50, rangeEnd: Infinity, label: '50+', isOverflow: true }
      ];
      expect(getHistogramBoundaryTicks(buckets, 'length')).toEqual(['0', '50', '50+']);
    });

    it('formats the supported metric units for Histogram boundaries', () => {
      expect(getHistogramBoundaryTicks([
        { rangeStart: 0, rangeEnd: 20 },
        { rangeStart: 20, rangeEnd: 40 }
      ], 'elevation', 'Run')).toEqual(['0', '20', '40']);
      expect(getHistogramBoundaryTicks([
        { rangeStart: 0, rangeEnd: 600 },
        { rangeStart: 600, rangeEnd: 1200 }
      ], 'duration')).toEqual(['0m', '10m', '20m']);
      expect(getHistogramBoundaryTicks([
        { rangeStart: 4, rangeEnd: 5 },
        { rangeStart: 5, rangeEnd: 6 }
      ], 'pace', 'Run')).toEqual(['4:00', '5:00', '6:00']);
      expect(getHistogramBoundaryTicks([
        { rangeStart: 100, rangeEnd: 150 },
        { rangeStart: 150, rangeEnd: 200 }
      ], 'power', 'Bike')).toEqual(['100', '150', '200']);
    });

    it('preserves bucket counts while creating visible boundary ticks', () => {
      const buckets = [
        { rangeStart: 0, rangeEnd: 10, label: '0-10 km', count: 3 },
        { rangeStart: 10, rangeEnd: 20, label: '10-20 km', count: 5 }
      ];
      expect(getHistogramBoundaryTicks(buckets, 'length')).toEqual(['0', '10', '20']);
      expect(buckets.map(bucket => bucket.count)).toEqual([3, 5]);
    });
  });

  describe('computeDurationNiceStep', () => {
    it('returns a step from the nice-steps table that keeps the bucket count within the target', () => {
      const step = computeDurationNiceStep(3000, 12);
      expect([300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400]).toContain(step);
      expect(3000 / step).toBeLessThanOrEqual(12);
    });

    it('falls back to the largest step for a very wide range', () => {
      const step = computeDurationNiceStep(2000000, 12);
      expect(step).toBe(86400);
    });
  });

  describe('computeIqrOutlierThreshold lowerFence', () => {
    it('returns a lowerFence above a clear low-end outlier and below the bulk of the data', () => {
      const values = [-50, 40, 41, 42, 43, 44, 45, 46, 47, 48];
      const { lowerFence } = computeIqrOutlierThreshold(values);
      expect(lowerFence).toBeGreaterThan(-50);
      expect(lowerFence).toBeLessThanOrEqual(40);
    });
  });

  describe('computeDistributionBuckets underflow bucket (Pace only)', () => {
    it('produces one leading isUnderflow bucket when enableUnderflow is true and a low-end outlier exists', () => {
      const values = [-50, 40, 41, 42, 43, 44, 45, 46, 47, 48];
      const { buckets } = computeDistributionBuckets(values, { metricKey: 'pace', sport: 'Swim', enableUnderflow: true });

      const underflowBuckets = buckets.filter(b => b.isUnderflow);
      expect(underflowBuckets).toHaveLength(1);
      expect(underflowBuckets[0].label).toMatch(/^< /);
      expect(underflowBuckets[0].rangeStart).toBe(-Infinity);
    });

    it('produces no underflow bucket when there are no low-end outliers', () => {
      const values = [40, 41, 42, 43, 44, 45, 46, 47, 48];
      const { buckets } = computeDistributionBuckets(values, { metricKey: 'pace', sport: 'Swim', enableUnderflow: true });
      expect(buckets.some(b => b.isUnderflow)).toBe(false);
    });

    it('never produces an underflow bucket when enableUnderflow is omitted, regardless of value distribution', () => {
      const values = [-50, 40, 41, 42, 43, 44, 45, 46, 47, 48];
      const { buckets } = computeDistributionBuckets(values, { metricKey: 'length' });
      expect(buckets.some(b => b.isUnderflow)).toBe(false);
    });
  });
});
