/**
 * Heatmap Utilities - GPS track aggregation helpers for the heatmap dashboard tab
 * Contains pure functions for testing; no DOM or map-library dependencies
 */

/**
 * Check whether any GPS tracks are available at all
 * @param {Object} gpsTracksByActivityId - { [activityId]: { sport, points } }
 * @returns {boolean}
 */
function hasGpsData(gpsTracksByActivityId) {
  if (!gpsTracksByActivityId || typeof gpsTracksByActivityId !== 'object') return false;
  return Object.values(gpsTracksByActivityId).some(track => Array.isArray(track && track.points) && track.points.length > 0);
}

/* ------------------------------------------------------------------------
 * Route Segment Utilities
 * Pure, DOM-free helpers that turn raw GPS tracks into aggregated route
 * segments (with visit-frequency counts) for the route-line heatmap
 * rendering, plus a frequency -> visual style scale. See
 * specs/001-route-line-heatmap/data-model.md for the data shapes.
 * ------------------------------------------------------------------------ */

const EARTH_RADIUS_METERS = 6371000;

function isCoordinate(point) {
  return Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function distanceMeters(pointA, pointB) {
  if (!isCoordinate(pointA) || !isCoordinate(pointB)) return Infinity;
  const lat1 = pointA[0] * Math.PI / 180;
  const lat2 = pointB[0] * Math.PI / 180;
  const deltaLat = lat2 - lat1;
  const deltaLon = (pointB[1] - pointA[1]) * Math.PI / 180;
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function computeUndirectedHeading(pointA, pointB) {
  if (!isCoordinate(pointA) || !isCoordinate(pointB) || distanceMeters(pointA, pointB) < 1e-6) return null;
  const lat1 = pointA[0] * Math.PI / 180;
  const lat2 = pointB[0] * Math.PI / 180;
  const deltaLon = (pointB[1] - pointA[1]) * Math.PI / 180;
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const directed = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return directed % 180;
}

function headingDifferenceDegrees(headingA, headingB) {
  if (!Number.isFinite(headingA) || !Number.isFinite(headingB)) return Infinity;
  const difference = Math.abs(((headingA - headingB) % 180 + 180) % 180);
  return Math.min(difference, 180 - difference);
}

function interpolateTrackProbes(points, spacingMeters = 30) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const spacing = Number.isFinite(spacingMeters) && spacingMeters > 0 ? spacingMeters : 30;
  const probes = [];
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index];
    const end = points[index + 1];
    if (!isCoordinate(start) || !isCoordinate(end)) continue;
    if (probes.length === 0) probes.push([start[0], start[1]]);
    const length = distanceMeters(start, end);
    if (!Number.isFinite(length) || length < 1e-6) continue;
    const steps = Math.max(1, Math.ceil(length / spacing));
    for (let step = 1; step <= steps; step++) {
      const ratio = step / steps;
      probes.push([
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio
      ]);
    }
  }
  if (probes.length === 0 && isCoordinate(points[0])) probes.push([points[0][0], points[0][1]]);
  return probes;
}

function pointToSegmentDistance(point, segmentStart, segmentEnd) {
  if (![point, segmentStart, segmentEnd].every(isCoordinate)) return Infinity;
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 1e-12) return Math.hypot(px - x1, py - y1);
  const projection = Math.min(1, Math.max(0, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + projection * dx), py - (y1 + projection * dy));
}

/**
 * Build aggregated route segments from GPS tracks, with a visit-frequency
 * count per segment, optionally filtered by sport (spec.md FR-006/FR-008/FR-009).
 * @param {Object} gpsTracksByActivityId - { [activityId]: { sport, points: [[lat, lon], ...] } }
 * @param {{sportFilter?: string}} [options]
 * @returns {Object<string, {cellA: string, cellB: string, key: string, coords: [[number, number], [number, number]], count: number}>}
 */
