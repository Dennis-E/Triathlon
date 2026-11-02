const {
  GRANULARITIES,
  buildWorkoutTimeDataset,
  MEASURES,
  getMeasureDefinition,
  formatWorkoutTimeValue
} = require('../src/workout-time-utils');

function activity({ date, startTime, sport, ...measurements }) {
  return {
    date: new Date(`${date}T00:00:00`),
    startTime: startTime ? new Date(startTime) : null,
    sport,
    ...measurements
  };
}

describe('buildWorkoutTimeDataset - Day granularity', () => {
  const activities = [
    activity({ date: '2026-07-01', startTime: '2026-07-01T00:00:00', sport: 'Run' }),
    activity({ date: '2026-07-01', startTime: '2026-07-01T01:59:59', sport: 'Run' }),
    activity({ date: '2026-07-01', startTime: '2026-07-01T02:00:00', sport: 'Bike' }),
    activity({ date: '2026-07-01', startTime: '2026-07-01T12:30:00', sport: 'Swim' }),
    activity({ date: '2026-07-02', startTime: '2026-07-02T00:30:00', sport: 'Run' }),
    activity({ date: '2026-07-01', startTime: null, sport: 'Run' })
  ];

  it('returns twelve ordered two-hour groups and assigns boundaries consistently', () => {
    const result = buildWorkoutTimeDataset(activities, {
      granularity: GRANULARITIES.DAY,
      sport: 'All',
      minDate: new Date('2026-07-01T00:00:00'),
      maxDate: new Date('2026-07-01T23:59:59')
    });

    expect(result.groups).toHaveLength(12);
    expect(result.groups.map(group => group.key)).toEqual([
      'day-00', 'day-02', 'day-04', 'day-06', 'day-08', 'day-10',
      'day-12', 'day-14', 'day-16', 'day-18', 'day-20', 'day-22'
    ]);
    expect(result.groups[0].label).toBe('00:00-01:59');
    expect(result.groups[0].count).toBe(2);
    expect(result.groups[1].count).toBe(1);
    expect(result.groups[6].count).toBe(1);
    expect(result.activityCount).toBe(4);
  });

  it('applies sport and inclusive date filters before grouping', () => {
    const result = buildWorkoutTimeDataset(activities, {
      granularity: GRANULARITIES.DAY,
      sport: 'Run',
      minDate: new Date('2026-07-01T00:00:00'),
      maxDate: new Date('2026-07-01T23:59:59')
    });

    expect(result.activityCount).toBe(2);
    expect(result.groups[0].count).toBe(2);
    expect(result.groups[1].count).toBe(0);
  });
});

it('exposes the four supported grouping granularities', () => {
  expect(GRANULARITIES).toEqual({
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
  });
});

describe('buildWorkoutTimeDataset - calendar granularities', () => {
  const activities = [
    activity({ date: '2026-07-06', startTime: '2026-07-06T08:00:00', sport: 'Run' }),
    activity({ date: '2026-07-12', startTime: '2026-07-12T09:00:00', sport: 'Bike' }),
    activity({ date: '2026-08-06', startTime: '2026-08-06T10:00:00', sport: 'Swim' }),
    activity({ date: '2027-01-01', startTime: '2027-01-01T11:00:00', sport: 'Run' })
  ];

  it('groups Week from Monday through Sunday', () => {
    const result = buildWorkoutTimeDataset(activities, { granularity: GRANULARITIES.WEEK });

    expect(result.groups.map(group => group.label)).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ]);
    expect(result.groups[0].count).toBe(1);
    expect(result.groups[6].count).toBe(1);
  });

  it('aggregates Month by day number from 1 through 31', () => {
    const result = buildWorkoutTimeDataset(activities, { granularity: GRANULARITIES.MONTH });

    expect(result.groups).toHaveLength(31);
    expect(result.groups[0].count).toBe(1);
    expect(result.groups[5].count).toBe(2);
    expect(result.groups[11].count).toBe(1);
  });

  it('aggregates Year from January through December across selected years', () => {
    const result = buildWorkoutTimeDataset(activities, { granularity: GRANULARITIES.YEAR });

    expect(result.groups.map(group => group.label)).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]);
    expect(result.groups[0].count).toBe(1);
    expect(result.groups[6].count).toBe(2);
    expect(result.groups[7].count).toBe(1);
  });

  it('returns an explicit zero-activity dataset for invalid or excluded activities', () => {
    const result = buildWorkoutTimeDataset([
      activity({ date: '2026-07-01', startTime: null, sport: 'Run' }),
      activity({ date: '2026-07-01', startTime: '2026-07-01T08:00:00', sport: 'Bike' })
    ], {
      granularity: GRANULARITIES.YEAR,
      sport: 'Run',
      minDate: new Date('2027-01-01T00:00:00'),
      maxDate: new Date('2027-01-31T23:59:59')
    });

    expect(result.activityCount).toBe(0);
    expect(result.groups).toHaveLength(12);
    expect(result.groups.every(group => group.count === 0)).toBe(true);
  });
});

