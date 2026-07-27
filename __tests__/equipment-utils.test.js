const {
  getEquipmentType,
  aggregateEquipmentDistance
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
});
