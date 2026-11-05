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

function analyzeWorkoutTimeStarts(activities, filters = {}) {
  const windows = ['morning', 'afternoon', 'evening', 'night'].map(key => ({ key, count: 0 }));
  const reasons = { 'missing-local-time': 0, 'invalid-local-time': 0, 'inconsistent-local-time': 0 };
  let selectedCount = 0;
  let validStartCount = 0;
  const minDate = isValidDate(filters.minDate) ? startOfDay(filters.minDate) : null;
  const maxDate = isValidDate(filters.maxDate) ? endOfDay(filters.maxDate) : null;
  const sport = filters.sport || 'All';
  for (const activity of Array.isArray(activities) ? activities : []) {
    if (!activity || !isValidDate(activity.date) || (sport !== 'All' && activity.sport !== sport)
        || (minDate && activity.date < minDate) || (maxDate && activity.date > maxDate)) continue;
    selectedCount++;
    let hour = null;
    let reason = 'missing-local-time';
    if (activity.sourceLocalStart !== null && activity.sourceLocalStart !== undefined) {
      const local = activity.sourceLocalStart;
      if (isValidSourceLocalStart(local, activity.startTime)) hour = local.hour;
      else {
        const expected = new Date(Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
          - local.offsetMinutes * 60000);
        reason = isValidSourceLocalStart(local, expected) ? 'inconsistent-local-time' : 'invalid-local-time';
      }
    } else if (activity.calendarDate !== undefined || activity.localStartTime !== undefined) {
      const calendar = typeof activity.calendarDate === 'string' && activity.calendarDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const time = typeof activity.localStartTime === 'string' && activity.localStartTime.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
      reason = 'invalid-local-time';
      if (calendar && time) {
        const year = Number(calendar[1]);
        const month = Number(calendar[2]);
        const day = Number(calendar[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        const candidateHour = Number(time[1]);
        if (year >= 100 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
            && candidateHour < 24 && Number(time[2]) < 60 && Number(time[3] || 0) < 60) hour = candidateHour;
      }
    }
    if (hour === null) {
      reasons[reason]++;
      continue;
    }
    validStartCount++;
    const index = hour >= 5 && hour < 12 ? 0 : hour >= 12 && hour < 18 ? 1 : hour >= 18 && hour < 22 ? 2 : 3;
    windows[index].count++;
  }
  const dominant = validStartCount >= 10
    ? windows.find(window => window.count * 100 >= validStartCount * 60) : null;
  return {
    basis: 'activity-start-count', selectedCount, validStartCount, excludedStartCount: selectedCount - validStartCount,
    exclusions: Object.entries(reasons).filter(([_reason, count]) => count > 0).map(([reason, count]) => ({ reason, count })),
    windows, dominantWindow: dominant?.key || null,
    status: !validStartCount ? 'no-valid-starts' : validStartCount < 10 ? 'insufficient-data'
      : dominant ? 'supported' : 'no-dominance',
    scope: { sport, minDate: cloneDateOrNull(filters.minDate), maxDate: cloneDateOrNull(filters.maxDate) }
  };
}

const workoutTimeUtils = {
  GRANULARITIES,
  MEASURES: WORKOUT_TIME_MEASURES,
  getMeasureDefinition,
  formatWorkoutTimeValue,
  buildWorkoutTimeDataset,
  analyzeWorkoutTimeStarts,
  getGroupDefinitions,
  matchesFilters
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = workoutTimeUtils;
}

if (typeof window !== 'undefined') {
  window.workoutTimeUtils = workoutTimeUtils;
}
