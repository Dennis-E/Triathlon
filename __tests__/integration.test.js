/**
 * Integration Tests
 * Tests for complete workflows: CSV import -> parsing -> processing -> calculations
 */

const {
  processData,
  parseCsvSimple,
  aggregateByWeek,
  calculateTotalsByCategory,
  calculateMetrics
} = require('../src/dashboard-utils');
const { reduceActivitiesRows } = require('../scripts/relevant-export-extractor');
const { aggregateEquipmentDistance } = require('../src/equipment-utils');

const TEST_CSV = [
  'Aktivitätsdatum,Aktivitätsart,Name der Aktivität,Bewegungszeit,Distanz',
  '"14.07.2026, 14:52:02",Lauf,Test Run,3600,10000',
  '"15.07.2026, 06:30:00",Radfahrt,Test Ride,1800,15000',
  '"16.07.2026, 10:15:00",Schwimmen,Test Swim,1200,2000'
].join('\n');

function getTestCsvData() {
  return parseCsvSimple(TEST_CSV);
}

describe('Complete CSV Import Workflow', () => {
  let testCsvData;
  let processedActivities;

  beforeAll(() => {
    testCsvData = getTestCsvData();
  });

  it('should load test CSV data successfully', () => {
    expect(testCsvData).toBeDefined();
    expect(testCsvData.length).toBeGreaterThan(1); // Has header + data
  });

  it('should have correct headers', () => {
    const headers = testCsvData[0];
    expect(headers).toContain('Aktivitätsdatum');
    expect(headers).toContain('Aktivitätsart');
    expect(headers).toContain('Name der Aktivität');
    expect(headers).toContain('Bewegungszeit');
    expect(headers).toContain('Distanz');
  });

  it('should parse CSV into activities', () => {
    processedActivities = processData(testCsvData);
    expect(processedActivities.length).toBeGreaterThan(0);
  });

  it('should have correct activity data types', () => {
    expect(processedActivities[0]).toHaveProperty('id');
    expect(processedActivities[0]).toHaveProperty('date');
    expect(processedActivities[0]).toHaveProperty('monday');
    expect(processedActivities[0]).toHaveProperty('sport');
    expect(processedActivities[0]).toHaveProperty('distance');
    expect(processedActivities[0]).toHaveProperty('duration');
    expect(processedActivities[0]).toHaveProperty('name');
  });

  it('should have valid dates', () => {
    processedActivities.forEach(activity => {
      expect(activity.date instanceof Date).toBe(true);
      expect(activity.monday instanceof Date).toBe(true);
      expect(isNaN(activity.date.getTime())).toBe(false);
    });
  });

  it('should calculate totals by category', () => {
    const totals = calculateTotalsByCategory(processedActivities);
    
    expect(totals.Run).toBeGreaterThan(0);
    expect(totals.Bike).toBeGreaterThan(0);
    expect(totals.All).toBe(totals.Run + totals.Bike + totals.Swim);
  });

  it('should aggregate by week', () => {
    const weekly = aggregateByWeek(processedActivities, 2);
    
    expect(weekly.length).toBeGreaterThan(0);
    weekly.forEach(week => {
      expect(week).toHaveProperty('Run');
      expect(week).toHaveProperty('Bike');
      expect(week).toHaveProperty('Swim');
      expect(week).toHaveProperty('formattedLabel');
      expect(week).toHaveProperty('isoKey');
    });
  });

  it('should calculate metrics', () => {
    const metrics = calculateMetrics(processedActivities, 52);
    
    expect(metrics.totalKm).toBeGreaterThan(0);
    expect(metrics.avgKmPerWeek).toBeGreaterThan(0);
    expect(metrics.peakWeekKm).toBeGreaterThan(0);
    expect(metrics.uniqueDays).toBeGreaterThan(0);
  });
});

