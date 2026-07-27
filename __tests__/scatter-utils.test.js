const {
  parseLocalizedNumber,
  calculatePaceMinPerKm,
  calculateBubbleRadius,
  linearRegression,
  getHeartratePacePoints,
  buildYearlyRegressionDatasets
} = require('../scatter-utils');

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
});
