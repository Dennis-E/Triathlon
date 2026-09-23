const resolveSportPerformanceMetric = (typeof module !== 'undefined' && module.exports)
  ? require('./scatter-utils').getSportPerformanceMetric
  : window.scatterUtils.getSportPerformanceMetric;

const DEFAULT_TARGET_BUCKET_COUNT = 12;

function getAllSportsPaceValue(activity) {
  if (!activity || !Number.isFinite(activity.distance) || !Number.isFinite(activity.duration)) return null;
  if (activity.distance <= 0 || activity.duration <= 0) return null;
  const speedKmH = activity.distance / (activity.duration / 3600);
  return Number.isFinite(speedKmH) && speedKmH > 0 ? speedKmH : null;
}

function getMetricValue(activity, metricKey, options = {}) {
  if (!activity) return null;

  if (metricKey === 'length') {
    return Number.isFinite(activity.distance) && activity.distance > 0 ? activity.distance : null;
  }

  if (metricKey === 'duration') {
    return Number.isFinite(activity.duration) && activity.duration > 0 ? activity.duration : null;
  }

  if (metricKey === 'elevation') {
    return Number.isFinite(activity.elevationGain) && activity.elevationGain >= 0 ? activity.elevationGain : null;
  }

  if (metricKey === 'power') {
    return Number.isFinite(activity.avgWatts) && activity.avgWatts > 0 ? activity.avgWatts : null;
  }

  if (metricKey === 'pace') {
    if (options.normalizePaceToSpeed) return getAllSportsPaceValue(activity);
    const metric = resolveSportPerformanceMetric(activity);
    return metric ? metric.value : null;
  }

  return null;
}

function filterActivitiesForDistribution(activities, filters = {}) {
  if (!Array.isArray(activities)) return [];

  const { metric, sport = 'All', minDate = null, maxDate = null } = filters;

  return activities.filter(activity => {
    if (!activity) return false;
    if (sport !== 'All' && activity.sport !== sport) return false;
    if (minDate && (!activity.date || activity.date < minDate)) return false;
    if (maxDate && (!activity.date || activity.date > maxDate)) return false;

    const value = getMetricValue(activity, metric, { normalizePaceToSpeed: metric === 'pace' && sport === 'All' });
    return Number.isFinite(value);
  });
}

function computeQuantile(sortedValues, p) {
  const idx = p * (sortedValues.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedValues[lower];
  const fraction = idx - lower;
  return sortedValues[lower] + (fraction * (sortedValues[upper] - sortedValues[lower]));
}

function computeIqrOutlierThreshold(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { q1: null, q3: null, iqr: null, upperFence: null, lowerFence: null };
  }

  const sorted = [...values].sort((a, b) => a - b);

  if (sorted.length < 4) {
    return {
      q1: null,
      q3: null,
      iqr: null,
      upperFence: sorted[sorted.length - 1],
      lowerFence: sorted[0]
    };
  }

  const q1 = computeQuantile(sorted, 0.25);
  const q3 = computeQuantile(sorted, 0.75);
  const iqr = q3 - q1;

  return { q1, q3, iqr, upperFence: q3 + (1.5 * iqr), lowerFence: q1 - (1.5 * iqr) };
}

const NICE_STEP_MULTIPLIERS = [1, 2, 5, 10];

function computeNiceStep(range, targetBucketCount) {
  if (!Number.isFinite(range) || range <= 0) return 1;

  const rawStep = range / Math.max(1, targetBucketCount);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceMultiplier = NICE_STEP_MULTIPLIERS.find(m => normalized <= m) || 10;

  return niceMultiplier * magnitude;
}

function computeNiceBoundary(value, step, direction) {
  return direction === 'ceil'
    ? Math.ceil(value / step) * step
    : Math.floor(value / step) * step;
}

const DURATION_NICE_STEPS_SECONDS = [300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400];