describe('CSV Import with Different Filters', () => {
  let processedActivities;

  beforeAll(() => {
    processedActivities = processData(getTestCsvData());
  });

  it('should filter activities by sport', () => {
    const runOnly = processedActivities.filter(a => a.sport === 'Run');
    const bikeOnly = processedActivities.filter(a => a.sport === 'Bike');

    expect(runOnly.length).toBeGreaterThan(0);
    expect(bikeOnly.length).toBeGreaterThan(0);
    expect(runOnly.length + bikeOnly.length).toBeLessThanOrEqual(processedActivities.length);
  });

  it('should calculate different totals for filtered sports', () => {
    const runOnly = processedActivities.filter(a => a.sport === 'Run');
    const allActivities = processedActivities;

    const runTotals = calculateTotalsByCategory(runOnly);
    const allTotals = calculateTotalsByCategory(allActivities);

    expect(runTotals.Run).toBeLessThanOrEqual(allTotals.Run);
    expect(runTotals.All).toBeLessThanOrEqual(allTotals.All);
  });

  it('should respect timeframe filter in weekly aggregation', () => {
    const weekly12 = aggregateByWeek(processedActivities, 12);
    const weekly52 = aggregateByWeek(processedActivities, 52);

    expect(weekly12.length).toBe(12);
    expect(weekly52.length).toBe(52);
  });
});

describe('End-to-End Dashboard Metrics', () => {
  let allMetrics;

  beforeAll(() => {
    const processedActivities = processData(getTestCsvData());
    allMetrics = calculateMetrics(processedActivities, 52);
  });

  it('should show valid dashboard metrics', () => {
    expect(allMetrics.totalKm).toBeGreaterThan(0);
    expect(allMetrics.avgKmPerWeek).toBeGreaterThan(0);
    expect(allMetrics.peakWeekKm).toBeGreaterThan(0);
    expect(allMetrics.uniqueDays).toBeGreaterThan(0);
  });

  it('should have realistic metric relationships', () => {
    // Peak week should be >= average week
    expect(allMetrics.peakWeekKm).toBeGreaterThanOrEqual(allMetrics.avgKmPerWeek);
    
    // Total should equal avg * weeks (approximately)
    const calculatedTotal = allMetrics.avgKmPerWeek * 52;
    expect(Math.abs(allMetrics.totalKm - calculatedTotal)).toBeLessThan(0.1);
  });
});

describe('Data Validation', () => {
  it('should handle CSV with extra columns', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz', 'ExtraColumn1', 'ExtraColumn2'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Morning run', '3600', '10000', 'extra1', 'extra2']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBe('Run');
  });

  it('should handle CSV with columns in different order', () => {
    const data = [
      ['Name der Aktivität', 'Aktivitätsdatum', 'Distanz', 'Aktivitätsart', 'Bewegungszeit'],
      ['Morning run', '19.07.2026, 14:52:02', '10000', 'Lauf', '3600']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Morning run');
    expect(result[0].sport).toBe('Run');
  });

  it('should handle partial rows', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf'] // Incomplete row
    ];

    const result = processData(data);

    // Should skip incomplete row or handle gracefully
    expect(Array.isArray(result)).toBe(true);
  });

  it('preserves readable equipment names through raw export reduction and processing', () => {
    const rawRows = [
      [
        'Activity ID',
        'Activity Date',
        'Activity Name',
        'Activity Type',
        'Activity Description',
        'Elapsed Time',
        'Distance',
        'Activity Gear',
        'Moving Time',
        'Distance',
        'Bike',
        'Gear'
      ],
      [
        '1',
        'Jul 28, 2026, 4:09:25 PM',
        'Evening Run',
        'Run',
        '',
        '2387',
        '7.71',
        'Saucony Kinvara 13',
        '2362',
        '7711.5',
        '17529118',
        '15416331'
      ],
      [
        '2',
        'Jul 29, 2026, 2:21:10 PM',
        'Zwift Ride',
        'Virtual Ride',
        '',
        '3467',
        '26.92',
        'Granville',
        '3467',
        '26927.5',
        '6071390',
        '6071390'
      ]
    ];

    const reducedRows = reduceActivitiesRows(rawRows);
    const processedActivities = processData(reducedRows);

    expect(processedActivities).toHaveLength(2);
    expect(processedActivities[0].equipment).toBe('Saucony Kinvara 13');
    expect(processedActivities[1].equipment).toBe('Granville');

    expect(aggregateEquipmentDistance(processedActivities, 'Shoes')).toEqual([
      ['Saucony Kinvara 13', 7.7115]
    ]);
    expect(aggregateEquipmentDistance(processedActivities, 'Bikes')).toEqual([
      ['Granville', 26.9275]
    ]);
  });
});
