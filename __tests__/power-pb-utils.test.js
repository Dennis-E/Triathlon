const {
  POWER_DURATIONS,
  normalizePowerValue,
  normalizeFitPowerRecords,
  calculateRollingPowerEfforts,
  calculatePowerEffortsForDurations,
  buildAllTimePowerProfile,
  getPowerProfileWattRange,
  markPowerProfileLabelVisibility
} = require('../src/power-pb-utils');

function legacyCalculateRollingPowerEfforts(records, targetSeconds, coverageThreshold = 0.8) {
  if (!Array.isArray(records) || !Number.isFinite(targetSeconds) || targetSeconds <= 0) return [];
  const points = records
    .filter(record => record && Number.isFinite(record.tSec) && Number.isFinite(record.distKm))
    .map(record => ({ ...record, power: normalizePowerValue(record.power) }))
    .sort((a, b) => a.tSec - b.tSec);
  const efforts = [];

  for (let startIndex = 0; startIndex < points.length; startIndex++) {
    const start = points[startIndex];
    const window = points.filter(point => point.tSec >= start.tSec && point.tSec <= start.tSec + targetSeconds);
    if (window.length < 2) continue;
    const end = window[window.length - 1];
    const observedSpan = end.tSec - start.tSec;
    const validPoints = window.filter(point => point.power !== null);
    const coverage = Math.min(1, observedSpan / targetSeconds) * (validPoints.length / window.length);
    if (coverage < coverageThreshold || validPoints.length === 0) continue;

    efforts.push({
      targetSeconds,
      avgPower: validPoints.reduce((sum, point) => sum + point.power, 0) / validPoints.length,
      startSec: start.tSec,
      endSec: end.tSec,
      startKm: start.distKm,
      endKm: end.distKm
    });
  }

  if (efforts.length === 0) return [];
  return [efforts.reduce((current, effort) => effort.avgPower > current.avgPower ? effort : current)];
}

function makeRegularPowerRecords(count, options = {}) {
  const stepSeconds = options.stepSeconds || 1;
  const powerAt = options.powerAt || (index => 200 + (index % 100));
  return Array.from({ length: count }, (_, index) => ({
    tSec: index * stepSeconds,
    distKm: index * stepSeconds * 0.01,
    power: powerAt(index)
  }));
}

function makeIrregularPowerRecords() {
  return [0, 1, 2, 5, 9, 10, 17, 29, 30, 31, 48, 60].map((tSec, index) => ({
    tSec,
    distKm: index * 0.02,
    power: index % 4 === 0 ? null : 180 + index * 3
  }));
}

