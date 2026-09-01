const {
  getEquipmentType,
  aggregateEquipmentDistance,
  aggregateEquipmentPace,
  aggregateEquipmentActivityCount,
  aggregateEquipmentAvgLength,
  aggregateEquipmentTimeline,
  getEquipmentTimelineActivities
} = require('../src/equipment-utils');

describe('equipment utils', () => {
  it('detects shoe vs bike equipment', () => {
    expect(getEquipmentType('ASICS Novablast 4')).toBe('Shoes');
    expect(getEquipmentType('Saucony Kinvara 13')).toBe('Shoes');
    expect(getEquipmentType('Storck Aero 2')).toBe('Bikes');
    expect(getEquipmentType('Granville')).toBe('Bikes');
  });

  it('aggregates total distance per equipment', () => {
    const result = aggregateEquipmentDistance([
      { equipment: 'ASICS Novablast 4', distance: 10 },
      { equipment: 'ASICS Novablast 4', distance: 5.5 },
      { equipment: 'Storck Aero 2', distance: 40 }
    ]);

    expect(result).toEqual([
      ['Storck Aero 2', 40],
      ['ASICS Novablast 4', 15.5]
    ]);
  });

  it('filters equipment by type', () => {
    const activities = [
      { equipment: 'ASICS Novablast 4', distance: 10 },
      { equipment: 'Storck Aero 2', distance: 40 }
    ];

    expect(aggregateEquipmentDistance(activities, 'Shoes')).toEqual([
      ['ASICS Novablast 4', 10]
    ]);

    expect(aggregateEquipmentDistance(activities, 'Bikes')).toEqual([
      ['Storck Aero 2', 40]
    ]);
  });

  it('aggregates average pace per equipment', () => {
    const result = aggregateEquipmentPace([
      { equipment: 'ASICS Novablast 4', distance: 10, duration: 3600 },
      { equipment: 'ASICS Novablast 4', distance: 5, duration: 1500 }
    ]);

    expect(result[0][0]).toBe('ASICS Novablast 4');
    expect(result[0][1]).toBeCloseTo(5.666, 2);
  });

  it('ignores activities with blank or empty equipment', () => {
    const runs = [
      { equipment: '', distance: 10, duration: 3600 },
      { equipment: null, distance: 8, duration: 3000 },
      { equipment: '   ', distance: 9, duration: 3200 },
      { equipment: 'Pegasus', distance: 12, duration: 3600 }
    ];
    expect(aggregateEquipmentPace(runs).map(([e]) => e)).toEqual(['Pegasus']);
    expect(aggregateEquipmentDistance(runs).map(([e]) => e)).toEqual(['Pegasus']);
    expect(aggregateEquipmentActivityCount(runs).map(([e]) => e)).toEqual(['Pegasus']);
    expect(aggregateEquipmentAvgLength(runs).map(([e]) => e)).toEqual(['Pegasus']);
  });

  it('counts activities per equipment', () => {
    const acts = [
      { equipment: 'Nike Zoom', distance: 12 },
      { equipment: 'Nike Zoom', distance: 15 },
      { equipment: 'Brooks', distance: 8 }
    ];
    const result = aggregateEquipmentActivityCount(acts);
    expect(result).toEqual([
      ['Nike Zoom', 2],
      ['Brooks', 1]
    ]);
  });

  it('computes average activity length per equipment', () => {
    const acts = [
      { equipment: 'Peg', distance: 10 },
      { equipment: 'Peg', distance: 6 },
      { equipment: 'Bondi', distance: 14 }
    ];
    const result = aggregateEquipmentAvgLength(acts);
    expect(result).toEqual([
      ['Bondi', 14],
      ['Peg', 8]]); // (10+6)/2 = 8
  });

  describe('aggregateEquipmentTimeline', () => {
    const d = s => new Date(s);

    const activities = [
      { equipment: 'ASICS Novablast 4', date: d('2024-01-10'), distance: 10 },
      { equipment: 'ASICS Novablast 4', date: d('2024-06-15'), distance: 12 },
      { equipment: 'ASICS Novablast 4', date: d('2024-03-20'), distance: 8 },
      { equipment: 'Nike Pegasus',      date: d('2025-02-01'), distance: 9 },
      { equipment: 'Nike Pegasus',      date: d('2025-05-10'), distance: 11 },
      { equipment: 'Storck Aero 2',     date: d('2023-07-04'), distance: 50 }
    ];

    it('returns entries sorted by lastDate descending', () => {
      const result = aggregateEquipmentTimeline(activities);
      expect(result.map(e => e.name)).toEqual([
        'Nike Pegasus',
        'ASICS Novablast 4',
        'Storck Aero 2'
      ]);
    });

    it('computes correct firstDate and lastDate for each equipment', () => {
      const result = aggregateEquipmentTimeline(activities);
      const asics = result.find(e => e.name === 'ASICS Novablast 4');
      expect(asics.firstDate).toEqual(d('2024-01-10'));
      expect(asics.lastDate).toEqual(d('2024-06-15'));
    });

    it('accumulates totalKm and activityCount', () => {
      const result = aggregateEquipmentTimeline(activities);
      const peg = result.find(e => e.name === 'Nike Pegasus');
      expect(peg.totalKm).toBeCloseTo(20, 5);
      expect(peg.activityCount).toBe(2);
    });

    it('assigns correct equipment type', () => {
      const result = aggregateEquipmentTimeline(activities);
      expect(result.find(e => e.name === 'ASICS Novablast 4').type).toBe('Shoes');
      expect(result.find(e => e.name === 'Storck Aero 2').type).toBe('Bikes');
    });

    it('filters by Shoes', () => {
      const result = aggregateEquipmentTimeline(activities, 'Shoes');
      expect(result.every(e => e.type === 'Shoes')).toBe(true);
      expect(result.find(e => e.name === 'Storck Aero 2')).toBeUndefined();
    });

    it('filters by Bikes', () => {
      const result = aggregateEquipmentTimeline(activities, 'Bikes');
      expect(result.every(e => e.type === 'Bikes')).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Storck Aero 2');
    });

    it('ignores activities with missing equipment', () => {
      const mixed = [
        { equipment: '',   date: d('2024-01-01'), distance: 10 },
        { equipment: null, date: d('2024-01-02'), distance: 5 },
        { equipment: 'Hoka', date: d('2024-03-01'), distance: 8 }
      ];
      const result = aggregateEquipmentTimeline(mixed);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Hoka');
    });

    it('ignores activities with zero or negative distance', () => {
      const mixed = [
        { equipment: 'Hoka', date: d('2024-01-01'), distance: 0 },
        { equipment: 'Hoka', date: d('2024-02-01'), distance: -5 },
        { equipment: 'Hoka', date: d('2024-03-01'), distance: 10 }
      ];
      const result = aggregateEquipmentTimeline(mixed);
      expect(result.length).toBe(1);
      expect(result[0].firstDate).toEqual(d('2024-03-01'));
      expect(result[0].lastDate).toEqual(d('2024-03-01'));
      expect(result[0].activityCount).toBe(1);
    });

    it('returns empty array when no valid activities', () => {
      expect(aggregateEquipmentTimeline([])).toEqual([]);
      expect(aggregateEquipmentTimeline([
        { equipment: '', date: d('2024-01-01'), distance: 10 }
      ])).toEqual([]);
    });
  });

  describe('getEquipmentTimelineActivities', () => {
    const d = s => new Date(s);

    const activities = [
      { equipment: 'ASICS Novablast 4', date: d('2024-01-10'), distance: 10, name: 'Morning run', sport: 'Run' },
      { equipment: 'ASICS Novablast 4', date: d('2024-06-15'), distance: 12, name: 'Long run', sport: 'Run' },
      { equipment: 'ASICS Novablast 4', date: d('2024-03-20'), distance: 8,  name: 'Easy run', sport: 'Run' },
      { equipment: 'Nike Pegasus',      date: d('2025-02-01'), distance: 9,  name: 'Track', sport: 'Run' },
      { equipment: 'Nike Pegasus',      date: d('2025-05-10'), distance: 11, name: 'Race', sport: 'Run' },
      { equipment: 'Storck Aero 2',     date: d('2023-07-04'), distance: 50, name: 'Ride', sport: 'Bike' }
    ];

    it('returns rows sorted by lastDate descending', () => {
      const result = getEquipmentTimelineActivities(activities);
      expect(result.map(r => r.name)).toEqual([
        'Nike Pegasus',
        'ASICS Novablast 4',
        'Storck Aero 2'
      ]);
    });

    it('sorts activities within each row chronologically ascending', () => {
      const result = getEquipmentTimelineActivities(activities);
      const asics = result.find(r => r.name === 'ASICS Novablast 4');
      const dates = asics.activities.map(a => a.date.toISOString().slice(0, 10));
      expect(dates).toEqual(['2024-01-10', '2024-03-20', '2024-06-15']);
    });

    it('includes distance and name on each activity', () => {
      const result = getEquipmentTimelineActivities(activities);
      const peg = result.find(r => r.name === 'Nike Pegasus');
      expect(peg.activities[0].distance).toBe(9);
      expect(peg.activities[0].name).toBe('Track');
      expect(peg.activities[1].name).toBe('Race');
    });

    it('sets firstDate and lastDate from activities in the row', () => {
      const result = getEquipmentTimelineActivities(activities);
      const asics = result.find(r => r.name === 'ASICS Novablast 4');
      expect(asics.firstDate).toEqual(d('2024-01-10'));
      expect(asics.lastDate).toEqual(d('2024-06-15'));
    });

    it('assigns correct equipment type', () => {
      const result = getEquipmentTimelineActivities(activities);
      expect(result.find(r => r.name === 'ASICS Novablast 4').type).toBe('Shoes');
      expect(result.find(r => r.name === 'Storck Aero 2').type).toBe('Bikes');
    });

    it('filters by Shoes', () => {
      const result = getEquipmentTimelineActivities(activities, 'Shoes');
      expect(result.every(r => r.type === 'Shoes')).toBe(true);
      expect(result.find(r => r.name === 'Storck Aero 2')).toBeUndefined();
    });

    it('filters by Bikes', () => {
      const result = getEquipmentTimelineActivities(activities, 'Bikes');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Storck Aero 2');
      expect(result[0].activities.length).toBe(1);
    });

    it('ignores activities with missing or empty equipment', () => {
      const mixed = [
        { equipment: '',   date: d('2024-01-01'), distance: 5,  name: 'A', sport: 'Run' },
        { equipment: null, date: d('2024-02-01'), distance: 6,  name: 'B', sport: 'Run' },
        { equipment: 'Hoka', date: d('2024-03-01'), distance: 8, name: 'C', sport: 'Run' }
      ];
      const result = getEquipmentTimelineActivities(mixed);
      expect(result.length).toBe(1);
      expect(result[0].activities.length).toBe(1);
    });

    it('ignores activities with zero or negative distance', () => {
      const mixed = [
        { equipment: 'Hoka', date: d('2024-01-01'), distance: 0,  name: 'X', sport: 'Run' },
        { equipment: 'Hoka', date: d('2024-02-01'), distance: -1, name: 'Y', sport: 'Run' },
        { equipment: 'Hoka', date: d('2024-03-01'), distance: 10, name: 'Z', sport: 'Run' }
      ];
      const result = getEquipmentTimelineActivities(mixed);
      expect(result[0].activities.length).toBe(1);
      expect(result[0].activities[0].name).toBe('Z');
    });

    it('returns empty array for no valid input', () => {
      expect(getEquipmentTimelineActivities([])).toEqual([]);
    });
  });
});
