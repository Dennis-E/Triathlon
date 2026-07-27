const {
  getEquipmentType,
  aggregateEquipmentDistance,
  aggregateEquipmentPace
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
});
