const {
  parseLocalizedNumber,
  calculatePaceMinPerKm,
  calculatePaceMinPer100m,
  calculateSpeedKmH,
  getSportPerformanceMetric,
  calculateBubbleRadius,
  linearRegression,
  getHeartratePacePoints,
  getCadencePacePoints,
  getAvailableCadenceSports,
  getPaceMetricPoints,
  buildYearlyRegressionDatasets
} = require('../src/scatter-utils');

describe('scatter utils', () => {
  it('parses localized numbers', () => {
    expect(parseLocalizedNumber('123,4')).toBe(123.4);
    expect(parseLocalizedNumber('99.5')).toBe(99.5);
    expect(parseLocalizedNumber('')).toBeNull();
  });

  it('calculates pace min/km', () => {
    expect(calculatePaceMinPerKm(10, 3600)).toBe(6);
    expect(calculatePaceMinPerKm(0, 3600)).toBeNull();
    expect(calculatePaceMinPerKm(10, 0)).toBeNull();
  });

  it('calculates swim pace min/100m', () => {
    expect(calculatePaceMinPer100m(1, 1200)).toBe(2);
    expect(calculatePaceMinPer100m(0, 1200)).toBeNull();
    expect(calculatePaceMinPer100m(1, 0)).toBeNull();
  });

  it('calculates bike speed km/h', () => {
    expect(calculateSpeedKmH(40, 3600)).toBe(40);
    expect(calculateSpeedKmH(0, 3600)).toBeNull();
    expect(calculateSpeedKmH(40, 0)).toBeNull();
  });

  it('returns sport-specific performance metric metadata', () => {
    const run = getSportPerformanceMetric({ sport: 'Run', distance: 10, duration: 3600 });
    const swim = getSportPerformanceMetric({ sport: 'Swim', distance: 1, duration: 1200 });
    const bike = getSportPerformanceMetric({ sport: 'Bike', distance: 40, duration: 3600 });

    expect(run).toEqual({ value: 6, type: 'pace_run' });
    expect(swim).toEqual({ value: 2, type: 'pace_swim' });
    expect(bike).toEqual({ value: 40, type: 'speed_bike' });
  });

  it('returns null for unsupported or invalid sport performance metrics', () => {
    expect(getSportPerformanceMetric({ sport: 'Yoga', distance: 10, duration: 3600 })).toBeNull();
    expect(getSportPerformanceMetric({ sport: 'Run', distance: 0, duration: 3600 })).toBeNull();
    expect(getSportPerformanceMetric({ sport: 'Swim', distance: 1, duration: 0 })).toBeNull();
    expect(getSportPerformanceMetric({ sport: 'Bike', distance: 40, duration: 30 })).toBeNull(); // >80 km/h guard
  });

  it('calculates scaled bubble radius', () => {
    const minR = calculateBubbleRadius(100, 100, 1000);
    const maxR = calculateBubbleRadius(1000, 100, 1000);
    expect(minR).toBeGreaterThanOrEqual(0.4);
    expect(maxR).toBeLessThanOrEqual(16);
    expect(maxR).toBeGreaterThan(minR);
  });

  it('computes linear regression', () => {
    const result = linearRegression([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 }
    ]);

    expect(result).not.toBeNull();
    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
  });

  it('filters and maps heartrate pace points', () => {
    const activities = [
      {
        date: new Date(2025, 0, 10),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        avgHeartRate: 150,
        name: 'A'
      },
      {
        date: new Date(2025, 0, 11),
        sport: 'Bike',
        distance: 40,
        duration: 3600,
        avgHeartRate: 140,
        avgWatts: 210,
        name: 'B'
      },
      {
        date: new Date(2025, 0, 12),
        sport: 'Run',
        distance: 0,
        duration: 100,
        avgHeartRate: 150,
        name: 'invalid'
      }
    ];

    const points = getHeartratePacePoints(activities, {
      sport: 'Run',
      minDate: new Date(2025, 0, 1),
      maxDate: new Date(2025, 0, 31)
    });

    expect(points).toHaveLength(1);
    expect(points[0].x).toBeCloseTo(6, 5);
    expect(points[0].y).toBe(150);
    expect(points[0].metricType).toBe('pace_run');
  });

  it('uses sport-specific performance metrics', () => {
    const activities = [
      {
        date: new Date(2025, 0, 10),
        sport: 'Swim',
        distance: 1,
        duration: 1200,
        avgHeartRate: 132,
        name: 'Swim A'
      },
      {
        date: new Date(2025, 0, 11),
        sport: 'Bike',
        distance: 40,
        duration: 3600,
        avgHeartRate: 140,
        avgWatts: 210,
        name: 'Bike B'
      }
    ];

    const swimPoints = getHeartratePacePoints(activities, { sport: 'Swim' });
    const bikePoints = getHeartratePacePoints(activities, { sport: 'Bike' });

    expect(swimPoints).toHaveLength(1);
    expect(swimPoints[0].x).toBeCloseTo(2, 5);
    expect(swimPoints[0].metricType).toBe('pace_swim');

    expect(bikePoints).toHaveLength(1);
    expect(bikePoints[0].x).toBeCloseTo(40, 5);
    expect(bikePoints[0].metricType).toBe('speed_bike');
    expect(bikePoints[0].avgWatts).toBe(210);
  });

  it('returns mixed metric types when filtering all sports', () => {
    const activities = [
      {
        date: new Date(2025, 0, 10),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        avgHeartRate: 150,
        name: 'Run A'
      },
      {
        date: new Date(2025, 0, 11),
        sport: 'Swim',
        distance: 1,
        duration: 1200,
        avgHeartRate: 132,
        name: 'Swim B'
      },
      {
        date: new Date(2025, 0, 12),
        sport: 'Bike',
        distance: 40,
        duration: 3600,
        avgHeartRate: 140,
        avgWatts: 220,
        name: 'Bike C'
      }
    ];

    const points = getHeartratePacePoints(activities, { sport: 'All' });
    const metricTypes = points.map(p => p.metricType).sort();
    expect(metricTypes).toEqual(['pace_run', 'pace_swim', 'speed_bike']);

    const bikePoint = points.find(p => p.sport === 'Bike');
    expect(bikePoint.avgWatts).toBe(220);
  });

  it('returns qualifying Run cadence points with optional total steps', () => {
    const activities = [
      {
        date: new Date(2025, 0, 10),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        avgCadence: 178,
        totalSteps: 10680,
        name: 'Cadence run'
      },
      {
        date: new Date(2025, 0, 11),
        sport: 'Run',
        distance: 5,
        duration: 1800,
        avgCadence: 0,
        totalSteps: 5400,
        name: 'Zero cadence'
      },
      {
        date: new Date(2025, 0, 12),
        sport: 'Run',
        distance: 0,
        duration: 1800,
        avgCadence: 175,
        name: 'Invalid pace'
      }
    ];

    const points = getCadencePacePoints(activities, {
      sport: 'Run',
      minDate: new Date(2025, 0, 1),
      maxDate: new Date(2025, 0, 31)
    });

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      x: 6,
      y: 178,
      sport: 'Run',
      metricType: 'pace_run',
      totalSteps: 10680
    });
  });

  it('returns Bike and Swim cadence points without total steps', () => {
    const activities = [
      {
        date: new Date(2025, 0, 10),
        sport: 'Bike',
        distance: 40,
        duration: 3600,
        avgCadence: 92,
        totalSteps: 9999,
        name: 'Cadence ride'
      },
      {
        date: new Date(2025, 0, 11),
        sport: 'Swim',
        distance: 1,
        duration: 1200,
        avgCadence: 32,
        totalSteps: 9999,
        name: 'Cadence swim'
      }
    ];

    const points = getCadencePacePoints(activities);
    const bikePoint = points.find(point => point.sport === 'Bike');
    const swimPoint = points.find(point => point.sport === 'Swim');

    expect(bikePoint).toMatchObject({ x: 40, y: 92, metricType: 'speed_bike', totalSteps: null });
    expect(swimPoint).toMatchObject({ x: 2, y: 32, metricType: 'pace_swim', totalSteps: null });
  });

  it('lists only sports with qualifying cadence points in stable order', () => {
    const activities = [
      { date: new Date(2025, 0, 10), sport: 'Swim', distance: 1, duration: 1200, avgCadence: 30 },
      { date: new Date(2025, 0, 11), sport: 'Bike', distance: 40, duration: 3600, avgCadence: 90 },
      { date: new Date(2025, 0, 12), sport: 'Run', distance: 10, duration: 3600, avgCadence: 175 },
      { date: new Date(2025, 0, 13), sport: 'Run', distance: 10, duration: 3600, avgCadence: null }
    ];

    expect(getAvailableCadenceSports(activities)).toEqual(['Run', 'Bike', 'Swim']);
  });

  it('builds cadence points for 3,000 activities within one second', () => {
    const activities = Array.from({ length: 3000 }, (_, index) => ({
      date: new Date(2025, 0, (index % 28) + 1),
      sport: ['Run', 'Bike', 'Swim'][index % 3],
      distance: index % 3 === 0 ? 10 : (index % 3 === 1 ? 40 : 1),
      duration: index % 3 === 0 ? 3600 : (index % 3 === 1 ? 3600 : 1200),
      avgCadence: 80 + (index % 100),
      name: `Activity ${index}`
    }));
    const startedAt = Date.now();
    const points = getCadencePacePoints(activities);

    expect(points).toHaveLength(3000);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });

  it('builds one selected-sport pace metric point for each supported metric', () => {
    const activity = {
      date: new Date(2025, 0, 10),
      sport: 'Run',
      distance: 10,
      duration: 3600,
      avgHeartRate: 150,
      avgCadence: 178,
      elevationGain: 210,
      totalSteps: 10680,
      name: 'Metric run'
    };

    const heartRate = getPaceMetricPoints([activity], { sport: 'Run', metric: 'heartRate' });
    const cadence = getPaceMetricPoints([activity], { sport: 'Run', metric: 'cadence' });
    const elevation = getPaceMetricPoints([activity], { sport: 'Run', metric: 'elevationGain' });
    const distance = getPaceMetricPoints([activity], { sport: 'Run', metric: 'distance' });

    expect(heartRate[0]).toMatchObject({ x: 6, y: 150, metric: 'heartRate', totalSteps: null });
    expect(cadence[0]).toMatchObject({ x: 6, y: 178, metric: 'cadence', totalSteps: 10680 });
    expect(elevation[0]).toMatchObject({ x: 6, y: 210, metric: 'elevationGain', totalSteps: null });
    expect(distance[0]).toMatchObject({ x: 6, y: 10, metric: 'distance', totalSteps: null });
  });

  it('requires a single supported sport and finite positive metric and performance values', () => {
    const activities = [
      { date: new Date(2025, 0, 10), sport: 'Run', distance: 10, duration: 3600, avgHeartRate: 150, avgCadence: 178, elevationGain: 100 },
      { date: new Date(2025, 0, 11), sport: 'Bike', distance: 40, duration: 3600, avgHeartRate: 140, avgCadence: 92, elevationGain: 0 },
      { date: new Date(2025, 0, 12), sport: 'Swim', distance: 1, duration: 1200, avgHeartRate: 0, avgCadence: 32, elevationGain: 5 }
    ];

    expect(getPaceMetricPoints(activities, { sport: 'All', metric: 'heartRate' })).toEqual([]);
    expect(getPaceMetricPoints(activities, { sport: 'Yoga', metric: 'heartRate' })).toEqual([]);
    expect(getPaceMetricPoints(activities, { sport: 'Bike', metric: 'elevationGain' })).toEqual([]);
    expect(getPaceMetricPoints(activities, { sport: 'Swim', metric: 'heartRate' })).toEqual([]);
    expect(getPaceMetricPoints(activities, { sport: 'Bike', metric: 'cadence' })[0]).toMatchObject({
      metricType: 'speed_bike',
      totalSteps: null
    });
  });

  it('returns an empty set for an unavailable metric while other valid metrics remain available', () => {
    const activities = [
      { date: new Date(2025, 0, 10), sport: 'Run', distance: 10, duration: 3600, avgHeartRate: 150, avgCadence: null, elevationGain: 120 }
    ];

    expect(getPaceMetricPoints(activities, { sport: 'Run', metric: 'cadence' })).toEqual([]);
    expect(getPaceMetricPoints(activities, { sport: 'Run', metric: 'heartRate' })).toHaveLength(1);
    expect(getPaceMetricPoints(activities, { sport: 'Run', metric: 'elevationGain' })).toHaveLength(1);
    expect(getPaceMetricPoints(activities, { sport: 'Run', metric: 'distance' })).toHaveLength(1);
  });

  it('builds yearly regression datasets', () => {
    const points = [
      { x: 4, y: 150, year: 2024 },
      { x: 5, y: 155, year: 2024 },
      { x: 6, y: 160, year: 2025 },
      { x: 7, y: 165, year: 2025 }
    ];

    const datasets = buildYearlyRegressionDatasets(points, ['#fff', '#000']);
    expect(datasets).toHaveLength(2);
    expect(datasets[0].label).toContain('Trend');
    expect(datasets[0].type).toBe('line');
    expect(datasets[0].year).toBe(2024);
  });

  it('adds order property to regression datasets for layering', () => {
    const points = [
      { x: 4, y: 150, year: 2024 },
      { x: 5, y: 155, year: 2024 }
    ];

    const datasets = buildYearlyRegressionDatasets(points, ['#fff']);
    expect(datasets[0].order).toBe(1);
  });

  it('applies correct border colors from palette to regression datasets', () => {
    const points = [
      { x: 4, y: 150, year: 2024 },
      { x: 5, y: 155, year: 2024 },
      { x: 6, y: 160, year: 2025 },
      { x: 7, y: 165, year: 2025 }
    ];

    const palette = ['#F59E0B', '#A78BFA'];
    const datasets = buildYearlyRegressionDatasets(points, palette);
    
    expect(datasets[0].borderColor).toBe('#F59E0B');
    expect(datasets[1].borderColor).toBe('#A78BFA');
  });

  it('regression datasets have correct line styling properties', () => {
    const points = [
      { x: 4, y: 150, year: 2024 },
      { x: 5, y: 155, year: 2024 }
    ];

    const datasets = buildYearlyRegressionDatasets(points, ['#fff']);
    const dataset = datasets[0];

    expect(dataset.borderDash).toEqual([6, 4]);
    expect(dataset.borderWidth).toBe(2);
    expect(dataset.pointRadius).toBe(0);
    expect(dataset.pointHoverRadius).toBe(0);
    expect(dataset.fill).toBe(false);
    expect(dataset.tension).toBe(0);
  });
});
