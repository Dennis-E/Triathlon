function isValidTrackPoint(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1])
    && point[0] >= -90
    && point[0] <= 90
    && point[1] >= -180
    && point[1] <= 180;
}

function collectGeoJsonPositions(value, positions) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    positions.push(value);
    return;
  }
  value.forEach(child => collectGeoJsonPositions(child, positions));
}

function getBounds(positions) {
  if (!Array.isArray(positions) || positions.length === 0) return null;
  const bounds = {
    minLongitude: Infinity,
    minLatitude: Infinity,
    maxLongitude: -Infinity,
    maxLatitude: -Infinity
  };

  positions.forEach(([longitude, latitude]) => {
    bounds.minLongitude = Math.min(bounds.minLongitude, longitude);
    bounds.minLatitude = Math.min(bounds.minLatitude, latitude);
    bounds.maxLongitude = Math.max(bounds.maxLongitude, longitude);
    bounds.maxLatitude = Math.max(bounds.maxLatitude, latitude);
  });

  return bounds;
}

function getCountryFeatureBounds(feature) {
  if (!feature || !feature.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) return null;
  const positions = [];
  collectGeoJsonPositions(feature.geometry.coordinates, positions);
  return getBounds(positions);
}

function boundsIntersect(boundsA, boundsB) {
  return !!boundsA && !!boundsB
    && boundsA.minLongitude <= boundsB.maxLongitude
    && boundsA.maxLongitude >= boundsB.minLongitude
    && boundsA.minLatitude <= boundsB.maxLatitude
    && boundsA.maxLatitude >= boundsB.minLatitude;
}

function unavailableSummary(totalActivityCount, trackedActivityCount) {
  return {
    status: 'unavailable',
    countryCount: null,
    countryNames: [],
    trackedActivityCount,
    totalActivityCount,
    countryIds: new Set()
  };
}

function normalizeCountryFeatures(countryFeatures) {
  const features = Array.isArray(countryFeatures)
    ? countryFeatures
    : countryFeatures && Array.isArray(countryFeatures.features)
      ? countryFeatures.features
      : [];
  const uniqueFeatures = new Map();

  features.forEach(feature => {
    const rawCountryId = feature && feature.properties && feature.properties.ADM0_A3;
    const countryId = typeof rawCountryId === 'string' ? rawCountryId.trim() : '';
    if (!countryId || countryId === '-99' || uniqueFeatures.has(countryId)) return;
    const bounds = getCountryFeatureBounds(feature);
    if (!bounds) return;
    const properties = feature.properties || {};
    const countryName = String(properties.NAME || properties.ADMIN || properties.NAME_EN || countryId).trim();
    uniqueFeatures.set(countryId, { feature, bounds, countryName });
  });

  return Array.from(uniqueFeatures.entries()).map(([countryId, entry]) => ({
    countryId,
    countryName: entry.countryName,
    feature: entry.feature,
    bounds: entry.bounds
  }));
}

function aggregateCountryCount(options = {}) {
  const activities = Array.isArray(options.activities) ? options.activities : [];
  const totalActivityCount = activities.length;
  const gpsTracksByActivityId = options.gpsTracksByActivityId || {};
  const routes = [];

  activities.forEach(activity => {
    if (!activity || activity.id === null || activity.id === undefined) return;
    const track = gpsTracksByActivityId[String(activity.id)];
    if (!track || !Array.isArray(track.points)) return;
    const points = track.points.filter(isValidTrackPoint);
    if (points.length === 0) return;
    routes.push({ points, bounds: getBounds(points.map(([latitude, longitude]) => [longitude, latitude])) });
  });

  const trackedActivityCount = routes.length;
  const countryFeatures = normalizeCountryFeatures(options.countryFeatures);
  const geometryOperations = options.geometryOperations || {};
  if (
    trackedActivityCount === 0
    || countryFeatures.length === 0
    || typeof geometryOperations.booleanIntersects !== 'function'
    || typeof geometryOperations.booleanPointInPolygon !== 'function'
  ) {
    return unavailableSummary(totalActivityCount, trackedActivityCount);
  }

  const countryIds = new Set();
  const countryNamesById = new Map();

  try {
    routes.forEach(route => {
      const lineCoordinates = route.points.map(([latitude, longitude]) => [longitude, latitude]);
      const lineFeature = lineCoordinates.length > 1
        ? { type: 'LineString', coordinates: lineCoordinates }
        : null;

      countryFeatures.forEach(country => {
        if (!boundsIntersect(route.bounds, country.bounds)) return;

        const intersects = lineFeature
          ? geometryOperations.booleanIntersects(lineFeature, country.feature)
          : geometryOperations.booleanPointInPolygon(lineCoordinates[0], country.feature);
        if (intersects) {
          countryIds.add(country.countryId);
          countryNamesById.set(country.countryId, country.countryName);
        }
      });
    });
  } catch (error) {
    return unavailableSummary(totalActivityCount, trackedActivityCount);
  }

  return {
    status: trackedActivityCount === totalActivityCount ? 'complete' : 'partial',
    countryCount: countryIds.size,
    countryNames: Array.from(countryNamesById.values())
      .sort((nameA, nameB) => nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })),
    trackedActivityCount,
    totalActivityCount,
    countryIds
  };
}

const countryCountUtils = { aggregateCountryCount };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = countryCountUtils;
}

if (typeof window !== 'undefined') {
  window.countryCountUtils = countryCountUtils;
}