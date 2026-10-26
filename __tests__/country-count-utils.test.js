const { aggregateCountryCount } = require('../src/country-count-utils');

function createCountryFeature(countryId, minLongitude, minLatitude, maxLongitude, maxLatitude) {
  const countryNames = { AAA: 'Germany', BBB: 'France', MID: 'Exampleland' };
  return {
    type: 'Feature',
    properties: { ADM0_A3: countryId, NAME: countryNames[countryId] || countryId },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLongitude, minLatitude],
        [maxLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [minLongitude, maxLatitude],
        [minLongitude, minLatitude]
      ]]
    }
  };
}

function pointIsInBounds(pointCoordinates, countryFeature) {
  const [longitude, latitude] = pointCoordinates;
  const coordinates = countryFeature.geometry.coordinates[0];
  const longitudes = coordinates.map(coordinate => coordinate[0]);
  const latitudes = coordinates.map(coordinate => coordinate[1]);
  return longitude >= Math.min(...longitudes)
    && longitude <= Math.max(...longitudes)
    && latitude >= Math.min(...latitudes)
    && latitude <= Math.max(...latitudes);
}

function segmentIntersectsCountry(start, end, countryFeature) {
  const coordinates = countryFeature.geometry.coordinates[0];
  const longitudes = coordinates.map(coordinate => coordinate[0]);
  const latitudes = coordinates.map(coordinate => coordinate[1]);
  const axes = [
    { start: start[0], delta: end[0] - start[0], minimum: Math.min(...longitudes), maximum: Math.max(...longitudes) },
    { start: start[1], delta: end[1] - start[1], minimum: Math.min(...latitudes), maximum: Math.max(...latitudes) }
  ];
  let firstRatio = 0;
  let lastRatio = 1;

  for (const axis of axes) {
    if (Math.abs(axis.delta) < 1e-12) {
      if (axis.start < axis.minimum || axis.start > axis.maximum) return false;
      continue;
    }

    let entryRatio = (axis.minimum - axis.start) / axis.delta;
    let exitRatio = (axis.maximum - axis.start) / axis.delta;
    if (entryRatio > exitRatio) [entryRatio, exitRatio] = [exitRatio, entryRatio];
    firstRatio = Math.max(firstRatio, entryRatio);
    lastRatio = Math.min(lastRatio, exitRatio);
    if (firstRatio > lastRatio) return false;
  }

  return true;
}

const geometryOperations = {
  booleanPointInPolygon: pointIsInBounds,
  booleanIntersects: (lineFeature, countryFeature) => {
    const coordinates = lineFeature.coordinates;
    if (coordinates.some(point => pointIsInBounds(point, countryFeature))) return true;
    return coordinates.slice(1).some((point, index) => (
      segmentIntersectsCountry(coordinates[index], point, countryFeature)
    ));
  }
};

describe('aggregateCountryCount', () => {
  const countryFeatures = [
    createCountryFeature('AAA', 0, 0, 2, 2),
    createCountryFeature('BBB', 4, 0, 6, 2)
  ];

  it('counts each ADM0_A3 country once across repeated routes and sports', () => {
    const summary = aggregateCountryCount({
      activities: [
        { id: 'run-one', sport: 'Run' },
        { id: 'bike-one', sport: 'Bike' },
        { id: 'swim-one', sport: 'Swim' }
      ],
      gpsTracksByActivityId: {
        'run-one': { sport: 'Run', points: [[1, 1], [1.5, 1.5]] },
        'bike-one': { sport: 'Bike', points: [[0.5, 0.5]] },
        'swim-one': { sport: 'Swim', points: [[1, 5]] }
      },
      countryFeatures,
      geometryOperations
    });

    expect(summary).toMatchObject({
      status: 'complete',
      countryCount: 2,
      trackedActivityCount: 3,
      totalActivityCount: 3
    });
    expect(summary.countryIds).toEqual(new Set(['AAA', 'BBB']));
    expect(summary.countryNames).toEqual(['France', 'Germany']);
  });

  it('counts a country crossed between route samples even when neither sample is inside it', () => {
    const narrowCountry = createCountryFeature('MID', 0, -1, 1, 1);
    const summary = aggregateCountryCount({
      activities: [{ id: 'border-run', sport: 'Run' }],
      gpsTracksByActivityId: {
        'border-run': { sport: 'Run', points: [[0, -2], [0, 2]] }
      },
      countryFeatures: [narrowCountry],
      geometryOperations
    });

    expect(pointIsInBounds([-2, 0], narrowCountry)).toBe(false);
    expect(pointIsInBounds([2, 0], narrowCountry)).toBe(false);
    expect(summary.countryCount).toBe(1);
    expect(summary.countryIds).toEqual(new Set(['MID']));
  });

  it('accepts one valid point and ignores non-finite or out-of-range coordinate pairs', () => {
    const summary = aggregateCountryCount({
      activities: [
        { id: 'single-point', sport: 'Run' },
        { id: 'invalid-track', sport: 'Bike' }
      ],
      gpsTracksByActivityId: {
        'single-point': { sport: 'Run', points: [[1, 1]] },
        'invalid-track': { sport: 'Bike', points: [[NaN, 0], [0, 181], [91, 0]] }
      },
      countryFeatures,
      geometryOperations
    });

    expect(summary).toMatchObject({
      status: 'partial',
      countryCount: 1,
      trackedActivityCount: 1,
      totalActivityCount: 2
    });
  });

  it('returns a genuine zero when valid routes do not intersect any country', () => {
    const summary = aggregateCountryCount({
      activities: [{ id: 'offshore', sport: 'Swim' }],
      gpsTracksByActivityId: {
        offshore: { sport: 'Swim', points: [[20, 20]] }
      },
      countryFeatures,
      geometryOperations
    });

    expect(summary).toMatchObject({
      status: 'complete',
      countryCount: 0,
      trackedActivityCount: 1,
      totalActivityCount: 1
    });
    expect(summary.countryIds).toEqual(new Set());
  });

  it('returns unavailable with a null count when no usable route exists', () => {
    const summary = aggregateCountryCount({
      activities: [{ id: 'invalid-track', sport: 'Run' }],
      gpsTracksByActivityId: {
        'invalid-track': { sport: 'Run', points: [[NaN, 0], [95, 0]] }
      },
      countryFeatures,
      geometryOperations
    });

    expect(summary).toMatchObject({
      status: 'unavailable',
      countryCount: null,
      trackedActivityCount: 0,
      totalActivityCount: 1
    });
  });
});