function buildRouteSegments(gpsTracksByActivityId, options = {}) {
  const segments = {};
  if (!gpsTracksByActivityId || typeof gpsTracksByActivityId !== 'object') return segments;

  const sportFilter = options.sportFilter || 'All';
  const matchToleranceMeters = Number.isFinite(options.matchToleranceMeters) && options.matchToleranceMeters > 0
    ? options.matchToleranceMeters : 30;
  const probeSpacingMeters = Number.isFinite(options.probeSpacingMeters) && options.probeSpacingMeters > 0
    ? options.probeSpacingMeters : 30;
  const minContinuityMeters = Number.isFinite(options.minContinuityMeters) && options.minContinuityMeters > 0
    ? options.minContinuityMeters : 90;
  const maxHeadingDeltaDegrees = Number.isFinite(options.maxHeadingDeltaDegrees) && options.maxHeadingDeltaDegrees >= 0
    ? options.maxHeadingDeltaDegrees : 30;
  const continuitySteps = Math.max(1, Math.ceil(minContinuityMeters / probeSpacingMeters));
  const spatialIndex = new Map();
  let nextSegmentId = 0;

  const cellForPoint = point => {
    const latStep = (matchToleranceMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
    const lonScale = Math.max(Math.cos(point[0] * Math.PI / 180), 1e-6);
    return [Math.floor(point[0] / latStep), Math.floor(point[1] / (latStep / lonScale))];
  };
  const indexSegment = segment => {
    const bucket = spatialIndex.get(segment._cellKey) || [];
    bucket.push(segment);
    spatialIndex.set(segment._cellKey, bucket);
  };
  const candidateSegments = cell => {
    const candidates = [];
    for (let latOffset = -1; latOffset <= 1; latOffset++) {
      for (let lonOffset = -1; lonOffset <= 1; lonOffset++) {
        const bucket = spatialIndex.get(`${cell[0] + latOffset}:${cell[1] + lonOffset}`);
        if (bucket) candidates.push(...bucket);
      }
    }
    return candidates;
  };

  const activities = Object.entries(gpsTracksByActivityId)
    .map(([activityId, track]) => [String(activityId), track])
    .filter(([, track]) => track && Array.isArray(track.points) && track.points.length >= 2)
    .filter(([, track]) => sportFilter === 'All' || track.sport === sportFilter)
    .sort(([activityA], [activityB]) => activityA.localeCompare(activityB));

  for (const [activityId, track] of activities) {
    const probes = interpolateTrackProbes(track.points, probeSpacingMeters);
    if (probes.length < 2) continue;
    const activityContinuitySteps = Math.min(continuitySteps, probes.length - 1);
    const canMatchExistingCorridor = activityContinuitySteps === continuitySteps;
    const matchedKeys = new Set();

    for (let index = 0; index + activityContinuitySteps < probes.length; index++) {
      const start = probes[index];
      const end = probes[index + activityContinuitySteps];
      const heading = computeUndirectedHeading(start, end);
      if (heading === null) continue;
      const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const cell = cellForPoint(midpoint);
      let bestMatch = null;

      for (const candidate of canMatchExistingCorridor ? candidateSegments(cell) : []) {
        const headingDelta = headingDifferenceDegrees(heading, candidate.heading);
        if (headingDelta > maxHeadingDeltaDegrees) continue;
        const directStart = distanceMeters(start, candidate.coords[0]);
        const directEnd = distanceMeters(end, candidate.coords[1]);
        const reverseStart = distanceMeters(start, candidate.coords[1]);
        const reverseEnd = distanceMeters(end, candidate.coords[0]);
        const directMax = Math.max(directStart, directEnd);
        const reverseMax = Math.max(reverseStart, reverseEnd);
        const bestMax = Math.min(directMax, reverseMax);
        if (bestMax > matchToleranceMeters) continue;
        const meanDistance = directMax <= reverseMax
          ? (directStart + directEnd) / 2
          : (reverseStart + reverseEnd) / 2;
        const match = { candidate, meanDistance, headingDelta };
        if (!bestMatch
          || match.meanDistance < bestMatch.meanDistance
          || (match.meanDistance === bestMatch.meanDistance && match.headingDelta < bestMatch.headingDelta)
          || (match.meanDistance === bestMatch.meanDistance && match.headingDelta === bestMatch.headingDelta
            && match.candidate.key.localeCompare(bestMatch.candidate.key) < 0)) {
          bestMatch = match;
        }
      }

      let segment = bestMatch ? bestMatch.candidate : null;
      if (!segment) {
        const key = `corridor-${String(nextSegmentId++).padStart(8, '0')}`;
        segment = {
          key,
          coords: [[start[0], start[1]], [end[0], end[1]]],
          heading,
          activityIds: [],
          count: 0,
          _cellKey: `${cell[0]}:${cell[1]}`
        };
        segments[key] = segment;
        indexSegment(segment);
      }

      if (!matchedKeys.has(segment.key)) {
        matchedKeys.add(segment.key);
        segment.activityIds.push(activityId);
        segment.count = segment.activityIds.length;
      }
    }
  }

  for (const segment of Object.values(segments)) delete segment._cellKey;
  return segments;
}

/**
 * Compute the bounding box of a set of route segments (object map or array).
 * @param {Object|Array} segments
 * @returns {[[number, number], [number, number]]|null}
 */
function computeRouteSegmentBounds(segments) {
  const segmentList = Array.isArray(segments)
    ? segments
    : (segments && typeof segments === 'object' ? Object.values(segments) : []);

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const segment of segmentList) {
    if (!segment || !Array.isArray(segment.coords)) continue;
    for (const point of segment.coords) {
      if (!Array.isArray(point)) continue;
      const [lat, lon] = point;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
  }

  if (minLat === Infinity) return null;
  return [[minLat, minLon], [maxLat, maxLon]];
}

/**
 * Derive a logarithmic color scale from all valid route frequencies.
 * @param {Object|Array} segments - segment map or array with positive count values
 * @returns {{minCount: number, maxCount: number, logMin: number, logMax: number, midpointCount: number, hasRange: boolean}|null}
 */
function computeRouteFrequencyScale(segments) {
  const segmentList = Array.isArray(segments)
    ? segments
    : (segments && typeof segments === 'object' ? Object.values(segments) : []);
  let minCount = Infinity;
  let maxCount = -Infinity;
  for (const segment of segmentList) {
    const count = segment && segment.count;
    if (!Number.isFinite(count) || count <= 0) continue;
    if (count < minCount) minCount = count;
    if (count > maxCount) maxCount = count;
  }

  if (minCount === Infinity) return null;

  const logMin = Math.log(minCount);
  const logMax = Math.log(maxCount);
  const hasRange = maxCount > minCount;

  return {
    minCount,
    maxCount,
    logMin,
    logMax,
    midpointCount: hasRange
      ? Math.exp((logMin + logMax) / 2)
      : minCount,
    hasRange
  };
}

/**
 * Normalize a frequency to its clamped logarithmic position in a scale.
 * @param {number} count
 * @param {{logMin: number, logMax: number, hasRange: boolean}|null} scale
 * @returns {number}
 */
function normalizeRouteFrequency(count, scale) {
  if (!scale || !scale.hasRange || !Number.isFinite(count) || count <= 0) return 0;
  const range = scale.logMax - scale.logMin;
  if (!Number.isFinite(range) || range <= 0) return 0;
  const normalized = (Math.log(count) - scale.logMin) / range;
  return Math.min(1, Math.max(0, normalized));
}

const ROUTE_COLOR_DEFAULTS = {
  lowColor: '#60A5FA',
  extremeColor: '#DC2626'
};

function parseHexColor(color) {
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return null;
  return [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16)
  ];
}

