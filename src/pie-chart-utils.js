const pieDistributionUtils = (typeof module !== 'undefined' && module.exports)
  ? require('./distribution-utils')
  : window.distributionUtils;

const PIE_DIMENSIONS = ['sport', 'duration', 'pace', 'equipment', 'length', 'power'];
const PIE_MEASURES = ['count', 'time', 'distance'];
const PIE_MAX_SLICES = 8;
const PIE_SPORTS = ['Run', 'Bike', 'Swim'];
const PIE_OTHER_COLOR = '#64748B';
const PIE_DEFAULT_TARGET_BUCKET_COUNT = 6;

const PIE_BLUE_GRADIENT_STOPS = [
  { at: 0, color: [191, 219, 254] },
  { at: 0.5, color: [59, 130, 246] },
  { at: 1, color: [30, 58, 138] }
];

const PIE_PACE_UNITS = { All: 'km/h', Bike: 'km/h', Run: 'min/km', Swim: 'min/100m' };

function samplePieGradient(position, stops) {
  const clamped = Math.max(0, Math.min(1, position));
  const end = stops.find(stop => clamped <= stop.at) || stops[stops.length - 1];
  const start = stops[Math.max(0, stops.indexOf(end) - 1)];
  const span = end.at - start.at;
  const t = span === 0 ? 0 : (clamped - start.at) / span;
  const hex = [0, 1, 2]
    .map(i => Math.round(start.color[i] + ((end.color[i] - start.color[i]) * t)).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`.toUpperCase();
}

function getPieSliceColors(count, scheme = 'fire') {
  if (!Number.isInteger(count) || count <= 0) return [];
  const sample = scheme === 'monochrome-blue'
    ? position => samplePieGradient(position, PIE_BLUE_GRADIENT_STOPS)
    : position => pieDistributionUtils.getFireGradientColor(position);
  if (count === 1) return [sample(0.5)];
  return Array.from({ length: count }, (_, index) => sample(index / (count - 1)));
}

function getPieMeasureContribution(activity, measure) {
  if (measure === 'count') return 1;
  const raw = measure === 'time' ? activity.duration : activity.distance;
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function getPieDimensionValue(activity, dimension, sport) {
  if (dimension === 'sport') return activity.sport;
  if (dimension === 'equipment') return typeof activity.equipment === 'string' ? activity.equipment.trim() : '';
  const value = pieDistributionUtils.getMetricValue(activity, dimension, {
    normalizePaceToSpeed: dimension === 'pace' && sport === 'All'
  });
  return Number.isFinite(value) ? value : null;
}

function createPieGroup(key, label) {
  return { key, label, value: 0, activityCount: 0, isOther: false };
}

function addToPieGroup(group, activity, measure) {
  group.value += getPieMeasureContribution(activity, measure);
  group.activityCount += 1;
}

function groupPieBySport(entries, measure) {
  const groups = PIE_SPORTS.map(sportName => createPieGroup(sportName, sportName));
  entries.forEach(({ activity, value }) => {
    const group = groups.find(candidate => candidate.key === value);
    if (group) addToPieGroup(group, activity, measure);
  });
  return groups.filter(group => group.value > 0);
}

function groupPieByEquipment(entries, measure, maxSlices) {
  const byName = new Map();
  entries.forEach(({ activity, value }) => {
    if (!byName.has(value)) byName.set(value, createPieGroup(value || '__none__', value || 'No equipment'));
    addToPieGroup(byName.get(value), activity, measure);
  });

  const groups = Array.from(byName.values())
    .filter(group => group.value > 0)
    .sort((a, b) => (b.value - a.value) || a.label.localeCompare(b.label));

  if (groups.length <= maxSlices) return groups;

  const kept = groups.slice(0, maxSlices - 1);
  const other = createPieGroup('__other__', 'Other');
  other.isOther = true;
  groups.slice(maxSlices - 1).forEach(group => {
    other.value += group.value;
    other.activityCount += group.activityCount;
  });
  return kept.concat(other);
}

function groupPieByRange(entries, dimension, measure, sport, maxSlices) {
  if (entries.length === 0) return [];

  const values = entries.map(entry => entry.value);
  const labelSport = dimension === 'pace' && sport === 'All' ? 'Bike' : (sport === 'All' ? null : sport);
  const paceUnit = dimension === 'pace' ? PIE_PACE_UNITS[sport] : null;
  const withUnit = label => (paceUnit && !label.endsWith(paceUnit) ? `${label} ${paceUnit}` : label);
  let groups = [];

  for (let target = PIE_DEFAULT_TARGET_BUCKET_COUNT; target >= 1; target -= 1) {
    const { buckets } = pieDistributionUtils.computeDistributionBuckets(values, {
      metricKey: dimension,
      sport: labelSport,
      targetBucketCount: target
    });
    groups = buckets.map((bucket, index) => ({
      ...createPieGroup(`range-${index}`, withUnit(bucket.label)),
      rangeStart: bucket.rangeStart,
      rangeEnd: bucket.rangeEnd,
      isOverflow: !!bucket.isOverflow
    }));
    entries.forEach(({ activity, value }) => {
      const index = pieDistributionUtils.findBucketIndexForValue(buckets, value);
      if (index !== -1) addToPieGroup(groups[index], activity, measure);
    });
    groups = groups.filter(group => group.value > 0);
    if (groups.length <= maxSlices) break;
  }

  // Coarsest fixed steps (e.g. 1 day for duration) can still exceed the limit; merge adjacent ranges.
  if (groups.length > maxSlices) {
    const format = value => pieDistributionUtils.formatMetricValue(dimension, value, labelSport, { includeUnit: dimension !== 'pace' });
    const chunkSize = Math.ceil(groups.length / maxSlices);
    const merged = [];
    for (let start = 0; start < groups.length; start += chunkSize) {
      const chunk = groups.slice(start, start + chunkSize);
      const first = chunk[0];
      const last = chunk[chunk.length - 1];
      const label = last.isOverflow
        ? `> ${format(first.rangeStart)}`
        : `${format(first.rangeStart)}-${format(last.rangeEnd)}`;
      const group = createPieGroup(`range-${merged.length}`, withUnit(label));
      chunk.forEach(item => {
        group.value += item.value;
        group.activityCount += item.activityCount;
      });
      merged.push(group);
    }
    return merged;
  }

  return groups.map(({ key, label, value, activityCount, isOther }) => ({ key, label, value, activityCount, isOther }));
}

function computePieSlices(activities, options = {}) {
  const {
    dimension,
    measure,
    sport = 'All',
    colorScheme = 'fire',
    maxSlices = PIE_MAX_SLICES
  } = options;
  const emptyResult = { slices: [], total: 0, activityCount: 0, excludedCount: 0 };

  if (!Array.isArray(activities) || !PIE_DIMENSIONS.includes(dimension) || !PIE_MEASURES.includes(measure)) {
    return emptyResult;
  }

  const entries = [];
  let excludedCount = 0;
  activities.forEach(activity => {
    if (!activity || !PIE_SPORTS.includes(activity.sport)) return;
    if (sport !== 'All' && activity.sport !== sport) return;
    const value = getPieDimensionValue(activity, dimension, sport);
    if (value === null) {
      excludedCount += 1;
      return;
    }
    entries.push({ activity, value });
  });

  const groups = dimension === 'sport'
    ? groupPieBySport(entries, measure)
    : dimension === 'equipment'
      ? groupPieByEquipment(entries, measure, maxSlices)
      : groupPieByRange(entries, dimension, measure, sport, maxSlices);

  const total = groups.reduce((sum, group) => sum + group.value, 0);
  if (groups.length === 0 || total <= 0) return { ...emptyResult, excludedCount };

  const colors = getPieSliceColors(groups.filter(group => !group.isOther).length, colorScheme);
  let colorIndex = 0;
  const slices = groups.map(group => ({
    ...group,
    percentage: (group.value / total) * 100,
    color: group.isOther ? PIE_OTHER_COLOR : colors[colorIndex++]
  }));

  return {
    slices,
    total,
    activityCount: slices.reduce((sum, slice) => sum + slice.activityCount, 0),
    excludedCount
  };
}

function formatPieMeasureValue(measure, value) {
  if (!Number.isFinite(value)) return '';
  if (measure === 'count') {
    const count = Math.round(value);
    return `${count.toLocaleString('en-US')} ${count === 1 ? 'activity' : 'activities'}`;
  }
  if (measure === 'time') return pieDistributionUtils.formatMetricValue('duration', value);
  if (measure === 'distance') {
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }
  return String(value);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PIE_DIMENSIONS,
    PIE_MEASURES,
    PIE_MAX_SLICES,
    PIE_OTHER_COLOR,
    computePieSlices,
    getPieSliceColors,
    formatPieMeasureValue
  };
}

if (typeof window !== 'undefined') {
  window.pieChartUtils = {
    PIE_DIMENSIONS,
    PIE_MEASURES,
    PIE_MAX_SLICES,
    PIE_OTHER_COLOR,
    computePieSlices,
    getPieSliceColors,
    formatPieMeasureValue
  };
}
