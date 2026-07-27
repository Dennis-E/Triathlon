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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance
  };
}

if (typeof window !== 'undefined') {
  window.equipmentUtils = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance
  };
}
