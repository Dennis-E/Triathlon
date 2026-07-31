function parseLocalizedNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(',', '.').trim();
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculatePaceMinPerKm(distanceKm, durationSeconds) {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(durationSeconds)) return null;
  if (distanceKm <= 0 || durationSeconds <= 0) return null;
  return (durationSeconds / 60) / distanceKm;
}

function calculatePaceMinPer100m(distanceKm, durationSeconds) {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(durationSeconds)) return null;
  if (distanceKm <= 0 || durationSeconds <= 0) return null;
  return (durationSeconds / 60) / (distanceKm * 10);
}

function calculateSpeedKmH(distanceKm, durationSeconds) {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(durationSeconds)) return null;
  if (distanceKm <= 0 || durationSeconds <= 0) return null;
  return distanceKm / (durationSeconds / 3600);
}

function getSportPerformanceMetric(activity) {
  if (!activity || !activity.sport) return null;

  if (activity.sport === 'Run') {
    const value = calculatePaceMinPerKm(activity.distance, activity.duration);
    if (!Number.isFinite(value) || value <= 0 || value > 30) return null;
    return { value, type: 'pace_run' };
  }

  if (activity.sport === 'Swim') {
    const value = calculatePaceMinPer100m(activity.distance, activity.duration);
    if (!Number.isFinite(value) || value <= 0 || value > 20) return null;
    return { value, type: 'pace_swim' };
  }

  if (activity.sport === 'Bike') {
    const value = calculateSpeedKmH(activity.distance, activity.duration);
    if (!Number.isFinite(value) || value <= 0 || value > 80) return null;
    return { value, type: 'speed_bike' };
  }

  return null;
}

function calculateBubbleRadius(durationSeconds, minDurationSeconds, maxDurationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0.4;
  if (!Number.isFinite(minDurationSeconds) || !Number.isFinite(maxDurationSeconds) || minDurationSeconds >= maxDurationSeconds) {
    return 0.8;
  }

  const minR = 0.4;
  const maxR = 16;
  const ratio = (durationSeconds - minDurationSeconds) / (maxDurationSeconds - minDurationSeconds);
  const clamped = Math.max(0, Math.min(1, ratio));
  return minR + (maxR - minR) * clamped;
}

function linearRegression(points) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  points.forEach(point => {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  });

  const denominator = (n * sumXX) - (sumX * sumX);
  if (denominator === 0) return null;

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;

  return { slope, intercept };
}

function getHeartratePacePoints(activities, filters = {}) {
  const sportFilter = filters.sport || 'All';
  const minDate = filters.minDate || null;
  const maxDate = filters.maxDate || null;

  return activities
    .filter(activity => {
      if (!activity || !activity.date) return false;
      if (!activity.sport) return false;
      if (sportFilter !== 'All' && activity.sport !== sportFilter) return false;
      if (minDate && activity.date < minDate) return false;
      if (maxDate && activity.date > maxDate) return false;
      if (!Number.isFinite(activity.avgHeartRate) || activity.avgHeartRate <= 0) return false;

      const metric = getSportPerformanceMetric(activity);
      if (!metric) return false;

      return true;
    })
    .map(activity => {
      const metric = getSportPerformanceMetric(activity);
      return {
        x: metric.value,
        y: activity.avgHeartRate,
        sport: activity.sport,
        metricType: metric.type,
        duration: activity.duration,
        name: activity.name,
        date: activity.date,
        distance: activity.distance,
        avgWatts: activity.avgWatts,
        year: activity.date.getFullYear()
      };
    });
}

function buildYearlyRegressionDatasets(points, palette) {
  const grouped = new Map();

  points.forEach(point => {
    if (!grouped.has(point.year)) grouped.set(point.year, []);
    grouped.get(point.year).push(point);
  });

  return Array.from(grouped.keys())
    .sort((a, b) => a - b)
    .map((year, index) => {
      const yearPoints = grouped.get(year);
      const regression = linearRegression(yearPoints);
      if (!regression) return null;

      const sortedByPace = [...yearPoints].sort((a, b) => a.x - b.x);
      const minX = sortedByPace[0].x;
      const maxX = sortedByPace[sortedByPace.length - 1].x;
      const color = palette[index % palette.length];

      return {
        type: 'line',
        label: `${year} Trend`,
        year,
        data: [
          { x: minX, y: (regression.slope * minX) + regression.intercept },
          { x: maxX, y: (regression.slope * maxX) + regression.intercept }
        ],
        borderColor: color,
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0,
        order: 1
      };
    })
    .filter(Boolean);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseLocalizedNumber,
    calculatePaceMinPerKm,
    calculatePaceMinPer100m,
    calculateSpeedKmH,
    getSportPerformanceMetric,
    calculateBubbleRadius,
    linearRegression,
    getHeartratePacePoints,
    buildYearlyRegressionDatasets
  };
}

if (typeof window !== 'undefined') {
  window.scatterUtils = {
    parseLocalizedNumber,
    calculatePaceMinPerKm,
    calculatePaceMinPer100m,
    calculateSpeedKmH,
    getSportPerformanceMetric,
    calculateBubbleRadius,
    linearRegression,
    getHeartratePacePoints,
    buildYearlyRegressionDatasets
  };
}
