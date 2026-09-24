const {
  GRANULARITIES,
  buildWorkoutTimeDataset
} = require('../src/workout-time-utils');

function activity({ date, startTime, sport }) {
  return {
    date: new Date(`${date}T00:00:00`),
    startTime: startTime ? new Date(startTime) : null,
    sport
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
