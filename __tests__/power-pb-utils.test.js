const {
  POWER_DURATIONS,
  normalizePowerValue,
  normalizeFitPowerRecords,
  createActivityAveragePowerRecords,
  getPowerAvailabilityState,
  calculateRollingPowerEfforts,
  buildPowerProgression
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

  it('creates activity-average records only for Bike activities with valid watts', () => {
    const records = createActivityAveragePowerRecords([
      bikeActivity(),
      bikeActivity({ id: 'run-1', sport: 'Run', avgWatts: 500 }),
      bikeActivity({ id: 'invalid', avgWatts: -5 }),
      bikeActivity({ id: 'missing', avgWatts: null })
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      category: 'activity-average',
      source: 'activity-average',
      watts: 245,
      activityId: 'bike-1',
      activityName: 'Bike workout'
    });
  });

  it('keeps only successive activity-average highs in chronological order', () => {
    const records = createActivityAveragePowerRecords([
      bikeActivity({ id: 'late', date: new Date('2026-07-21'), avgWatts: 250 }),
      bikeActivity({ id: 'first', date: new Date('2026-07-19'), avgWatts: 220 }),
      bikeActivity({ id: 'middle', date: new Date('2026-07-20'), avgWatts: 240 }),
      bikeActivity({ id: 'same', date: new Date('2026-07-22'), avgWatts: 250 })
    ]);

    expect(records.map(record => record.activityId)).toEqual(['first', 'middle', 'late']);
  });

  it('reports average and duration power availability separately', () => {
    expect(getPowerAvailabilityState([], [])).toBe('none');
    expect(getPowerAvailabilityState([bikeActivity()], [])).toBe('average-only');
    expect(getPowerAvailabilityState([], [{ targetSeconds: 300, avgPower: 250 }])).toBe('duration-only');
    expect(getPowerAvailabilityState([bikeActivity()], [{ targetSeconds: 300, avgPower: 250 }])).toBe('average-and-duration');
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

  it('builds separate higher-is-better progressions by category', () => {
    const records = buildPowerProgression([
      { category: 'activity-average', source: 'activity-average', watts: 200, date: new Date('2026-01-01') },
      { category: 'activity-average', source: 'activity-average', watts: 210, date: new Date('2026-01-02') },
      { category: '5m', source: 'fit-rolling', watts: 300, date: new Date('2026-01-01') },
      { category: '5m', source: 'fit-rolling', watts: 290, date: new Date('2026-01-02') }
    ]);

    expect(records.map(record => record.watts)).toEqual([200, 210, 300]);
  });
});
