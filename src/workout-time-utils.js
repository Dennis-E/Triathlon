const GRANULARITIES = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
});

const WORKOUT_TIME_MEASURES = Object.freeze({ COUNT: 'count', DURATION: 'duration', DISTANCE: 'distance' });
const WORKOUT_TIME_MEASURE_DEFINITIONS = Object.freeze({
  count: Object.freeze({ label: 'Workout number', axisTitle: 'Workouts', divisor: 1 }),
  duration: Object.freeze({ label: 'Duration', axisTitle: 'Duration (h)', divisor: 3600 }),
  distance: Object.freeze({ label: 'Distance', axisTitle: 'Distance (km)', divisor: 1 })
});

function getMeasureDefinition(measure = 'count') {
  if (!Object.prototype.hasOwnProperty.call(WORKOUT_TIME_MEASURE_DEFINITIONS, measure)) throw new Error(`Unsupported Workout Time measure: ${measure}`);
  return WORKOUT_TIME_MEASURE_DEFINITIONS[measure];
}

function formatWorkoutTimeValue(value, measure = 'count') {
  getMeasureDefinition(measure);
  if (!Number.isFinite(value) || value < 0) return 'Not available';
  if (measure === 'duration') {
    const seconds = Math.round(value);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainder = seconds % 60;
    return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', remainder || !seconds ? `${remainder}s` : ''].filter(Boolean).join(' ');
  }
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: measure === 'count' ? 0 : 2 }).format(value);
  return measure === 'distance' ? `${formatted} km` : `${formatted} ${value === 1 ? 'workout' : 'workouts'}`;
}

function workoutTimeCoverage(group, measure) {
  const availableCount = measure === 'count' ? group.count : group[`${measure}AvailableCount`];
  const total = measure === 'count' ? group.count : measure === 'duration' ? group.durationSeconds : group.distanceKm;
  return {
    availableCount,
    value: group.count && !availableCount ? null : total,
    status: !group.count ? 'empty' : !availableCount ? 'unavailable' : availableCount < group.count ? 'partial' : 'complete'
  };
}

const DAY_GROUPS = Array.from({ length: 12 }, (_, index) => {
  const startHour = index * 2;
  return {
    key: `day-${String(startHour).padStart(2, '0')}`,
    label: `${String(startHour).padStart(2, '0')}:00-${String(startHour + 1).padStart(2, '0')}:59`,
    order: index
  };
});

const WEEK_GROUPS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'],
  ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']
].map(([key, label], order) => ({ key: `week-${key}`, label, order }));

const MONTH_GROUPS = Array.from({ length: 31 }, (_, index) => ({
  key: `month-${String(index + 1).padStart(2, '0')}`,
  label: String(index + 1),
  order: index
}));

const YEAR_GROUPS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
].map((label, order) => ({
  key: `year-${label.toLowerCase()}`,
  label,
  order
}));

function isValidDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function matchesFilters(activity, filters = {}) {
  if (!activity || !isValidDate(activity.date) || !isValidDate(activity.startTime)) {
    return false;
  }

  const selectedSport = filters.sport || 'All';
  if (selectedSport !== 'All' && activity.sport !== selectedSport) {
    return false;
  }

  if (isValidDate(filters.minDate) && activity.date < startOfDay(filters.minDate)) {
    return false;
  }

  if (isValidDate(filters.maxDate) && activity.date > endOfDay(filters.maxDate)) {
    return false;
  }

  return true;
}

function getGroupDefinitions(granularity) {
  switch (granularity) {
    case GRANULARITIES.DAY:
      return DAY_GROUPS;
    case GRANULARITIES.WEEK:
      return WEEK_GROUPS;
    case GRANULARITIES.MONTH:
      return MONTH_GROUPS;
    case GRANULARITIES.YEAR:
      return YEAR_GROUPS;
    default:
      throw new Error(`Unsupported Workout Time granularity: ${granularity}`);
  }
}

