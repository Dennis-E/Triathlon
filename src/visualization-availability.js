(function attachVisualizationAvailability(root) {
const availabilityUtils = typeof module !== 'undefined' && module.exports
  ? {
    scatter: require('./scatter-utils'),
    equipment: require('./equipment-utils'),
    heatmap: require('./heatmap-utils'),
    distribution: require('./distribution-utils'),
    workoutTime: require('./workout-time-utils'),
    trainingCalendar: require('./training-calendar-utils'),
    wordcloud: require('./wordcloud-utils'),
    pieCharts: require('./pie-chart-utils'),
    lifetimeStatistics: require('./lifetime-statistics-utils')
  }
  : {
    scatter: root.scatterUtils,
    equipment: root.equipmentUtils,
    heatmap: root.heatmapUtils,
    distribution: root.distributionUtils,
    workoutTime: root.workoutTimeUtils,
    trainingCalendar: root.trainingCalendarUtils,
    wordcloud: root.wordcloudUtils,
    pieCharts: root.pieChartUtils,
    lifetimeStatistics: root.lifetimeStatisticsUtils
  };

const SUPPORTED_SPORTS = ['Run', 'Bike', 'Swim'];
const DISTRIBUTION_METRICS = ['pace', 'length', 'duration', 'elevation', 'power'];
const PERSONAL_BEST_MINIMUM_DISTANCE = { Run: 4.75, Bike: 18, Swim: 0.352 };

function hasValidDate(value) {
  return value !== null && value !== undefined && Number.isFinite(new Date(value).getTime());
}

function hasTotalDistanceData(activities) {
  if (root && typeof root.hasRenderableDistanceData === 'function') {
    return root.hasRenderableDistanceData(activities);
  }
  return activities.some(activity => activity && SUPPORTED_SPORTS.includes(activity.sport) &&
    hasValidDate(activity.date) && Number.isFinite(activity.distance) && activity.distance > 0);
}

function hasPaceMetricsData(activities, scatter) {
  const metrics = Object.values(scatter.PACE_METRIC_DEFINITIONS);
  return activities.some(activity => {
    if (!activity || !hasValidDate(activity.date) || !SUPPORTED_SPORTS.includes(activity.sport) ||
        scatter.getSportPerformanceMetric(activity) === null) return false;
    return metrics.some(metric => {
      const value = metric.getValue(activity);
      return Number.isFinite(value) && value > 0;
    });
  });
}

function hasPersonalBestsData(activities, auxiliaryData, scatter) {
  const hasDistanceBest = activities.some(activity => {
    const minimumDistance = activity && PERSONAL_BEST_MINIMUM_DISTANCE[activity.sport];
    return Number.isFinite(minimumDistance) && hasValidDate(activity.date) &&
      Number.isFinite(activity.distance) && activity.distance >= minimumDistance &&
      Number.isFinite(activity.duration) && activity.duration > 0 &&
      scatter.getSportPerformanceMetric(activity) !== null;
  });
  if (hasDistanceBest) return true;

  const fitBestEfforts = auxiliaryData.fitBestEffortsByActivityId || {};
  return activities.some(activity => {
    if (!activity || activity.sport !== 'Bike' || !hasValidDate(activity.date) || activity.id == null) return false;
    const efforts = fitBestEfforts[String(activity.id)];
    return Array.isArray(efforts && efforts.powerEfforts) && efforts.powerEfforts.some(effort =>
      Number.isFinite(effort.avgPower) && effort.avgPower > 0 && Number.isFinite(effort.targetSeconds) && effort.targetSeconds > 0);
  });
}

function hasDistributionData(activities, distribution) {
  return activities.some(activity => DISTRIBUTION_METRICS.some(metric =>
    Number.isFinite(distribution.getMetricValue(activity, metric, {
      normalizePaceToSpeed: metric === 'pace'
    }))));
}

function hasPieChartData(activities, pieCharts) {
  return pieCharts.computePieSlices(activities, { dimension: 'sport', measure: 'count' }).slices.length > 0;
}

function getVisualizationAvailability(activities, auxiliaryData = {}) {
  const records = Array.isArray(activities) ? activities : [];
  const gpsTracksByActivityId = auxiliaryData.gpsTracksByActivityId || {};
  const { scatter, equipment, heatmap, distribution, workoutTime, trainingCalendar, wordcloud, pieCharts, lifetimeStatistics } = availabilityUtils;
  const calendar = trainingCalendar.buildMultiYearCalendarModel(records);
  const lifetimeSummary = lifetimeStatistics.aggregateLifetimeStatistics(records);

  return {
    totalDistance: hasTotalDistanceData(records),
    paceMetrics: hasPaceMetricsData(records, scatter),
    equipment: equipment.aggregateEquipmentDistance(records).length > 0,
    equipmentTimeline: records.some(activity => activity && hasValidDate(activity.date) &&
      Number.isFinite(activity.distance) && activity.distance > 0) &&
      equipment.aggregateEquipmentTimeline(records.filter(activity => hasValidDate(activity && activity.date))).length > 0,
    personalBests: hasPersonalBestsData(records, auxiliaryData, scatter),
    heatmap: Object.keys(heatmap.buildRouteSegments(gpsTracksByActivityId)).length > 0,
    distributions: hasDistributionData(records, distribution),
    workoutTime: workoutTime.buildWorkoutTimeDataset(records).activityCount > 0,
    trainingCalendar: calendar.years.some(year => year.activityCount > 0),
    wordcloud: wordcloud.getWordFrequencies(records).length > 0,
    pieCharts: hasPieChartData(records, pieCharts),
    lifetimeStatistics: lifetimeSummary.workoutCount > 0
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getVisualizationAvailability };
}

if (root) root.visualizationAvailability = { getVisualizationAvailability };
})(typeof window !== 'undefined' ? window : null);
