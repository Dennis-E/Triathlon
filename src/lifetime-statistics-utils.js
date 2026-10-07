const LIFETIME_SUPPORTED_SPORTS = ['Run', 'Bike', 'Swim'];

function isUsableLifetimeMetric(value) {
  return Number.isFinite(value) && value >= 0;
}

function isActivityMetricAvailable(activity, metricField, availabilityField) {
  if (!activity) return false;
  if (availabilityField && typeof activity[availabilityField] === 'boolean' && !activity[availabilityField]) {
    return false;
  }
  return isUsableLifetimeMetric(activity[metricField]);
}

function createMetricResult(activities, metricField, availabilityField) {
  let total = 0;
  let availableCount = 0;

  activities.forEach(activity => {
    if (!isActivityMetricAvailable(activity, metricField, availabilityField)) return;

    total += activity[metricField];
    availableCount += 1;
  });

  const activityCount = activities.length;
  const status = availableCount === 0
    ? 'unavailable'
    : availableCount === activityCount
      ? 'complete'
      : 'partial';

  return {
    value: availableCount > 0 ? total : null,
    availableCount,
    activityCount,
    status
  };
}

function toValidLocalDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}

function getLocalDateKey(value) {
  const date = toValidLocalDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLongestActivity(activities, metricField, availabilityField) {
  let longest = null;

  activities.forEach(activity => {
    if (!isActivityMetricAvailable(activity, metricField, availabilityField)) return;
    const date = toValidLocalDate(activity.date);
    if (!date) return;

    const value = activity[metricField];
    if (longest && value <= longest.value) return;

    longest = {
      name: String(activity.name || activity.title || 'Activity'),
      date: new Date(date.getTime()),
      value,
      sport: LIFETIME_SUPPORTED_SPORTS.includes(activity.sport) ? activity.sport : null
    };
  });

  return longest;
}

function getEquipmentCount(activities, sport) {
  const placeholderLabels = new Set(['-', 'none', 'unknown', 'n/a']);
  const seenLabels = new Set();

  activities.forEach(activity => {
    if (!activity || activity.sport !== sport) return;
    const label = String(activity.equipment || '').trim();
    if (!label || placeholderLabels.has(label.toLowerCase()) || seenLabels.has(label)) return;
    seenLabels.add(label);
  });

  return seenLabels.size;
}

function aggregateLifetimeStatistics(activities) {
  const records = Array.isArray(activities) ? activities : [];
  const sportSummaries = LIFETIME_SUPPORTED_SPORTS
    .filter(sport => records.some(activity => activity && activity.sport === sport))
    .map(sport => {
      const sportActivities = records.filter(activity => activity && activity.sport === sport);
      return {
        sport,
        workoutCount: sportActivities.length,
        distance: createMetricResult(sportActivities, 'distance', 'distanceAvailable'),
        movingTime: createMetricResult(sportActivities, 'duration', 'durationAvailable')
      };
    });
  const activeDays = new Set(
    records.map(activity => activity && getLocalDateKey(activity.date)).filter(Boolean)
  );

  return {
    workoutCount: records.length,
    distance: createMetricResult(records, 'distance', 'distanceAvailable'),
    movingTime: createMetricResult(records, 'duration', 'durationAvailable'),
    elevationGain: createMetricResult(records, 'elevationGain', null),
    activeDayCount: activeDays.size,
    sportSummaries,
    longestByDistance: getLongestActivity(records, 'distance', 'distanceAvailable'),
    longestByMovingTime: getLongestActivity(records, 'duration', 'durationAvailable'),
    equipmentCounts: {
      shoes: getEquipmentCount(records, 'Run'),
      bikes: getEquipmentCount(records, 'Bike')
    }
  };
}

const lifetimeStatisticsUtils = {
  aggregateLifetimeStatistics,
  isUsableLifetimeMetric
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = lifetimeStatisticsUtils;
}

if (typeof window !== 'undefined') {
  window.lifetimeStatisticsUtils = lifetimeStatisticsUtils;
}