function isValidSourceLocalStart(value, startTime) {
  if (!value || !Number.isInteger(value.year) || value.year < 100 ||
      !Number.isInteger(value.month) || value.month < 1 || value.month > 12 ||
      !Number.isInteger(value.day) || value.day < 1 ||
      !Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23 ||
      !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59 ||
      !Number.isInteger(value.second) || value.second < 0 || value.second > 59 ||
      !Number.isInteger(value.offsetMinutes) || Math.abs(value.offsetMinutes) > 1439) return false;
  const wallTime = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second);
  const date = new Date(wallTime);
  if (date.getUTCFullYear() !== value.year || date.getUTCMonth() !== value.month - 1 || date.getUTCDate() !== value.day) return false;
  if (!(startTime instanceof Date) || !Number.isFinite(startTime.getTime())) return false;
  const expectedInstant = wallTime - value.offsetMinutes * 60000;
  return startTime.getTime() >= expectedInstant && startTime.getTime() < expectedInstant + 1000;
}

function getGroupIndex(startTime, granularity, sourceLocalStart) {
  const local = isValidSourceLocalStart(sourceLocalStart, startTime) ? sourceLocalStart : null;
  switch (granularity) {
    case GRANULARITIES.DAY:
      return Math.floor((local ? local.hour : startTime.getHours()) / 2);
    case GRANULARITIES.WEEK: {
      const day = local
        ? new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay()
        : startTime.getDay();
      return day === 0 ? 6 : day - 1;
    }
    case GRANULARITIES.MONTH:
      return (local ? local.day : startTime.getDate()) - 1;
    case GRANULARITIES.YEAR:
      return (local ? local.month : startTime.getMonth() + 1) - 1;
    default:
      throw new Error(`Unsupported Workout Time granularity: ${granularity}`);
  }
}

function cloneDateOrNull(value) {
  return isValidDate(value) ? new Date(value) : null;
}

function buildWorkoutTimeDataset(activities, filters = {}) {
  const granularity = filters.granularity || GRANULARITIES.DAY;
  const measure = filters.measure === undefined ? 'count' : filters.measure;
  getMeasureDefinition(measure);
  const initialTotals = () => ({ count: 0, durationSeconds: 0, distanceKm: 0, durationAvailableCount: 0, distanceAvailableCount: 0 });
  const groups = getGroupDefinitions(granularity).map(group => ({ ...group, ...initialTotals() }));
  for (const activity of Array.isArray(activities) ? activities : []) {
    if (!matchesFilters(activity, filters)) continue;
    const groupIndex = getGroupIndex(activity.startTime, granularity, activity.sourceLocalStart);
    const group = groups[groupIndex];
    if (!group) continue;
    group.count += 1;
    if (activity.durationAvailable !== false && Number.isFinite(activity.duration) && activity.duration >= 0) {
      group.durationSeconds += activity.duration;
      group.durationAvailableCount += 1;
    }
    if (activity.distanceAvailable !== false && Number.isFinite(activity.distance) && activity.distance >= 0) {
      group.distanceKm += activity.distance;
      group.distanceAvailableCount += 1;
    }
  }
  const totals = initialTotals();
  groups.forEach(group => {
    for (const key of Object.keys(totals)) totals[key] += group[key];
    Object.assign(group, workoutTimeCoverage(group, measure));
  });

  return {
    granularity,
    measure,
    groups,
    activityCount: totals.count,
    ...workoutTimeCoverage(totals, measure),
    filters: {
      sport: filters.sport || 'All',
      minDate: cloneDateOrNull(filters.minDate),
      maxDate: cloneDateOrNull(filters.maxDate)
    }
  };
}

const workoutTimeUtils = {
  GRANULARITIES,
  MEASURES: WORKOUT_TIME_MEASURES,
  getMeasureDefinition,
  formatWorkoutTimeValue,
  buildWorkoutTimeDataset,
  getGroupDefinitions,
  matchesFilters
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = workoutTimeUtils;
}

if (typeof window !== 'undefined') {
  window.workoutTimeUtils = workoutTimeUtils;
}