function interpolateHexColor(startColor, endColor, progress) {
  const start = parseHexColor(startColor);
  const end = parseHexColor(endColor);
  const clamped = Math.min(1, Math.max(0, progress));
  const channels = start.map((value, index) => Math.round(value + (end[index] - value) * clamped));
  return `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Map a route frequency directly across the light-blue -> red scale.
 * @param {number} count
 * @param {Object|null} scale - output of computeRouteFrequencyScale()
 * @param {{lowColor?: string, extremeColor?: string}} [options]
 * @returns {string}
 */
function computeRouteSegmentColor(count, scale, options = {}) {
  const customColors = [options.lowColor, options.extremeColor];
  const palette = customColors.every(color => parseHexColor(color)) ? options : ROUTE_COLOR_DEFAULTS;
  const normalized = normalizeRouteFrequency(count, scale);
  return interpolateHexColor(palette.lowColor, palette.extremeColor, normalized);
}

function formatVisitCount(count) {
  return `${count} ${count === 1 ? 'visit' : 'visits'}`;
}

/**
 * Build display-ready values for the heatmap frequency legend.
 * @param {Object|null} scale - output of computeRouteFrequencyScale()
 * @returns {Object}
 */
function buildFrequencyScaleGuide(scale) {
  if (!scale) return { visible: false, mode: 'hidden', ariaLabel: '' };

  if (!scale.hasRange) {
    return {
      visible: true,
      mode: 'constant',
      count: scale.minCount,
      ariaLabel: `All displayed routes have ${formatVisitCount(scale.minCount)}.`
    };
  }

  const midpointCount = Math.round(scale.midpointCount);
  return {
    visible: true,
    mode: 'range',
    minCount: scale.minCount,
    midpointCount,
    maxCount: scale.maxCount,
    ariaLabel: `Frequency scale from ${formatVisitCount(scale.minCount)} (light blue) through about ${formatVisitCount(midpointCount)} (midpoint) to ${formatVisitCount(scale.maxCount)} (red).`
  };
}

function formatActivityDate(date) {
  if (date === null || date === undefined || date === '') return 'Unknown date';
  const parsed = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(parsed.getTime())) return 'Unknown date';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatActivityDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return '--';
  const totalSeconds = Math.round(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatActivityDistance(distanceKm, sport) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return '--';
  return sport === 'Swim' ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function buildActivitySummaryIndex(activities) {
  const index = new Map();
  if (!Array.isArray(activities)) return index;
  for (const activity of activities) {
    if (!activity || activity.id === null || activity.id === undefined || String(activity.id).trim() === '') continue;
    const id = String(activity.id);
    if (index.has(id)) continue;
    const sport = ['Run', 'Bike', 'Swim'].includes(activity.sport) ? activity.sport : 'Unknown sport';
    index.set(id, {
      id,
      name: typeof activity.name === 'string' && activity.name.trim() ? activity.name.trim() : 'Unknown activity',
      dateLabel: formatActivityDate(activity.date),
      sport,
      distanceLabel: formatActivityDistance(activity.distance, sport),
      durationLabel: formatActivityDuration(activity.duration)
    });
  }
  return index;
}

function sampleDistinct(values, limit = 10, random = Math.random) {
  const unique = Array.from(new Set(Array.isArray(values) ? values : []));
  const safeLimit = Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : 10;
  if (unique.length <= safeLimit) return unique;
  const sampled = [];
  while (sampled.length < safeLimit && unique.length > 0) {
    const randomValue = Math.min(0.999999999, Math.max(0, Number(random()) || 0));
    const index = Math.floor(randomValue * unique.length);
    const lastIndex = unique.length - 1;
    [unique[index], unique[lastIndex]] = [unique[lastIndex], unique[index]];
    sampled.push(unique.pop());
  }
  return sampled;
}

function buildActivityTooltipModel(activityIds, activityIndex, options = {}) {
  const uniqueIds = Array.from(new Set(Array.isArray(activityIds) ? activityIds.map(String) : []));
  const summaries = uniqueIds
    .map(activityId => activityIndex instanceof Map ? activityIndex.get(activityId) : null)
    .filter(Boolean);
  const limit = Number.isFinite(options.limit) && options.limit >= 0 ? Math.floor(options.limit) : 10;
  const sampled = summaries.length > limit;
  const activities = sampled ? sampleDistinct(summaries, limit, options.random || Math.random) : summaries;
  const totalCount = uniqueIds.length;
  const availableCount = summaries.length;
  return {
    segmentKey: options.segmentKey || '',
    totalCount,
    availableCount,
    sampled,
    heading: sampled
      ? `Random ${limit} of ${totalCount} activities`
      : `${totalCount} ${totalCount === 1 ? 'activity' : 'activities'}`,
    availabilityNote: availableCount < totalCount ? `${availableCount} of ${totalCount} activities available` : null,
    activities
  };
}

function buildScreenSegmentIndex(entries, options = {}) {
  const cellSizePx = Number.isFinite(options.cellSizePx) && options.cellSizePx > 0 ? options.cellSizePx : 32;
  const paddingPx = Number.isFinite(options.paddingPx) && options.paddingPx >= 0 ? options.paddingPx : 5;
  const cells = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || !isCoordinate(entry.p1) || !isCoordinate(entry.p2)) continue;
    const radius = Math.max((Number.isFinite(entry.lineWidth) ? entry.lineWidth : 0) / 2 + paddingPx, 6);
    const minX = Math.floor((Math.min(entry.p1[0], entry.p2[0]) - radius) / cellSizePx);
    const maxX = Math.floor((Math.max(entry.p1[0], entry.p2[0]) + radius) / cellSizePx);
    const minY = Math.floor((Math.min(entry.p1[1], entry.p2[1]) - radius) / cellSizePx);
    const maxY = Math.floor((Math.max(entry.p1[1], entry.p2[1]) + radius) / cellSizePx);
    const indexedEntry = { ...entry, radius };
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x}:${y}`;
        const bucket = cells.get(key) || [];
        bucket.push(indexedEntry);
        cells.set(key, bucket);
      }
    }
  }
  return { cellSizePx, cells };
}

