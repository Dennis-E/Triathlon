const SUPPORTED_SPORTS = ['Run', 'Bike', 'Swim'];
const CALENDAR_SPORTS = [...SUPPORTED_SPORTS, 'Other'];

function isValidDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function toLocalDate(value) {
  if (value instanceof Date) return isValidDate(value) ? new Date(value.getTime()) : null;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : null;
}

function getDateKey(value) {
  const date = toLocalDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getSportCategory(sport) {
  return SUPPORTED_SPORTS.includes(sport) ? sport : 'Other';
}

function getAvailableYears(activities = []) {
  return [...new Set(activities
    .map(activity => toLocalDate(activity && activity.date))
    .filter(Boolean)
    .map(date => date.getFullYear()))].sort((first, second) => first - second);
}

function getAvailableSports(activities = [], options = {}) {
  const year = Number.isInteger(options.year) ? options.year : null;
  const categories = new Set();
  activities.forEach(activity => {
    const date = toLocalDate(activity && activity.date);
    if (!date || (year !== null && date.getFullYear() !== year)) return;
    categories.add(getSportCategory(activity.sport));
  });
  return CALENDAR_SPORTS.filter(sport => categories.has(sport));
}

function isValidMetric(value) {
  return Number.isFinite(value) && value >= 0;
}

function createEmptyDay(date) {
  return {
    dateKey: getDateKey(date),
    date: new Date(date.getTime()),
    activityCount: 0,
    durationSeconds: null,
    distanceKm: null,
    metricValue: 0,
    metricKind: 'count',
    sports: [],
    bySport: {},
    intensityLevel: 0
  };
}

function addMetric(day, activity, category) {
  day.activityCount += 1;
  if (!day.bySport[category]) {
    day.bySport[category] = {
      activityCount: 0,
      durationSeconds: null,
      distanceKm: null
    };
  }
  const sportTotals = day.bySport[category];
  sportTotals.activityCount += 1;

  if (isValidMetric(activity.duration)) {
    day.durationSeconds = (day.durationSeconds || 0) + activity.duration;
    sportTotals.durationSeconds = (sportTotals.durationSeconds || 0) + activity.duration;
  }
  if (isValidMetric(activity.distance)) {
    day.distanceKm = (day.distanceKm || 0) + activity.distance;
    sportTotals.distanceKm = (sportTotals.distanceKm || 0) + activity.distance;
  }
}

function finalizeDay(day) {
  day.sports = Object.keys(day.bySport).sort((first, second) => {
    return CALENDAR_SPORTS.indexOf(first) - CALENDAR_SPORTS.indexOf(second);
  });
  if (day.durationSeconds !== null) {
    day.metricValue = day.durationSeconds;
    day.metricKind = 'duration';
  } else if (day.distanceKm !== null) {
    day.metricValue = day.distanceKm;
    day.metricKind = 'distance';
  } else {
    day.metricValue = day.activityCount;
    day.metricKind = 'count';
  }
  return day;
}

function applyIntensityLevels(days) {
  const activeDays = days.filter(day => day.activityCount > 0);
  if (activeDays.length === 0) return days;
  const values = activeDays.map(day => day.metricValue);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  activeDays.forEach(day => {
    if (minimum === maximum) {
      day.intensityLevel = 5;
      return;
    }
    const normalized = (day.metricValue - minimum) / (maximum - minimum);
    day.intensityLevel = Math.min(5, Math.floor(normalized * 5) + 1);
  });
  return days;
}

function buildWeeks(days) {
  if (days.length === 0) return [];
  const firstDayOffset = (days[0].date.getDay() + 6) % 7;
  const cells = [...Array(firstDayOffset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push({ days: cells.slice(index, index + 7) });
  }
  return weeks;
}

function buildCalendarModel(activities = [], options = {}) {
  const availableYears = getAvailableYears(activities);
  const year = Number.isInteger(options.year)
    ? options.year
    : (availableYears[availableYears.length - 1] || new Date().getFullYear());
  const selectedSport = options.sport || 'All';
  const days = [];
  const current = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const dayByKey = new Map();
  while (current < end) {
    const day = createEmptyDay(current);
    days.push(day);
    dayByKey.set(day.dateKey, day);
    current.setDate(current.getDate() + 1);
  }

  let activityCount = 0;
  activities.forEach(activity => {
    const date = toLocalDate(activity && activity.date);
    if (!date || date.getFullYear() !== year) return;
    const category = getSportCategory(activity.sport);
    if (selectedSport !== 'All' && selectedSport !== category) return;
    const day = dayByKey.get(getDateKey(date));
    if (!day) return;
    addMetric(day, activity, category);
    activityCount += 1;
  });

  days.forEach(finalizeDay);
  applyIntensityLevels(days);
  const includedSports = getAvailableSports(activities, { year })
    .filter(sport => selectedSport === 'All' || sport === selectedSport);
  return {
    year,
    availableYears,
    availableSports: includedSports,
    activityCount,
    days,
    weeks: buildWeeks(days)
  };
}

const trainingCalendarUtils = {
  SUPPORTED_SPORTS,
  CALENDAR_SPORTS,
  getDateKey,
  getSportCategory,
  getAvailableYears,
  getAvailableSports,
  buildCalendarModel
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = trainingCalendarUtils;
}

if (typeof window !== 'undefined') {
  window.trainingCalendarUtils = trainingCalendarUtils;
}
