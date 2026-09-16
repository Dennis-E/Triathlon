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

// Grid cell size used to tolerate GPS noise when matching "the same" route
// segment across activities (spec.md FR-009). Known limitation: points that
// straddle a cell boundary can be <15m apart but land in different cells and
// so won't merge - accepted as a v1 best-effort trade-off (see research.md
// Decision 1 / SC-005).
const ROUTE_GRID_CELL_METERS = 15;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Snap a raw [lat, lon] point to a grid cell key at ~15m resolution.
 * @param {number} lat
 * @param {number} lon
 * @returns {string|null} a stable cell key, or null for invalid input
 */
function snapToGridCell(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const latStepDeg = (ROUTE_GRID_CELL_METERS / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lonScale = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const lonStepDeg = latStepDeg / lonScale;

  const latCell = Math.round(lat / latStepDeg);
  const lonCell = Math.round(lon / lonStepDeg);
  return `${latCell}:${lonCell}`;
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

  for (const track of Object.values(gpsTracksByActivityId)) {
    if (!track || !Array.isArray(track.points) || track.points.length < 2) continue;
    if (sportFilter !== 'All' && track.sport !== sportFilter) continue;

    // Count each distinct segment at most once per activity, so a single
    // activity looping the same street repeatedly doesn't by itself inflate
    // the frequency count relative to separate training sessions.
    const segmentKeysSeenInActivity = new Set();

    for (let i = 0; i < track.points.length - 1; i++) {
      const pointA = track.points[i];
      const pointB = track.points[i + 1];
      if (!Array.isArray(pointA) || !Array.isArray(pointB)) continue;
      const [latA, lonA] = pointA;
      const [latB, lonB] = pointB;
      if (!Number.isFinite(latA) || !Number.isFinite(lonA) || !Number.isFinite(latB) || !Number.isFinite(lonB)) continue;

      const cellA = snapToGridCell(latA, lonA);
      const cellB = snapToGridCell(latB, lonB);
      if (!cellA || !cellB || cellA === cellB) continue;

      const key = [cellA, cellB].sort().join('|');
      if (segmentKeysSeenInActivity.has(key)) continue;
      segmentKeysSeenInActivity.add(key);

      if (!segments[key]) {
        segments[key] = {
          cellA,
          cellB,
          key,
          coords: [[latA, lonA], [latB, lonB]],
          count: 0
        };
      }
      segments[key].count += 1;
    }
  }

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

// Legible-minimum-to-capped-maximum style constants (FR-003/FR-004): tuned so
// a single visit is still clearly visible (opacity/weight floor) while very
// frequent segments saturate around ~50 visits instead of growing unbounded.
const ROUTE_STYLE_DEFAULTS = {
  minWeight: 2,
  maxWeight: 9,
  minOpacity: 0.55,
  maxOpacity: 0.95,
  saturationCount: 50
};

/**
 * Map a visit-frequency count to a clamped, perceptually-scaled { weight, opacity }
 * style pair (spec.md FR-002/FR-003/FR-004/FR-005; research.md Decision 3).
 * @param {number} count
 * @param {{minWeight?: number, maxWeight?: number, minOpacity?: number, maxOpacity?: number, saturationCount?: number}} [options]
 * @returns {{weight: number, opacity: number}}
 */
function computeRouteSegmentStyle(count, options = {}) {
  const config = { ...ROUTE_STYLE_DEFAULTS, ...options };
  const safeCount = Number.isFinite(count) && count > 0 ? count : 1;

  // Logarithmic compression: rare (count=1) segments stay near the legible
  // floor, common segments approach the cap, and extremely frequent segments
  // are clamped rather than growing without bound.
  const normalized = Math.log(1 + safeCount) / Math.log(1 + config.saturationCount);
  const clamped = Math.min(1, Math.max(0, normalized));

  const weight = config.minWeight + clamped * (config.maxWeight - config.minWeight);
  const opacity = config.minOpacity + clamped * (config.maxOpacity - config.minOpacity);

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

// Coarser grid size used only for low-zoom rendering aggregation - larger than the
// 15m ROUTE_GRID_CELL_METERS used for real segment identity, so many nearby
// full-detail segments collapse into a single drawn stroke when zoomed out far
// enough that the difference wouldn't be visible anyway.
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
 * not alter the underlying per-segment visit-frequency counts (spec FR-004) -
 * it only sums them into coarser buckets for display at low zoom.
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
    const count = Number.isFinite(segment.count) ? segment.count : 0;

    if (!aggregated[key]) {
      aggregated[key] = { key, coords: [[latA, lonA], [latB, lonB]], count: 0 };
    }
    aggregated[key].count += count;
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hasGpsData,
    snapToGridCell,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle,
    segmentIntersectsBounds,
    buildLowZoomRouteSegments,
    extendSegmentToMinLength
  };
}

if (typeof window !== 'undefined') {
  window.heatmapUtils = {
    hasGpsData,
    snapToGridCell,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle,
    segmentIntersectsBounds,
    buildLowZoomRouteSegments,
    extendSegmentToMinLength
  };
}