function hitTestScreenSegmentIndex(index, point) {
  if (!index || !(index.cells instanceof Map) || !isCoordinate(point)) return null;
  const cellSizePx = index.cellSizePx || 32;
  const cellX = Math.floor(point[0] / cellSizePx);
  const cellY = Math.floor(point[1] / cellSizePx);
  const candidates = new Map();
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const bucket = index.cells.get(`${cellX + xOffset}:${cellY + yOffset}`) || [];
      for (const entry of bucket) candidates.set(entry.key, entry);
    }
  }
  const hits = [];
  for (const entry of candidates.values()) {
    const distance = pointToSegmentDistance(point, entry.p1, entry.p2);
    if (distance <= entry.radius) hits.push({ entry, distance });
  }
  hits.sort((left, right) => left.distance - right.distance
    || ((right.entry.segment && right.entry.segment.count) || 0) - ((left.entry.segment && left.entry.segment.count) || 0)
    || String(left.entry.key).localeCompare(String(right.entry.key)));
  return hits.length > 0 ? hits[0].entry : null;
}

// Fixed rendering style (spec 005 FR-007/FR-008/FR-009): color is the sole visit-frequency
// visual channel; weight/opacity stay constant so nearby distinct roads never visually merge
// and an isolated route never shrinks to an imperceptible hairline.
const ROUTE_STYLE_DEFAULTS = {
  weight: 3,
  opacity: 0.85
};

