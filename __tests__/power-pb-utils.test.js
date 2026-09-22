const {
  POWER_DURATIONS,
  normalizePowerValue,
  normalizeFitPowerRecords,
  calculateRollingPowerEfforts,
  buildAllTimePowerProfile,
  getPowerProfileWattRange,
  markPowerProfileLabelVisibility
} = require('../src/power-pb-utils');

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
