const {
  getEquipmentType,
  aggregateEquipmentDistance,
  aggregateEquipmentPace,
  aggregateEquipmentActivityCount,
  aggregateEquipmentAvgLength
} = require('../equipment-utils');

describe('equipment utils', () => {
  it('detects shoe vs bike equipment', () => {
    expect(getEquipmentType('ASICS Novablast 4')).toBe('Shoes');
    expect(getEquipmentType('Storck Aero 2')).toBe('Bikes');
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
});