/**
 * Return the fixed { weight, opacity } style pair used for every route segment, independent
 * of visit-frequency count (spec 005 FR-007/FR-008; research.md Decision 3). `count` is
 * accepted for call-site compatibility but does not affect the returned style.
 * @param {number} count
 * @param {{weight?: number, opacity?: number}} [options]
 * @returns {{weight: number, opacity: number}}
 */
function computeRouteSegmentStyle(count, options = {}) {
  const weight = Number.isFinite(options.weight) && options.weight > 0 ? options.weight : ROUTE_STYLE_DEFAULTS.weight;
  const opacity = Number.isFinite(options.opacity) && options.opacity > 0 ? options.opacity : ROUTE_STYLE_DEFAULTS.opacity;
  return { weight, opacity };
}

/* ------------------------------------------------------------------------
 * Rendering Performance Helpers
 * Pure, DOM-free helpers used by the route-line heatmap's canvas rendering
 * (specs/002-heatmap-performance-scale) to keep pan/zoom smooth at scale:
 * viewport culling, low-zoom aggregation, and minimum-visible-length.
 * ------------------------------------------------------------------------ */

/**
 * Does a route segment's bounding box intersect a (padded) viewport?
 * @param {{coords: [[number, number], [number, number]]}} segment
 * @param {[[number, number], [number, number]]} viewportBounds - [[minLat, minLon], [maxLat, maxLon]]
 * @param {number} [paddingDegrees] - widens the viewport bounds on all sides before testing
 * @returns {boolean}
 */
