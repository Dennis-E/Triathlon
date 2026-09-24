const {
  getAvailableYears,
  getSportCategory,
  buildCalendarModel
} = require('../src/training-calendar-utils');

function activity({ date, sport = 'Run', duration, distance }) {
  return {
    date: new Date(`${date}T12:00:00`),
    sport,
    duration,
    distance
  };
}

describe('training-calendar-utils', () => {
  const activities = [
    activity({ date: '2025-12-31', sport: 'Run', duration: 1800, distance: 5 }),
    activity({ date: '2026-01-01', sport: 'Bike', duration: 3600, distance: 20 }),
    activity({ date: '2026-01-10', sport: 'Run', duration: 1800, distance: 5 }),
    activity({ date: '2026-01-10', sport: 'Swim', duration: 1200, distance: 2 })
  ];

  it('discovers sorted calendar years and maps unsupported sports to Other', () => {
    expect(getAvailableYears(activities)).toEqual([2025, 2026]);
    expect(getSportCategory('Yoga')).toBe('Other');
    expect(getSportCategory('Run')).toBe('Run');
  });

  it('builds a complete Monday-first calendar with leap-year support', () => {
    const model = buildCalendarModel([], { year: 2024 });
    const SundayStartModel = buildCalendarModel([], { year: 2023 });

    expect(model.days).toHaveLength(366);
    expect(SundayStartModel.weeks[0].days[0]).toBeNull();
    expect(model.weeks.flatMap(week => week.days).filter(Boolean)).toHaveLength(366);
    expect(model.days.every(day => day.intensityLevel === 0)).toBe(true);
  });

  it('groups local dates and aggregates multiple activities on one day', () => {
    const model = buildCalendarModel(activities, { year: 2026 });
    const day = model.days.find(item => item.dateKey === '2026-01-10');

    expect(day.activityCount).toBe(2);
    expect(day.sports).toEqual(['Run', 'Swim']);
    expect(day.durationSeconds).toBe(3000);
    expect(day.distanceKm).toBe(7);
    expect(day.bySport.Run.activityCount).toBe(1);
    expect(day.bySport.Swim.activityCount).toBe(1);
  });

  it('uses duration, then distance, then activity count as daily metric fallback', () => {
    const model = buildCalendarModel([
      activity({ date: '2026-01-01', duration: 100, distance: 10 }),
      activity({ date: '2026-01-02', duration: null, distance: 10 }),
      activity({ date: '2026-01-03', duration: null, distance: null })
    ], { year: 2026 });

    expect(model.days.find(day => day.dateKey === '2026-01-01')).toMatchObject({ metricValue: 100, metricKind: 'duration' });
    expect(model.days.find(day => day.dateKey === '2026-01-02')).toMatchObject({ metricValue: 10, metricKind: 'distance' });
    expect(model.days.find(day => day.dateKey === '2026-01-03')).toMatchObject({ metricValue: 1, metricKind: 'count' });
  });

  it('assigns five positive intensity levels and zero to empty days', () => {
    const values = [1, 5, 9, 13, 17];
    const model = buildCalendarModel(values.map((duration, index) => activity({
      date: `2026-01-${String(index + 1).padStart(2, '0')}`,
      duration,
      distance: null
    })), { year: 2026 });
    const levels = values.map((_, index) => model.days[index].intensityLevel);

    expect(levels).toEqual([1, 2, 3, 4, 5]);
    expect(model.days.find(day => day.dateKey === '2026-02-01').intensityLevel).toBe(0);
  });

  it('filters by year and available sport without mutating source sports', () => {
    const source = [
      activity({ date: '2026-01-01', sport: 'Run', duration: 100 }),
      activity({ date: '2026-01-02', sport: 'Yoga', duration: 200 }),
      activity({ date: '2027-01-01', sport: 'Bike', duration: 300 })
    ];
    const model = buildCalendarModel(source, { year: 2026, sport: 'Other' });

    expect(model.activityCount).toBe(1);
    expect(model.availableSports).toEqual(['Other']);
    expect(model.days.find(day => day.dateKey === '2026-01-02').sports).toEqual(['Other']);
    expect(source[1].sport).toBe('Yoga');
  });

  it('returns an explicit empty model for a valid year and filter with no matches', () => {
    const model = buildCalendarModel(activities, { year: 2026, sport: 'Swim' });

    expect(model.activityCount).toBe(1);
    expect(buildCalendarModel(activities, { year: 2027, sport: 'Run' }).activityCount).toBe(0);
    expect(buildCalendarModel(activities, { year: 2027, sport: 'Run' }).days.every(day => day.intensityLevel === 0)).toBe(true);
  });

  it('builds a 10,000-activity model within the documented local budget', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, index) => activity({
      date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
      duration: 1800,
      distance: 5
    }));
    const start = Date.now();
    const model = buildCalendarModel(largeDataset, { year: 2026 });
    const elapsed = Date.now() - start;

    expect(model.activityCount).toBe(10000);
    expect(elapsed).toBeLessThan(2000);
  });
});
