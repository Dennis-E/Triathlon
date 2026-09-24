const GRANULARITIES = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
});

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

function getGroupIndex(startTime, granularity) {
  switch (granularity) {
    case GRANULARITIES.DAY:
      return Math.floor(startTime.getHours() / 2);
    case GRANULARITIES.WEEK: {
      const day = startTime.getDay();
      return day === 0 ? 6 : day - 1;
    }
    case GRANULARITIES.MONTH:
      return startTime.getDate() - 1;
    case GRANULARITIES.YEAR:
      return startTime.getMonth();
    default:
      throw new Error(`Unsupported Workout Time granularity: ${granularity}`);
  }
}

function cloneDateOrNull(value) {
  return isValidDate(value) ? new Date(value) : null;
}

function buildWorkoutTimeDataset(activities, filters = {}) {
  const granularity = filters.granularity || GRANULARITIES.DAY;
  const groups = getGroupDefinitions(granularity).map(group => ({ ...group, count: 0 }));
  const qualifyingActivities = (Array.isArray(activities) ? activities : [])
    .filter(activity => matchesFilters(activity, filters));

  qualifyingActivities.forEach(activity => {
    const groupIndex = getGroupIndex(activity.startTime, granularity);
    if (groups[groupIndex]) {
      groups[groupIndex].count += 1;
    }
  });

  return {
    granularity,
    groups,
    activityCount: qualifyingActivities.length,
    filters: {
      sport: filters.sport || 'All',
      minDate: cloneDateOrNull(filters.minDate),
      maxDate: cloneDateOrNull(filters.maxDate)
    }
  };
}

const workoutTimeUtils = {
  GRANULARITIES,
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
