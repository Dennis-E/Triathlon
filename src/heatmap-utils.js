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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hasGpsData,
    snapToGridCell,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle
  };
}

if (typeof window !== 'undefined') {
  window.heatmapUtils = {
    hasGpsData,
    snapToGridCell,
    buildRouteSegments,
    computeRouteSegmentBounds,
    computeRouteSegmentStyle
  };
}
