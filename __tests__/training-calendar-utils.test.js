const {
  getAvailableYears,
  getSportCategory,
  buildCalendarModel,
  buildMultiYearCalendarModel,
  PALETTES,
  EMPTY_DAY_COLOR
} = require('../src/training-calendar-utils');

function activity({ date, sport = 'Run', duration, distance }) {
  return {
    id: `${date}-${sport}`,
    name: `${sport} session`,
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

  it('builds every year in the inclusive newest-to-oldest range', () => {
    const model = buildMultiYearCalendarModel([
      activity({ date: '2024-01-01', duration: 100 }),
      activity({ date: '2026-01-01', duration: 100 })
    ]);

    expect(model.years.map(year => year.year)).toEqual([2026, 2025, 2024]);
    expect(model.years[1].activityCount).toBe(0);
    expect(model.years[1].days).toHaveLength(365);
  });

  it('defines the three ordered palettes with a shared bright empty level', () => {
    expect(Object.keys(PALETTES)).toEqual(['green', 'blue', 'fire']);
    expect(PALETTES.green).toHaveLength(5);
    expect(PALETTES.blue).toHaveLength(5);
    expect(PALETTES.fire).toHaveLength(5);
    expect(PALETTES.fire).toEqual(['#FDE047', '#F59E0B', '#F97316', '#EF4444', '#B91C1C']);
    expect(EMPTY_DAY_COLOR).toBe('rgba(241,245,249,0.5)');
  });

  it('creates display-safe tooltip activity summaries without mutating source data', () => {
    const source = [
      activity({ date: '2026-01-10', sport: 'Run', duration: 1800, distance: 5 }),
      { ...activity({ date: '2026-01-10', sport: 'Yoga', duration: null, distance: 2 }), name: '' }
    ];
    const model = buildCalendarModel(source, { year: 2026 });
    const day = model.days.find(item => item.dateKey === '2026-01-10');

    expect(day.tooltipActivities).toEqual([
      { id: '2026-01-10-Run', name: 'Run session', sport: 'Run', durationSeconds: 1800, distanceKm: 5 },
      { id: '2026-01-10-Yoga', name: 'Activity', sport: 'Other', durationSeconds: null, distanceKm: 2 }
    ]);
    expect(source[1].sport).toBe('Yoga');
  });

  it('defines the export-safe transparent empty-cell token', () => {
    expect(EMPTY_DAY_COLOR).toBe('rgba(241,245,249,0.5)');
  });
});
