const SHOE_PATTERN = /(asics|nike|adidas|saucony|hoka|brooks|mizuno|altra|saguaro)/i;

function getEquipmentType(name) {
  if (!name) return null;
  return SHOE_PATTERN.test(name) ? 'Shoes' : 'Bikes';
}

function aggregateEquipmentDistance(activities, filter = 'All') {
  const totals = activities
    .filter(activity => {
      if (!activity.equipment || activity.equipment.trim() === '' || activity.distance <= 0) return false;

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

/**
 * Aggregates equipment activities into a timeline of first/last usage dates.
 *
 * Returns an array of objects sorted by lastDate descending (most recently used first):
 *   { name, type, firstDate, lastDate, totalKm, activityCount }
 *
 * @param {Array} activities - Processed activity objects
 * @param {string} filter - 'All', 'Shoes', or 'Bikes'
 * @returns {Array}
 */
function aggregateEquipmentTimeline(activities, filter = 'All') {
  const map = {};

  activities.forEach(activity => {
    if (!activity.equipment || activity.equipment.trim() === '') return;
    if (activity.distance <= 0) return;

    const type = getEquipmentType(activity.equipment);
    if (filter === 'Shoes' && type !== 'Shoes') return;
    if (filter === 'Bikes' && type !== 'Bikes') return;

    const name = activity.equipment;
    if (!map[name]) {
      map[name] = {
        name,
        type,
        firstDate: activity.date,
        lastDate: activity.date,
        totalKm: 0,
        activityCount: 0
      };
    }

    const entry = map[name];
    if (activity.date < entry.firstDate) entry.firstDate = activity.date;
    if (activity.date > entry.lastDate) entry.lastDate = activity.date;
    entry.totalKm += activity.distance;
    entry.activityCount += 1;
  });

  return Object.values(map)
    .sort((a, b) => b.lastDate - a.lastDate);
}

/**
 * Groups individual activities by equipment, maintaining the same ordering
 * (most recently used equipment first) as aggregateEquipmentTimeline.
 *
 * Returns an array of equipment rows, each with their sorted activity list:
 *   {
 *     name, type, firstDate, lastDate,
 *     activities: [{ date, distance, name, sport }, ...]   ← sorted asc
 *   }
 *
 * @param {Array} activities - Processed activity objects
 * @param {string} filter - 'All', 'Shoes', or 'Bikes'
 * @returns {Array}
 */
function getEquipmentTimelineActivities(activities, filter = 'All') {
  const map = {};

  activities.forEach(activity => {
    if (!activity.equipment || activity.equipment.trim() === '') return;
    if (activity.distance <= 0) return;

    const type = getEquipmentType(activity.equipment);
    if (filter === 'Shoes' && type !== 'Shoes') return;
    if (filter === 'Bikes' && type !== 'Bikes') return;

    const key = activity.equipment;
    if (!map[key]) {
      map[key] = {
        name: key,
        type,
        firstDate: activity.date,
        lastDate: activity.date,
        activities: []
      };
    }

    const entry = map[key];
    if (activity.date < entry.firstDate) entry.firstDate = activity.date;
    if (activity.date > entry.lastDate) entry.lastDate = activity.date;
    entry.activities.push({
      date: activity.date,
      distance: activity.distance,
      name: activity.name || '',
      sport: activity.sport || null
    });
  });

  // Sort activities within each row chronologically
  Object.values(map).forEach(row => {
    row.activities.sort((a, b) => a.date - b.date);
  });

  // Return rows sorted by lastDate descending (mirrors aggregateEquipmentTimeline)
  return Object.values(map).sort((a, b) => b.lastDate - a.lastDate);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance,
    aggregateEquipmentPace,
    aggregateEquipmentActivityCount,
    aggregateEquipmentAvgLength,
    aggregateEquipmentTimeline,
    getEquipmentTimelineActivities
  };
}

if (typeof window !== 'undefined') {
  window.equipmentUtils = {
    SHOE_PATTERN,
    getEquipmentType,
    aggregateEquipmentDistance,
    aggregateEquipmentPace,
    aggregateEquipmentActivityCount,
    aggregateEquipmentAvgLength,
    aggregateEquipmentTimeline,
    getEquipmentTimelineActivities
  };
}
