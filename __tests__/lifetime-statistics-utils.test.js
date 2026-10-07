const {
  aggregateLifetimeStatistics
} = require('../src/lifetime-statistics-utils');
const { createActivity, createLifetimeBaselineActivities } = require('./fixtures/lifetime-statistics');

describe('aggregateLifetimeStatistics', () => {
  it('counts every activity and aggregates overall and per-supported-sport metrics', () => {
    const activities = createLifetimeBaselineActivities();
    const summary = aggregateLifetimeStatistics(activities);

    expect(summary.workoutCount).toBe(4);
    expect(summary.distance).toEqual({
      value: 55,
      availableCount: 3,
      activityCount: 4,
      status: 'partial'
    });
    expect(summary.movingTime).toEqual({
      value: 12600,
      availableCount: 4,
      activityCount: 4,
      status: 'complete'
    });
    expect(summary.sportSummaries.map(item => item.sport)).toEqual(['Run', 'Bike']);
    expect(summary.sportSummaries.find(item => item.sport === 'Run')).toMatchObject({
      workoutCount: 2,
      distance: {
        value: 10,
        availableCount: 1,
        activityCount: 2,
        status: 'partial'
      },
      movingTime: {
        value: 3600,
        availableCount: 2,
        activityCount: 2,
        status: 'complete'
      }
    });
    expect(summary.sportSummaries.find(item => item.sport === 'Bike')).toMatchObject({
      workoutCount: 1,
      distance: { value: 40, status: 'complete' },
      movingTime: { value: 7200, status: 'complete' }
    });
  });

  it('distinguishes a genuine zero from an unavailable metric', () => {
    const summary = aggregateLifetimeStatistics([
      {
        date: new Date(2025, 0, 1),
        sport: 'Run',
        distance: 0,
        distanceAvailable: true,
        duration: 0,
        durationAvailable: false,
        elevationGain: null,
        equipment: ''
      }
    ]);

    expect(summary.distance).toEqual({
      value: 0,
      availableCount: 1,
      activityCount: 1,
      status: 'complete'
    });
    expect(summary.movingTime).toEqual({
      value: null,
      availableCount: 0,
      activityCount: 1,
      status: 'unavailable'
    });
  });

  it('aggregates elevation, local active days, and longest valid activities', () => {
    const summary = aggregateLifetimeStatistics(createLifetimeBaselineActivities());

    expect(summary.elevationGain).toEqual({
      value: 300,
      availableCount: 3,
      activityCount: 4,
      status: 'partial'
    });
    expect(summary.activeDayCount).toBe(3);
    expect(summary.longestByDistance).toMatchObject({
      name: 'Long ride',
      date: new Date(2025, 0, 2),
      value: 40,
      sport: 'Bike'
    });
    expect(summary.longestByMovingTime).toMatchObject({
      name: 'Long ride',
      date: new Date(2025, 0, 2),
      value: 7200,
      sport: 'Bike'
    });
  });

  it('keeps the first input activity for tied longest values and handles unavailable milestones', () => {
    const tiedActivities = [
      createActivity({ id: 'first-tie', name: 'First tie', distance: 5, duration: 500, elevationGain: null }),
      createActivity({ id: 'second-tie', name: 'Second tie', distance: 5, duration: 500, elevationGain: null })
    ];
    const tiedSummary = aggregateLifetimeStatistics(tiedActivities);

    expect(tiedSummary.longestByDistance.name).toBe('First tie');
    expect(tiedSummary.longestByMovingTime.name).toBe('First tie');

    const unavailableSummary = aggregateLifetimeStatistics([
      createActivity({ distance: -1, distanceAvailable: true, duration: NaN, durationAvailable: true, elevationGain: null })
    ]);
    expect(unavailableSummary.elevationGain.status).toBe('unavailable');
    expect(unavailableSummary.longestByDistance).toBeNull();
    expect(unavailableSummary.longestByMovingTime).toBeNull();
  });

  it('counts distinct trimmed shoes and bikes used while ignoring blanks and placeholders', () => {
    const summary = aggregateLifetimeStatistics([
      createActivity({ id: 'bike-first', sport: 'Bike', equipment: '  Road bike  ' }),
      createActivity({ id: 'bike-duplicate', sport: 'Bike', equipment: 'Road bike' }),
      createActivity({ id: 'bike-second', sport: 'Bike', equipment: 'Other bike' }),
      createActivity({ id: 'bike-blank', sport: 'Bike', equipment: '   ' }),
      createActivity({ id: 'bike-dash', sport: 'Bike', equipment: '-' }),
      createActivity({ id: 'bike-none', sport: 'Bike', equipment: 'NoNe' }),
      createActivity({ id: 'bike-unknown', sport: 'Bike', equipment: 'UNKNOWN' }),
      createActivity({ id: 'bike-na', sport: 'Bike', equipment: 'n/a' }),
      createActivity({ id: 'run-gear', sport: 'Run', equipment: 'Road bike' })
    ]);

    expect(summary.equipmentCounts).toEqual({ shoes: 1, bikes: 2 });

    const shoeSummary = aggregateLifetimeStatistics([
      createActivity({ id: 'run-shoe-one', sport: 'Run', equipment: '  Daily trainer  ' }),
      createActivity({ id: 'run-shoe-repeat', sport: 'Run', equipment: 'Daily trainer' }),
      createActivity({ id: 'run-shoe-two', sport: 'Run', equipment: 'Race shoe' }),
      createActivity({ id: 'run-empty-shoe', sport: 'Run', equipment: '' }),
      createActivity({ id: 'swim-gear', sport: 'Swim', equipment: 'Pool gear' })
    ]);
    expect(shoeSummary.equipmentCounts).toEqual({ shoes: 2, bikes: 0 });
  });

  it('returns an empty result shape for an empty input and does not mutate input records', () => {
    const emptySummary = aggregateLifetimeStatistics([]);
    expect(emptySummary.workoutCount).toBe(0);
    expect(emptySummary.distance).toEqual({
      value: null,
      availableCount: 0,
      activityCount: 0,
      status: 'unavailable'
    });
    expect(emptySummary.movingTime.status).toBe('unavailable');
    expect(emptySummary.sportSummaries).toEqual([]);
    expect(emptySummary.longestByDistance).toBeNull();
    expect(emptySummary.longestByMovingTime).toBeNull();

    const activities = createLifetimeBaselineActivities();
    const original = activities.map(activity => ({ ...activity }));
    aggregateLifetimeStatistics(activities);
    expect(activities).toEqual(original);
  });
});