function segmentIntersectsBounds(segment, viewportBounds, paddingDegrees = 0) {
  if (!segment || !Array.isArray(segment.coords) || !Array.isArray(viewportBounds) || viewportBounds.length !== 2) {
    return false;
  }
  const [[vMinLat, vMinLon], [vMaxLat, vMaxLon]] = viewportBounds;
  if (![vMinLat, vMinLon, vMaxLat, vMaxLon].every(Number.isFinite)) return false;

  const minLat = vMinLat - paddingDegrees;
  const maxLat = vMaxLat + paddingDegrees;
  const minLon = vMinLon - paddingDegrees;
  const maxLon = vMaxLon + paddingDegrees;

  let segMinLat = Infinity;
  let segMaxLat = -Infinity;
  let segMinLon = Infinity;
  let segMaxLon = -Infinity;
  for (const point of segment.coords) {
    if (!Array.isArray(point)) continue;
    const [lat, lon] = point;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < segMinLat) segMinLat = lat;
    if (lat > segMaxLat) segMaxLat = lat;
    if (lon < segMinLon) segMinLon = lon;
    if (lon > segMaxLon) segMaxLon = lon;
  }
  if (segMinLat === Infinity) return false;

  return segMinLat <= maxLat && segMaxLat >= minLat && segMinLon <= maxLon && segMaxLon >= minLon;
}

// Coarser grid size used only for low-zoom rendering aggregation, so many nearby
// full-detail corridors collapse into one stroke when their differences are no
// longer visible.
const LOW_ZOOM_DEFAULT_CELL_METERS = 300;

function snapToGridCellWithSize(lat, lon, cellMeters) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const latStepDeg = (cellMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lonScale = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const lonStepDeg = latStepDeg / lonScale;
  const latCell = Math.round(lat / latStepDeg);
  const lonCell = Math.round(lon / lonStepDeg);
  return `${latCell}:${lonCell}`;
}

/**
 * Aggregate route segments onto a coarser grid for low-zoom rendering only.
 * Purely a rendering-time simplification: does not mutate `segments` and does
 * not alter the underlying per-segment visit-frequency counts (spec FR-004).
 * @param {Object|Array} segments - buildRouteSegments() output (map or array)
 * @param {{cellMeters?: number}} [options]
 * @returns {Object<string, {key: string, coords: [[number, number], [number, number]], count: number}>}
 */
function buildLowZoomRouteSegments(segments, options = {}) {
  const cellMeters = Number.isFinite(options.cellMeters) && options.cellMeters > 0
    ? options.cellMeters
    : LOW_ZOOM_DEFAULT_CELL_METERS;
  const aggregated = {};
  const segmentList = Array.isArray(segments)
    ? segments
    : (segments && typeof segments === 'object' ? Object.values(segments) : []);

  for (const segment of segmentList) {
    if (!segment || !Array.isArray(segment.coords) || segment.coords.length < 2) continue;
    const [pointA, pointB] = segment.coords;
    if (!Array.isArray(pointA) || !Array.isArray(pointB)) continue;
    const [latA, lonA] = pointA;
    const [latB, lonB] = pointB;
    if (!Number.isFinite(latA) || !Number.isFinite(lonA) || !Number.isFinite(latB) || !Number.isFinite(lonB)) continue;

    const cellA = snapToGridCellWithSize(latA, lonA, cellMeters);
    const cellB = snapToGridCellWithSize(latB, lonB, cellMeters);
    if (!cellA || !cellB) continue;

    const key = cellA === cellB ? cellA : [cellA, cellB].sort().join('|');
    const count = Number.isFinite(segment.count) && segment.count > 0 ? segment.count : 0;
    const activityIds = Array.isArray(segment.activityIds)
      ? segment.activityIds.filter(activityId => activityId !== null && activityId !== undefined).map(String)
      : [];

    if (!aggregated[key]) {
      aggregated[key] = {
        key,
        coords: [[latA, lonA], [latB, lonB]],
        count: 0,
        colorCount: 0,
        activityIds: [],
        _activityIdSet: new Set()
      };
    }
    aggregated[key].colorCount = Math.max(aggregated[key].colorCount, count);
    for (const activityId of activityIds) aggregated[key]._activityIdSet.add(activityId);
  }

  for (const aggregate of Object.values(aggregated)) {
    aggregate.activityIds = Array.from(aggregate._activityIdSet).sort((left, right) => left.localeCompare(right));
    aggregate.count = aggregate.activityIds.length;
    delete aggregate._activityIdSet;
  }

  return aggregated;
}

