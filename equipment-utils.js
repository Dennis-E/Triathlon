const SHOE_PATTERN = /(asics|nike|adidas|saucony|hoka|brooks|mizuno|altra|saguaro)/i;

function getEquipmentType(name) {
  if (!name) return null;
  return SHOE_PATTERN.test(name) ? 'Shoes' : 'Bikes';
}

function aggregateEquipmentDistance(activities, filter = 'All') {
  const totals = activities
    .filter(activity => {
      if (!activity.equipment || activity.distance <= 0) return false;

      const type = getEquipmentType(activity.equipment);

      if (filter === 'Shoes') return type === 'Shoes';
      if (filter === 'Bikes') return type === 'Bikes';

      return true;
    })
    .reduce((acc, activity) => {
      acc[activity.equipment] = (acc[activity.equipment] || 0) + activity.distance;
      return acc;
    }, {});

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1]);
}

function aggregateEquipmentPace(activities, filter = 'All') {
  const totals = activities
    .filter(activity => {
      // Ignore activities with blank/null/empty equipment
      if (!activity.equipment || activity.equipment.trim() === '' || activity.distance <= 0 || activity.duration <= 0) return false;

      const type = getEquipmentType(activity.equipment);

      if (filter === 'Shoes') return type === 'Shoes';
      if (filter === 'Bikes') return type === 'Bikes';

      return true;
    })
    .reduce((acc, activity) => {
      if (!acc[activity.equipment]) {
        acc[activity.equipment] = { distance: 0, duration: 0 };
      }

      acc[activity.equipment].distance += activity.distance;
      acc[activity.equipment].duration += activity.duration;
      return acc;
    }, {});

  return Object.entries(totals)
    .map(([equipment, values]) => ([equipment, (values.duration / 60) / values.distance]))
    .sort((a, b) => a[1] - b[1]);
}

function aggregateEquipmentActivityCount(activities, filter = 'All') {
  const counts = activities
    .filter(activity => {
      if (!activity.equipment || activity.equipment.trim() === '' || activity.distance <= 0) return false;
      const type = getEquipmentType(activity.equipment);
      if (filter === 'Shoes') return type === 'Shoes';
      if (filter === 'Bikes') return type === 'Bikes';
      return true;
    })
    .reduce((acc, activity) => {
      acc[activity.equipment] = (acc[activity.equipment] || 0) + 1;
      return acc;
    }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);
}

function aggregateEquipmentAvgLength(activities, filter = 'All') {
  const totals = activities
    .filter(activity => {
      if (!activity.equipment || activity.equipment.trim() === '' || activity.distance <= 0) return false;
      const type = getEquipmentType(activity.equipment);
      if (filter === 'Shoes') return type === 'Shoes';
      if (filter === 'Bikes') return type === 'Bikes';
      return true;
    })
    .reduce((acc, activity) => {
      if (!acc[activity.equipment]) {
        acc[activity.equipment] = { distance: 0, count: 0 };
      }
      acc[activity.equipment].distance += activity.distance;
      acc[activity.equipment].count += 1;
      return acc;
    }, {});
  return Object.entries(totals)
    .map(([equipment, values]) => [equipment, values.count > 0 ? values.distance / values.count : 0])
    .sort((a, b) => b[1] - a[1]);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance,
    aggregateEquipmentPace,
    aggregateEquipmentActivityCount,
    aggregateEquipmentAvgLength
  };
}

if (typeof window !== 'undefined') {
  window.equipmentUtils = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance,
    aggregateEquipmentPace,
    aggregateEquipmentActivityCount,
    aggregateEquipmentAvgLength
  };
}
