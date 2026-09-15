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

/**
 * Flatten GPS tracks into [lat, lon, intensity] points for a heatmap layer,
 * optionally filtered by sport
 * @param {Object} gpsTracksByActivityId - { [activityId]: { sport, points: [[lat, lon], ...] } }
 * @param {{sportFilter?: string}} [options] - sportFilter: 'All' | 'Run' | 'Bike' | 'Swim'
 * @returns {Array<[number, number, number]>}
 */
function buildHeatmapPoints(gpsTracksByActivityId, options = {}) {
  if (!gpsTracksByActivityId || typeof gpsTracksByActivityId !== 'object') return [];
  const sportFilter = options.sportFilter || 'All';

  const points = [];
  for (const track of Object.values(gpsTracksByActivityId)) {
    if (!track || !Array.isArray(track.points)) continue;
    if (sportFilter !== 'All' && track.sport !== sportFilter) continue;
    for (const [lat, lon] of track.points) {
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push([lat, lon, 1]);
      }
    }
  }
  return points;
}

/**
 * Compute the bounding box of a set of heatmap points
 * @param {Array<[number, number, number]>} points
 * @returns {[[number, number], [number, number]]|null} [[minLat, minLon], [maxLat, maxLon]] or null when empty
 */
function computeHeatmapBounds(points) {
  if (!Array.isArray(points) || points.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const [lat, lon] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }

  return [[minLat, minLon], [maxLat, maxLon]];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hasGpsData,
    buildHeatmapPoints,
    computeHeatmapBounds
  };
}

if (typeof window !== 'undefined') {
  window.heatmapUtils = {
    hasGpsData,
    buildHeatmapPoints,
    computeHeatmapBounds
  };
}