/**
 * Given two projected pixel points for a segment, return adjusted pixel points
 * guaranteed to be at least `minLengthPx` apart, so an isolated/short segment is
 * never drawn fully invisible (spec FR-003, "distant single activity stays
 * visible"). Extends symmetrically from the segment's midpoint along its
 * original direction; for a degenerate (zero-length) segment, draws a fixed
 * horizontal dash of `minLengthPx` centered on that point.
 * @param {[number, number]} p1 - [x, y] pixel point
 * @param {[number, number]} p2 - [x, y] pixel point
 * @param {{minLengthPx?: number}} [options]
 * @returns {[[number, number], [number, number]]}
 */
function extendSegmentToMinLength(p1, p2, options = {}) {
  const minLengthPx = Number.isFinite(options.minLengthPx) && options.minLengthPx > 0 ? options.minLengthPx : 1.5;
  if (!Array.isArray(p1) || !Array.isArray(p2) || p1.length < 2 || p2.length < 2) return [p1, p2];

  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length >= minLengthPx) return [p1, p2];

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  if (length < 1e-6) {
    const half = minLengthPx / 2;
    return [[midX - half, midY], [midX + half, midY]];
  }

  const scale = (minLengthPx / length) / 2;
  const newDx = dx * scale;
  const newDy = dy * scale;
  return [[midX - newDx, midY - newDy], [midX + newDx, midY + newDy]];
}

/**
 * Sort route segments ascending by visit-frequency count (with a deterministic lexical-key
 * tie-break), so that drawing them in this order guarantees the highest-frequency segment is
 * always the last (topmost) one rendered at any shared screen position, independent of
 * import/processing order (spec 005 FR-001/FR-002/FR-003). Pass `countField: 'colorCount'`
 * to sort low-zoom aggregates (FR-010) the same way.
 * @param {Array<Object>|Object} segments - segment array or map (values are used)
 * @param {string} [countField] - property name holding the frequency count (default 'count')
 * @returns {Array<Object>} new sorted array; input is not mutated
 */
function sortSegmentsForDrawOrder(segments, countField = 'count') {
  const list = Array.isArray(segments)
    ? segments.slice()
    : (segments && typeof segments === 'object' ? Object.values(segments) : []);
  return list.sort((a, b) => {
    const countA = Number.isFinite(a && a[countField]) ? a[countField] : 0;
    const countB = Number.isFinite(b && b[countField]) ? b[countField] : 0;
    if (countA !== countB) return countA - countB;
    return String(a && a.key).localeCompare(String(b && b.key));
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hasGpsData,
    distanceMeters,
    computeUndirectedHeading,
    headingDifferenceDegrees,
    interpolateTrackProbes,
    pointToSegmentDistance,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle,
    computeRouteFrequencyScale,
    normalizeRouteFrequency,
    computeRouteSegmentColor,
    buildFrequencyScaleGuide,
    buildActivitySummaryIndex,
    sampleDistinct,
    buildActivityTooltipModel,
    buildScreenSegmentIndex,
    hitTestScreenSegmentIndex,
    segmentIntersectsBounds,
    buildLowZoomRouteSegments,
    extendSegmentToMinLength,
    sortSegmentsForDrawOrder
  };
}

if (typeof window !== 'undefined') {
  window.heatmapUtils = {
    hasGpsData,
    distanceMeters,
    computeUndirectedHeading,
    headingDifferenceDegrees,
    interpolateTrackProbes,
    pointToSegmentDistance,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle,
    computeRouteFrequencyScale,
    normalizeRouteFrequency,
    computeRouteSegmentColor,
    buildFrequencyScaleGuide,
    buildActivitySummaryIndex,
    sampleDistinct,
    buildActivityTooltipModel,
    buildScreenSegmentIndex,
    hitTestScreenSegmentIndex,
    segmentIntersectsBounds,
    buildLowZoomRouteSegments,
    extendSegmentToMinLength,
    sortSegmentsForDrawOrder
  };
}