function computeDurationNiceStep(range, targetBucketCount) {
  if (!Number.isFinite(range) || range <= 0) return DURATION_NICE_STEPS_SECONDS[0];

  const target = Math.max(1, targetBucketCount);
  const fitting = DURATION_NICE_STEPS_SECONDS.find(step => range / step <= target);

  return fitting || DURATION_NICE_STEPS_SECONDS[DURATION_NICE_STEPS_SECONDS.length - 1];
}

function computeDistributionBuckets(values, options = {}) {
  const targetBucketCount = options.targetBucketCount || DEFAULT_TARGET_BUCKET_COUNT;
  const metricKey = options.metricKey || null;
  const sport = options.sport || null;
  const enableUnderflow = !!options.enableUnderflow;
  const buildLabel = (start, end) => (metricKey
    ? `${formatMetricValue(metricKey, start, sport, { includeUnit: metricKey !== 'pace' })}-${formatMetricValue(metricKey, end, sport, { includeUnit: metricKey !== 'pace' })}`
    : formatRangeLabel(start, end));
  const buildOverflowLabel = start => {
    if (metricKey === 'length' && start >= 50) return '50+';
    return metricKey
      ? `> ${formatMetricValue(metricKey, start, sport, { includeUnit: metricKey !== 'pace' })}`
      : `> ${Math.round(start * 100) / 100}`;
  };
  const buildUnderflowLabel = end => (metricKey
    ? `< ${formatMetricValue(metricKey, end, sport, { includeUnit: metricKey !== 'pace' })}`
    : `< ${Math.round(end * 100) / 100}`);

  if (!Array.isArray(values) || values.length === 0) {
    return { buckets: [], activityCount: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      buckets: [{ rangeStart: min, rangeEnd: max, label: buildLabel(min, max), count: values.length, isOverflow: false }],
      activityCount: values.length
    };
  }

  const { upperFence, lowerFence } = computeIqrOutlierThreshold(values);
  const regularMax = Number.isFinite(upperFence) ? Math.min(max, upperFence) : max;
  const hasOverflow = max > regularMax;
  const regularMin = enableUnderflow && Number.isFinite(lowerFence) ? Math.max(min, lowerFence) : min;
  const hasUnderflow = enableUnderflow && min < regularMin;

  const step = metricKey === 'duration'
    ? computeDurationNiceStep(regularMax - regularMin, targetBucketCount)
    : computeNiceStep(regularMax - regularMin, targetBucketCount);
  const niceMin = computeNiceBoundary(regularMin, step, 'floor');
  let niceMax = computeNiceBoundary(regularMax, step, 'ceil');
  if (niceMax <= niceMin) niceMax = niceMin + step;

  const bucketCount = Math.max(1, Math.round((niceMax - niceMin) / step));
  const buckets = [];

  if (hasUnderflow) {
    buckets.push({ rangeStart: -Infinity, rangeEnd: niceMin, label: buildUnderflowLabel(niceMin), count: 0, isUnderflow: true });
  }

  for (let i = 0; i < bucketCount; i++) {
    const rangeStart = niceMin + (i * step);
    const rangeEnd = i === bucketCount - 1 ? niceMax : niceMin + ((i + 1) * step);
    buckets.push({ rangeStart, rangeEnd, label: buildLabel(rangeStart, rangeEnd), count: 0, isOverflow: false });
  }

  if (hasOverflow) {
    buckets.push({ rangeStart: niceMax, rangeEnd: Infinity, label: buildOverflowLabel(niceMax), count: 0, isOverflow: true });
  }

  values.forEach(value => {
    const index = findBucketIndexForValue(buckets, value);
    if (index !== -1) buckets[index].count += 1;
  });

  return { buckets, activityCount: values.length };
}

function formatRangeLabel(rangeStart, rangeEnd) {
  const round = value => Math.round(value * 100) / 100;
  return `${round(rangeStart)}-${round(rangeEnd)}`;
}