describe('Workout Time measures', () => {
  const reference = [
    activity({ date: '2026-07-01', startTime: '2026-07-01T06:15:00', sport: 'Run', duration: 1800, distance: 5 }),
    activity({ date: '2026-07-01', startTime: '2026-07-01T07:30:00', sport: 'Bike', duration: 2700, distance: 10 }),
    activity({ date: '2026-07-01', startTime: '2026-07-01T07:45:00', sport: 'Swim', duration: 0, durationAvailable: false, distance: 2 })
  ];

  it('keeps count as default and sums recorded seconds/kilometers without changing eligibility', () => {
    expect(MEASURES).toEqual({ COUNT: 'count', DURATION: 'duration', DISTANCE: 'distance' });
    const count = buildWorkoutTimeDataset(reference);
    const duration = buildWorkoutTimeDataset(reference, { measure: 'duration' });
    const distance = buildWorkoutTimeDataset(reference, { measure: 'distance' });
    expect(count).toMatchObject({ measure: 'count', activityCount: 3, availableCount: 3, value: 3, status: 'complete' });
    expect(duration.groups[3]).toMatchObject({ count: 3, durationSeconds: 4500, distanceKm: 17, value: 4500, availableCount: 2, status: 'partial' });
    expect(duration).toMatchObject({ activityCount: 3, availableCount: 2, value: 4500, status: 'partial' });
    expect(distance.groups[3]).toMatchObject({ count: 3, value: 17, availableCount: 3, status: 'complete' });
    expect(duration.groups[0]).toMatchObject({ count: 0, value: 0, status: 'empty' });
    expect(duration.groups.map(group => group.count)).toEqual(count.groups.map(group => group.count));
  });

  it.each(['duration', 'distance'])('distinguishes empty, available zero, partial and unavailable %s', measure => {
    const flag = measure + 'Available';
    const make = measurements => activity({ date: '2026-07-01', startTime: '2026-07-01T06:00:00', sport: 'Run', ...measurements });
    expect(buildWorkoutTimeDataset([], { measure })).toMatchObject({ status: 'empty', value: 0, activityCount: 0 });
    for (const available of [undefined, true]) {
      expect(buildWorkoutTimeDataset([make({ [measure]: 0, [flag]: available })], { measure }))
        .toMatchObject({ status: 'complete', value: 0, availableCount: 1 });
    }
    for (const invalid of [undefined, null, -1, NaN, Infinity, '12']) {
      const result = buildWorkoutTimeDataset([make({ [measure]: invalid, [flag]: true })], { measure });
      expect(result).toMatchObject({ status: 'unavailable', value: null, activityCount: 1, availableCount: 0 });
      expect(result.groups[3]).toMatchObject({ count: 1, status: 'unavailable', value: null });
    }
    expect(buildWorkoutTimeDataset([make({ [measure]: 0, [flag]: false })], { measure }))
      .toMatchObject({ status: 'unavailable', value: null });
    expect(buildWorkoutTimeDataset([make({ [measure]: 0 }), make({ [measure]: 5, [flag]: false })], { measure }))
      .toMatchObject({ status: 'partial', value: 0, availableCount: 1, activityCount: 2 });
  });

  it('preserves copied date filters and does not mutate source values or round before summing', () => {
    const records = reference.map((record, index) => Object.freeze({ ...record, distance: [0.004, 0.004, 0.004][index] }));
    const minDate = new Date('2026-07-01T00:00:00');
    const result = buildWorkoutTimeDataset(records, { measure: 'distance', minDate });
    expect(result.value).toBeCloseTo(0.012, 12);
    expect(result.filters.minDate).toEqual(minDate);
    expect(result.filters.minDate).not.toBe(minDate);
    expect(records[0].distance).toBe(0.004);
    expect(() => buildWorkoutTimeDataset(reference, { measure: 'pace' })).toThrow(/measure/i);
  });

  it('formats explicit measure units and cumulative duration without a 24-hour wrap', () => {
    expect(getMeasureDefinition('duration')).toMatchObject({ axisTitle: 'Duration (h)', divisor: 3600 });
    expect(getMeasureDefinition('distance')).toMatchObject({ axisTitle: 'Distance (km)', divisor: 1 });
    expect(formatWorkoutTimeValue(4500, 'duration')).toBe('1h 15m');
    expect(formatWorkoutTimeValue(97204, 'duration')).toBe('27h 4s');
    expect(formatWorkoutTimeValue(0, 'duration')).toBe('0s');
    expect(formatWorkoutTimeValue(3, 'count')).toBe('3 workouts');
    expect(formatWorkoutTimeValue(1, 'count')).toBe('1 workout');
    expect(formatWorkoutTimeValue(17, 'distance')).toBe('17 km');
    expect(formatWorkoutTimeValue(null, 'distance')).toBe('Not available');
    expect(() => getMeasureDefinition('pace')).toThrow(/measure/i);
  });

  const matrix = ['day', 'week', 'month', 'year'].flatMap(granularity => ['All', 'Run', 'Bike', 'Swim'].flatMap(sport => ['count', 'duration', 'distance'].map(measure => [granularity, sport, measure])));
  it.each(matrix)('matches reference field totals for %s / %s / %s', (granularity, sport, measure) => {
    const records = reference.map(record => ({ ...record, expectedGroups: { day: 3, week: 2, month: 0, year: 6 } }));
    records.push(activity({ date: '2026-07-06', startTime: '2026-07-06T23:30:00', sport: 'Run', duration: 90000, distance: 0.012, expectedGroups: { day: 11, week: 0, month: 5, year: 6 } }));
    records.push(activity({ date: '2027-01-01', startTime: '2027-01-01T08:00:00', sport: 'Bike', duration: 0, distance: 0, expectedGroups: { day: 4, week: 4, month: 0, year: 0 } }));
    records.push(activity({ date: '2027-01-01', startTime: '2027-01-01T08:00:00', sport: null, duration: 500, distance: 1.05, expectedGroups: { day: 4, week: 4, month: 0, year: 0 } }));
    const eligible = records.filter(record => sport === 'All' || record.sport === sport);
    const result = buildWorkoutTimeDataset([...records, activity({ date: '2026-07-01', startTime: null, sport: 'Run', duration: 99, distance: 99 })], { granularity, sport, measure });
    expect(result.groups).toHaveLength({ day: 12, week: 7, month: 31, year: 12 }[granularity]);
    expect(result.activityCount).toBe(eligible.length);
    let total = 0;
    let availableCount = 0;
    result.groups.forEach((group, index) => {
      const members = eligible.filter(record => record.expectedGroups[granularity] === index);
      const usable = measure === 'count' ? members : members.filter(record => record[measure + 'Available'] !== false);
      const expected = usable.reduce((sum, record) => sum + (measure === 'count' ? 1 : record[measure]), 0);
      expect(group.count).toBe(members.length);
      expect(group.availableCount).toBe(usable.length);
      expect(group.order).toBe(index);
      if (members.length && !usable.length) expect(group.value).toBeNull();
      else expect(group.value).toBeCloseTo(expected, 12);
      total += expected;
      availableCount += usable.length;
    });
    if (eligible.length && !availableCount) expect(result.value).toBeNull();
    else expect(result.value).toBeCloseTo(total, 12);
  });
});
