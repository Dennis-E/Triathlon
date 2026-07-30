/**
 * Unit Tests for Data Processing Functions
 * Tests for CSV parsing, activity processing, and aggregation
 */

const {
  processData,
  parseCsvSimple,
  aggregateByWeek,
  calculateTotalsByCategory,
  calculateMetrics,
  formatDateIso
} = require('../dashboard-utils');

describe('parseCsvSimple', () => {
  it('should parse simple CSV text into 2D array', () => {
    const csv = 'A,B,C\n1,2,3\n4,5,6';
    const result = parseCsvSimple(csv);
    
    expect(result.length).toBe(3);
    expect(result[0]).toEqual(['A', 'B', 'C']);
    expect(result[1]).toEqual(['1', '2', '3']);
    expect(result[2]).toEqual(['4', '5', '6']);
  });

  it('should trim whitespace from cells', () => {
    const csv = 'A , B , C\n 1 , 2 , 3 ';
    const result = parseCsvSimple(csv);
    
    expect(result[0]).toEqual(['A', 'B', 'C']);
    expect(result[1]).toEqual(['1', '2', '3']);
  });

  it('should handle empty lines at end', () => {
    const csv = 'A,B\n1,2\n\n';
    const result = parseCsvSimple(csv);
    
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('processData', () => {
  it('should return empty array for null data', () => {
    expect(processData(null)).toEqual([]);
  });

  it('should return empty array for too short data', () => {
    expect(processData([])).toEqual([]);
    expect(processData([['header']])).toEqual([]);
  });

  it('should throw error if required columns are missing', () => {
    const data = [
      ['WrongHeader1', 'WrongHeader2'],
      ['value1', 'value2'] // Need at least data row
    ];
    expect(() => processData(data)).toThrow();
  });

  it('should process valid CSV data correctly', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Morning run', '3600', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBe('Run');
    expect(result[0].name).toBe('Morning run');
    expect(result[0].distance).toBe(10); // meters to km
    expect(result[0].duration).toBe(3600);
  });

  it('should keep equipment and average heart rate in the interim activity objects', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Aktivitätsausrüstung', 'Bewegungszeit', 'Durchschnittliche Herzfrequenz', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Morning run', 'ASICS Novablast 4', '3600', '152', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].equipment).toBe('ASICS Novablast 4');
    expect(result[0].avgHeartRate).toBe(152);
  });

  it('should skip rows with invalid dates', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['invalid-date', 'Lauf', 'Bad date run', '3600', '10000'],
      ['19.07.2026, 14:52:02', 'Radfahrt', 'Good bike ride', '1800', '15000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBe('Bike');
  });

  it('should handle unknown sports', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Unknown Sport', 'Unknown activity', '3600', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBeNull(); // Unknown sports have null sport
    expect(result[0].sportRaw).toBe('Unknown Sport');
  });

  it('should support newer bike activity labels', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Gravel Ride', 'Gravel session', '3600', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBe('Bike');
  });

  it('should support english export headers for required columns', () => {
    const data = [
      ['Activity Date', 'Activity Type', 'Activity Name', 'Moving Time', 'Distance'],
      ['19.07.2026, 14:52:02', 'Run', 'Morning run', '3600', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].sport).toBe('Run');
    expect(result[0].name).toBe('Morning run');
  });

  it('should parse distance with German number format (meters)', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Run', '3600', '10500,5'] // comma instead of dot, in meters
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].distance).toBe(10.5005); // 10500.5 / 1000
  });

  it('should handle missing distance column', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Run', '3600']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].distance).toBe(0);
  });

  it('should handle missing duration column', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Run', '10000']
    ];

    const result = processData(data);

    expect(result.length).toBe(1);
    expect(result[0].duration).toBe(0);
  });

  it('should sort activities by date chronologically', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['22.07.2026, 15:45:00', 'Lauf', 'Later run', '2700', '8500'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Earlier run', '3600', '10000'],
      ['20.07.2026, 06:30:00', 'Radfahrt', 'Middle bike', '1800', '15000']
    ];

    const result = processData(data);

    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Earlier run');
    expect(result[1].name).toBe('Middle bike');
    expect(result[2].name).toBe('Later run');
  });

  it('should calculate monday for each activity', () => {
    const data = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Saturday run', '3600', '10000']
    ];

    const result = processData(data);

    expect(result[0].monday).toBeDefined();
    expect(result[0].monday.getDay()).toBe(1); // Monday
  });
});