function makeSparsePowerRecords() {
  return makeRegularPowerRecords(12, {
    stepSeconds: 30,
    powerAt: index => index % 3 === 0 ? null : 210 + index
  });
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function measureMedian(callback) {
  for (let index = 0; index < 3; index++) callback();
  const measurements = [];
  for (let index = 0; index < 7; index++) {
    const startedAt = performance.now();
    callback();
    measurements.push(performance.now() - startedAt);
  }
  return median(measurements);
}

describe('power PB utils', () => {
  const bikeActivity = (overrides = {}) => ({
    id: 'bike-1',
    sport: 'Bike',
    date: new Date('2026-07-19T12:00:00Z'),
    name: 'Bike workout',
    avgWatts: 245,
    ...overrides
  });

  it('defines the supported duration categories', () => {
    expect(POWER_DURATIONS).toEqual([
      { label: '5s', seconds: 5 },
      { label: '30s', seconds: 30 },
      { label: '1m', seconds: 60 },
      { label: '2m', seconds: 120 },
      { label: '5m', seconds: 300 },
      { label: '10m', seconds: 600 },
      { label: '20m', seconds: 1200 },
      { label: '60m', seconds: 3600 }
    ]);
  });

  it('accepts only positive finite power values', () => {
    expect(normalizePowerValue('245,5')).toBe(245.5);
    expect(normalizePowerValue('245.5')).toBe(245.5);
    expect(normalizePowerValue(0)).toBeNull();
    expect(normalizePowerValue(-1)).toBeNull();
    expect(normalizePowerValue('')).toBeNull();
    expect(normalizePowerValue('not-a-number')).toBeNull();
  });

  it('normalizes FIT records and removes invalid or backwards points', () => {
    const records = normalizeFitPowerRecords([
      { timestamp: new Date(1000), distance: 0, power: 200 },
      { timestamp: new Date(2000), distance: 10, power: 220 },
      { timestamp: new Date(2000), distance: 12, power: 230 },
      { timestamp: new Date(3000), distance: 11, power: 240 },
      { timestamp: new Date(4000), distance: 20, power: 0 },
      { timestamp: null, distance: 30, power: 250 }
    ]);

    expect(records).toEqual([
      { tSec: 1, distKm: 0, power: 200 },
      { tSec: 2, distKm: 0.012, power: 230 },
      { tSec: 4, distKm: 0.02, power: null }
    ]);
  });

  it('calculates duration efforts only when 80 percent coverage is available', () => {
    const records = Array.from({ length: 10 }, (_, index) => ({
      tSec: index * 30,
      distKm: index * 0.5,
      power: index === 9 ? null : 200 + index
    }));

    const efforts = calculateRollingPowerEfforts(records, 300);
    expect(efforts).toHaveLength(1);
    expect(efforts[0]).toMatchObject({
      targetSeconds: 300,
      avgPower: 204,
      startSec: 0,
      endSec: 270
    });

    expect(calculateRollingPowerEfforts(records.slice(0, 5), 300)).toEqual([]);
  });

  it('matches the legacy rolling-power oracle before optimization', () => {
    const fixtures = [
      makeRegularPowerRecords(121),
      makeIrregularPowerRecords(),
      makeSparsePowerRecords()
    ];

    fixtures.forEach(records => {
      POWER_DURATIONS.forEach(duration => {
        expect(calculateRollingPowerEfforts(records, duration.seconds)).toEqual(
          legacyCalculateRollingPowerEfforts(records, duration.seconds)
        );
      });
    });
  });

  it('calculates all supported durations in duration order through the batch contract', () => {
    expect(typeof calculatePowerEffortsForDurations).toBe('function');
    if (typeof calculatePowerEffortsForDurations !== 'function') return;

    const records = makeRegularPowerRecords(3601, { powerAt: () => 220 });
    const efforts = calculatePowerEffortsForDurations(records, POWER_DURATIONS);

    expect(efforts.map(effort => effort.targetSeconds)).toEqual(
      POWER_DURATIONS.map(duration => duration.seconds)
    );
  });

  it('returns no efforts for a four-hour activity without usable power', () => {
    expect(typeof calculatePowerEffortsForDurations).toBe('function');
    if (typeof calculatePowerEffortsForDurations !== 'function') return;

    const records = makeRegularPowerRecords(14401, { powerAt: () => null });
    expect(calculatePowerEffortsForDurations(records, POWER_DURATIONS)).toEqual([]);
  });

  it('scales within 2.5x when the standard integer-watt workload doubles', () => {
    expect(typeof calculatePowerEffortsForDurations).toBe('function');
    if (typeof calculatePowerEffortsForDurations !== 'function') return;

    const smaller = makeRegularPowerRecords(7201);
    const larger = makeRegularPowerRecords(14401);
    const smallerMedian = measureMedian(() => calculatePowerEffortsForDurations(smaller, POWER_DURATIONS));
    const largerMedian = measureMedian(() => calculatePowerEffortsForDurations(larger, POWER_DURATIONS));

    expect(largerMedian / smallerMedian).toBeLessThanOrEqual(2.5);
  });

  it.each([
    ['regular', makeRegularPowerRecords(361)],
    ['irregular', makeIrregularPowerRecords()],
    ['sparse', makeSparsePowerRecords()],
    ['exact end boundary', [
      { tSec: 0, distKm: 0, power: 200 },
      { tSec: 5, distKm: 0.05, power: 400 },
      { tSec: 5.001, distKm: 0.051, power: 900 }
    ]],
    ['duplicate timestamps', [
      { tSec: 0, distKm: 0, power: 100 },
      { tSec: 0, distKm: 0.01, power: 300 },
      { tSec: 5, distKm: 0.05, power: 200 },
      { tSec: 5, distKm: 0.06, power: 400 },
      { tSec: 10, distKm: 0.1, power: 250 }
    ]],
    ['backward time and distance', [
      { tSec: 10, distKm: 0.1, power: 220 },
      { tSec: 0, distKm: 0, power: 200 },
      { tSec: 5, distKm: 0.08, power: 210 },
      { tSec: 15, distKm: 0.07, power: 230 }
    ]],
    ['invalid power', [
      { tSec: 0, distKm: 0, power: null },
      { tSec: 1, distKm: 0.01, power: 0 },
      { tSec: 2, distKm: 0.02, power: -20 },
      { tSec: 3, distKm: 0.03, power: 'not-a-number' },
      { tSec: 4, distKm: 0.04, power: Infinity },
      { tSec: 5, distKm: 0.05, power: 250 }
    ]],
    ['short activity', makeRegularPowerRecords(4)],
    ['mixed missing samples', makeRegularPowerRecords(601, {
      powerAt: index => index % 5 === 0 ? null : 180 + (index % 40)
    })],
    ['tied best windows', makeRegularPowerRecords(121, { powerAt: () => 250 })]
  ])('matches every legacy field for %s records across all durations', (name, records) => {
    POWER_DURATIONS.forEach(duration => {
      expect(calculateRollingPowerEfforts(records, duration.seconds)).toEqual(
        legacyCalculateRollingPowerEfforts(records, duration.seconds)
      );
    });
  });

  it('preserves exact legacy fields for positive non-integer power', () => {
    const records = makeRegularPowerRecords(361, {
      powerAt: index => 200.1 + (index % 17) * 0.07
    });

    POWER_DURATIONS.forEach(duration => {
      expect(calculateRollingPowerEfforts(records, duration.seconds)).toEqual(
        legacyCalculateRollingPowerEfforts(records, duration.seconds)
      );
    });
  });

  it('builds one highest available profile point per duration', () => {
    const records = buildAllTimePowerProfile([
      { durationSeconds: 300, durationLabel: '5m', watts: 280, date: new Date('2026-01-01') },
      { durationSeconds: 300, durationLabel: '5m', watts: 300, date: new Date('2026-01-02') },
      { durationSeconds: 5, durationLabel: '5s', watts: 900, date: new Date('2026-01-03') },
      { durationSeconds: 60, durationLabel: '1m', watts: 600, date: new Date('2026-01-04') }
    ]);

    expect(records.map(record => record.durationSeconds)).toEqual([5, 60, 300]);
    expect(records.map(record => record.watts)).toEqual([900, 600, 300]);
  });

  it('omits missing durations without estimating profile values', () => {
    expect(buildAllTimePowerProfile([
      { durationSeconds: 5, durationLabel: '5s', watts: 900, date: new Date('2026-01-03') }
    ])).toHaveLength(1);
    expect(buildAllTimePowerProfile([])).toEqual([]);
  });

  it('returns the exact highest and lowest watt values across profile points', () => {
    const points = [
      { durationSeconds: 300, durationLabel: '5m', watts: 300 },
      { durationSeconds: 5, durationLabel: '5s', watts: 900 },
      { durationSeconds: 60, durationLabel: '1m', watts: 600 }
    ];
    expect(getPowerProfileWattRange(points)).toEqual({ min: 300, max: 900 });
    expect(getPowerProfileWattRange([{ durationSeconds: 5, durationLabel: '5s', watts: 500 }])).toEqual({ min: 500, max: 500 });
    expect(getPowerProfileWattRange([
      { durationSeconds: 5, durationLabel: '5s', watts: 500 },
      { durationSeconds: 60, durationLabel: '1m', watts: 500 }
    ])).toEqual({ min: 500, max: 500 });
    expect(getPowerProfileWattRange([])).toEqual({ min: null, max: null });
  });

  it('marks only the shortest duration and durations of 5 minutes or longer as label-visible', () => {
    const points = POWER_DURATIONS.map(duration => ({ durationSeconds: duration.seconds, durationLabel: duration.label, watts: 200 }));
    const marked = markPowerProfileLabelVisibility(points);
    expect(marked.filter(point => point.showLabel).map(point => point.durationLabel)).toEqual(['5s', '5m', '10m', '20m', '60m']);
    expect(marked.filter(point => !point.showLabel).map(point => point.durationLabel)).toEqual(['30s', '1m', '2m']);

    const longOnly = markPowerProfileLabelVisibility([
      { durationSeconds: 300, durationLabel: '5m', watts: 200 },
      { durationSeconds: 3600, durationLabel: '60m', watts: 250 }
    ]);
    expect(longOnly.every(point => point.showLabel)).toBe(true);

    const single = markPowerProfileLabelVisibility([{ durationSeconds: 5, durationLabel: '5s', watts: 900 }]);
    expect(single).toEqual([{ durationSeconds: 5, durationLabel: '5s', watts: 900, showLabel: true }]);

    expect(markPowerProfileLabelVisibility([])).toEqual([]);
  });
});
