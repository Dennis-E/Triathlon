function createActivity(overrides = {}) {
  return {
    id: 'activity-1',
    name: 'Synthetic workout',
    sport: 'Run',
    sportRaw: 'Run',
    date: new Date(2025, 0, 1),
    startTime: new Date(2025, 0, 1, 8, 0, 0),
    distance: 10,
    duration: 3600,
    elevationGain: 100,
    equipment: '',
    ...overrides
  };
}

function createLifetimeBaselineActivities() {
  return [
    createActivity({
      id: 'run-known',
      name: 'Morning run',
      sportRaw: 'Run',
      distance: 10,
      duration: 3600,
      elevationGain: 100,
      equipment: 'Road shoes'
    }),
    createActivity({
      id: 'run-missing-distance',
      name: 'Short run',
      sportRaw: 'Run',
      distance: 0,
      distanceAvailable: false,
      duration: 0,
      durationAvailable: true,
      elevationGain: null,
      equipment: 'Road shoes'
    }),
    createActivity({
      id: 'bike-known',
      name: 'Long ride',
      sport: 'Bike',
      sportRaw: 'Ride',
      date: new Date(2025, 0, 2),
      startTime: new Date(2025, 0, 2, 9, 0, 0),
      distance: 40,
      duration: 7200,
      elevationGain: 200,
      equipment: '  Road bike  '
    }),
    createActivity({
      id: 'unknown-sport',
      name: 'Unclassified workout',
      sport: null,
      sportRaw: 'Other workout',
      date: new Date(2025, 0, 3),
      startTime: new Date(2025, 0, 3, 10, 0, 0),
      distance: 5,
      duration: 1800,
      elevationGain: 0,
      equipment: 'n/a'
    })
  ];
}

module.exports = {
  createActivity,
  createLifetimeBaselineActivities
};