function findBucketIndexForValue(buckets, value) {
  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    const isLastBucket = i === buckets.length - 1;
    if (value >= bucket.rangeStart && (value < bucket.rangeEnd || isLastBucket)) {
      return i;
    }
  }
  return -1;
}

const FIRE_GRADIENT_STOPS = [
  { at: 0, color: [253, 224, 71] },   // #FDE047 yellow (slow/short)
  { at: 0.5, color: [249, 115, 22] }, // #F97316 orange
  { at: 1, color: [220, 38, 38] }     // #DC2626 red (fast/long)
];

function interpolateChannel(a, b, t) {
  return Math.round(a + ((b - a) * t));
}

function toHexColor([r, g, b]) {
  const channel = value => value.toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function getFireGradientColor(position) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(position) ? position : 0));

  const segmentEnd = FIRE_GRADIENT_STOPS.find(stop => clamped <= stop.at) || FIRE_GRADIENT_STOPS[FIRE_GRADIENT_STOPS.length - 1];
  const segmentStartIndex = Math.max(0, FIRE_GRADIENT_STOPS.indexOf(segmentEnd) - 1);
  const segmentStart = FIRE_GRADIENT_STOPS[segmentStartIndex];

  const span = segmentEnd.at - segmentStart.at;
  const t = span === 0 ? 0 : (clamped - segmentStart.at) / span;

  const rgb = [0, 1, 2].map(i => interpolateChannel(segmentStart.color[i], segmentEnd.color[i], t));
  return toHexColor(rgb);
}

const MONOCHROME_BLUE_GRADIENT_STOPS = [
  { at: 0, color: [219, 234, 254] },
  { at: 0.5, color: [59, 130, 246] },
  { at: 1, color: [30, 64, 175] }
];

function getGradientColor(position, stops) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(position) ? position : 0));
  const segmentEnd = stops.find(stop => clamped <= stop.at) || stops[stops.length - 1];
  const segmentStartIndex = Math.max(0, stops.indexOf(segmentEnd) - 1);
  const segmentStart = stops[segmentStartIndex];
  const span = segmentEnd.at - segmentStart.at;
  const t = span === 0 ? 0 : (clamped - segmentStart.at) / span;
  const rgb = [0, 1, 2].map(i => interpolateChannel(segmentStart.color[i], segmentEnd.color[i], t));
  return toHexColor(rgb);
}

function getDistributionColor(position, scheme = 'fire') {
  return scheme === 'monochrome-blue'
    ? MONOCHROME_BLUE_COLOR
    : getGradientColor(position, FIRE_GRADIENT_STOPS);
}

const MONOCHROME_BLUE_COLOR = '#2563EB';

function getHistogramBoundaryTicks(buckets, metricKey, sport = null) {
  if (!Array.isArray(buckets) || buckets.length === 0) return [];

  const ticks = [];
  const seen = new Set();
  const formatTickValue = value => {
    const formatted = formatMetricValue(metricKey, value, sport, { includeUnit: false });
    return metricKey === 'length' || metricKey === 'elevation' || metricKey === 'power'
      ? formatted.replace(/\s+(km|m|W)$/, '')
      : formatted.replace(/\s+(km\/h|min\/km|min\/100m)$/, '');
  };
  const addTick = (value, label = null) => {
    const key = label || String(Math.round(value * 100) / 100);
    if (seen.has(key)) return;
    seen.add(key);
    ticks.push(label || formatTickValue(value));
  };

  buckets.forEach((bucket, index) => {
    if (bucket.isUnderflow) {
      addTick(bucket.rangeEnd, `< ${formatTickValue(bucket.rangeEnd)}`);
      return;
    }
    if (Number.isFinite(bucket.rangeStart)) addTick(bucket.rangeStart);
    if (bucket.isOverflow) {
      const overflowLabel = bucket.isOverflow && metricKey === 'length' && bucket.rangeStart >= 50
        ? '50+'
        : `> ${formatTickValue(bucket.rangeStart)}`;
      addTick(bucket.rangeStart);
      addTick(Number.isFinite(bucket.rangeEnd) ? bucket.rangeEnd : bucket.rangeStart, overflowLabel);
    } else if (index === buckets.length - 1 && Number.isFinite(bucket.rangeEnd)) {
      addTick(bucket.rangeEnd);
    }
  });

  return ticks;
}