describe('aggregateByWeek', () => {
  it('should return empty array for no activities', () => {
    const result = aggregateByWeek([]);
    expect(result).toEqual([]);
  });

  it('should create weekly buckets with Run/Bike/Swim totals', () => {
    const activities = [
      {
        id: '1',
        date: new Date(2026, 6, 19),
        monday: new Date(2026, 6, 13),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        name: 'Run'
      },
      {
        id: '2',
        date: new Date(2026, 6, 20),
        monday: new Date(2026, 6, 13),
        sport: 'Bike',
        distance: 40,
        duration: 1800,
        name: 'Bike'
      }
    ];

    const result = aggregateByWeek(activities, 2);

    expect(result.length).toBeGreaterThan(0);
    const currentWeek = result.find(w => w.isoKey === formatDateIso(new Date(2026, 6, 13)));
    expect(currentWeek).toBeDefined();
    expect(currentWeek.Run).toBe(10);
    expect(currentWeek.Bike).toBe(40);
    expect(currentWeek.Swim).toBe(0);
  });

  it('should return empty array when there are no activities', () => {
    const activities = [];
    const result = aggregateByWeek(activities, 4);

    // With no activities, there's no data to aggregate, so return empty
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });

  it('should skip null sports in aggregation', () => {
    const activities = [
      {
        id: '1',
        date: new Date(2026, 6, 19),
        monday: new Date(2026, 6, 13),
        sport: null, // Unknown sport
        distance: 10,
        duration: 3600,
        name: 'Unknown'
      }
    ];

    const result = aggregateByWeek(activities, 1);

    // Should not crash, just skip
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('calculateTotalsByCategory', () => {
  it('should return zero totals for empty activities', () => {
    const result = calculateTotalsByCategory([]);

    expect(result.Run).toBe(0);
    expect(result.Bike).toBe(0);
    expect(result.Swim).toBe(0);
    expect(result.All).toBe(0);
  });

  it('should sum distances by sport category', () => {
    const activities = [
      { sport: 'Run', distance: 10 },
      { sport: 'Run', distance: 5 },
      { sport: 'Bike', distance: 40 },
      { sport: 'Swim', distance: 2 }
    ];

    const result = calculateTotalsByCategory(activities);

    expect(result.Run).toBe(15);
    expect(result.Bike).toBe(40);
    expect(result.Swim).toBe(2);
    expect(result.All).toBe(57);
  });

  it('should handle null sports', () => {
    const activities = [
      { sport: 'Run', distance: 10 },
      { sport: null, distance: 5 }, // Unknown
      { sport: 'Bike', distance: 40 }
    ];

    const result = calculateTotalsByCategory(activities);

    expect(result.Run).toBe(10);
    expect(result.Bike).toBe(40);
    expect(result.Swim).toBe(0);
    expect(result.All).toBe(50); // Only counts known sports
  });
});

describe('calculateMetrics', () => {
  it('should return zero metrics for empty activities', () => {
    const result = calculateMetrics([]);

    expect(result.totalKm).toBe(0);
    expect(result.avgKmPerWeek).toBe(0);
    expect(result.peakWeekKm).toBe(0);
    expect(result.uniqueDays).toBe(0);
  });

  it('should calculate total distance correctly', () => {
    const activities = [
      {
        id: '1',
        date: new Date(2026, 6, 19),
        monday: new Date(2026, 6, 13),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        name: 'Run'
      },
      {
        id: '2',
        date: new Date(2026, 6, 20),
        monday: new Date(2026, 6, 13),
        sport: 'Bike',
        distance: 40,
        duration: 1800,
        name: 'Bike'
      }
    ];

    const result = calculateMetrics(activities, 52);

    expect(result.totalKm).toBe(50);
  });

  it('should calculate average per week correctly', () => {
    const activities = [
      {
        id: '1',
        date: new Date(2026, 6, 19),
        monday: new Date(2026, 6, 13),
        sport: 'Run',
        distance: 52, // Exactly 52 km
        duration: 3600,
        name: 'Run'
      }
    ];

    const result = calculateMetrics(activities, 52);

    expect(result.avgKmPerWeek).toBe(1); // 52 km / 52 weeks
  });

  it('should count unique training days', () => {
    const activities = [
      {
        id: '1',
        date: new Date(2026, 6, 19),
        monday: new Date(2026, 6, 13),
        sport: 'Run',
        distance: 10,
        duration: 3600,
        name: 'Run1'
      },
      {
        id: '2',
        date: new Date(2026, 6, 19), // Same day
        monday: new Date(2026, 6, 13),
        sport: 'Bike',
        distance: 40,
        duration: 1800,
        name: 'Bike'
      },
      {
        id: '3',
        date: new Date(2026, 6, 20), // Different day
        monday: new Date(2026, 6, 13),
        sport: 'Swim',
        distance: 2,
        duration: 1200,
        name: 'Swim'
      }
    ];

    const result = calculateMetrics(activities, 52);

    expect(result.uniqueDays).toBe(2); // Two different days
  });
});