function groupBucketCountsBySport(activities, metricKey, buckets) {
  if (!Array.isArray(activities) || !Array.isArray(buckets) || buckets.length === 0) {
    return {};
  }

  const sports = ['Run', 'Bike', 'Swim'];
  const result = {};

  sports.forEach(sport => {
    const sportBuckets = buckets.map(bucket => ({
      rangeStart: bucket.rangeStart,
      rangeEnd: bucket.rangeEnd,
      label: bucket.label,
      isOverflow: !!bucket.isOverflow,
      isUnderflow: !!bucket.isUnderflow,
      count: 0
    }));
    let activityCount = 0;

    activities.forEach(activity => {
      if (!activity || activity.sport !== sport) return;
      const value = getMetricValue(activity, metricKey, { normalizePaceToSpeed: metricKey === 'pace' });
      if (!Number.isFinite(value)) return;

      const index = findBucketIndexForValue(sportBuckets, value);
      if (index === -1) return;

      sportBuckets[index].count += 1;
      activityCount += 1;
    });

    if (activityCount > 0) {
      result[sport] = { buckets: sportBuckets, activityCount };
    }
  });

  return result;
}

function formatMetricValue(metricKey, value, sport, options = {}) {
  const includeUnit = options.includeUnit !== false;
  if (!Number.isFinite(value)) return '';

  if (metricKey === 'duration') {
    if (value < 3600) {
      return `${Math.round(value / 60)}m`;
    }
    const hours = Math.floor(value / 3600);
    const minutes = Math.round((value % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  if (metricKey === 'pace') {
    if (sport === 'Bike') {
      const roundedValue = String(Math.round(value));
      return includeUnit ? `${roundedValue} km/h` : roundedValue;
    }
    if (!sport) {
      // Combined "All Sports" bucket labels mix Run/Swim/Bike units without
      // conversion (per 018-activity-distributions FR-005a); no single unit
      // applies, so fall back to a plain rounded decimal number.
      return `${Math.round(value * 100) / 100}`;
    }
    const unit = sport === 'Swim' ? 'min/100m' : 'min/km';
    const totalSeconds = Math.round(value * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    return includeUnit ? `${timeText} ${unit}` : timeText;
  }

  if (metricKey === 'elevation') {
    return `${Math.round(value)} m`;
  }

  if (metricKey === 'length') {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} km`;
  }

  if (metricKey === 'power') {
    return `${Math.round(value)} W`;
  }

  return String(value);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMetricValue,
    getAllSportsPaceValue,
    filterActivitiesForDistribution,
    computeDistributionBuckets,
    formatMetricValue,
    groupBucketCountsBySport,
    computeIqrOutlierThreshold,
    computeNiceStep,
    computeNiceBoundary,
    getFireGradientColor,
    getDistributionColor,
    getHistogramBoundaryTicks,
    computeDurationNiceStep
  };
}

if (typeof window !== 'undefined') {
  window.distributionUtils = {
    getMetricValue,
    getAllSportsPaceValue,
    filterActivitiesForDistribution,
    computeDistributionBuckets,
    formatMetricValue,
    groupBucketCountsBySport,
    computeIqrOutlierThreshold,
    computeNiceStep,
    computeNiceBoundary,
    getFireGradientColor,
    getDistributionColor,
    getHistogramBoundaryTicks,
    computeDurationNiceStep
  };
}
