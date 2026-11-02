(function (root) {
  const years = [2021, 2022, 2023, 2024, 2025];
  const sports = ['Run', 'Bike', 'Swim'];
  const effortDurations = [5, 30, 60, 120, 300, 600, 1200, 3600];
  const label = 'Synthetic sample training data';

  function requireSample(condition, message) {
    if (!condition) throw new Error(`Invalid sample data: ${message}`);
  }

  function inRange(value, minimum, maximum) {
    return Number.isFinite(value) && value >= minimum && value <= maximum;
  }

  function distanceKm(start, end) {
    const radians = Math.PI / 180;
    const latitude = (end[0] - start[0]) * radians;
    const longitude = (end[1] - start[1]) * radians;
    const haversine = Math.sin(latitude / 2) ** 2 + Math.cos(start[0] * radians)
      * Math.cos(end[0] * radians) * Math.sin(longitude / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(Math.min(1, haversine)));
  }

  function routeDistanceKm(points) {
    return points.slice(1).reduce((total, point, index) => total + distanceKm(points[index], point), 0);
  }

  function validUrl(value) {
    return typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value);
  }

  function validateSamplePayload(payload) {
    requireSample(payload && payload.schemaVersion === 1 && payload.synthetic === true, 'schema or synthetic identity');
    requireSample(typeof payload.datasetId === 'string' && payload.datasetId.length > 0 && payload.label === label, 'dataset identity');
    requireSample(payload.athlete && typeof payload.athlete.name === 'string' && payload.athlete.name.trim()
      && payload.athlete.region === 'Silicon Valley' && payload.athlete.sportProfile === 'triathlon', 'fictional athlete');
    requireSample(JSON.stringify(payload.years) === JSON.stringify(years), 'represented years');
    requireSample(payload.generation && Number.isInteger(payload.generation.seed)
      && Number.isInteger(payload.generation.version), 'generation metadata');
    requireSample(payload.routes && typeof payload.routes === 'object' && !Array.isArray(payload.routes), 'route dictionary');
    requireSample(Array.isArray(payload.activities) && payload.activities.length >= 1500, 'at least 1500 activities required');
    requireSample(payload.fitBestEffortsByActivityId && typeof payload.fitBestEffortsByActivityId === 'object'
      && !Array.isArray(payload.fitBestEffortsByActivityId), 'power effort dictionary');

    const routeLengths = new Map();
    const routeUses = new Map();
    const patternCounts = { Run: 0, Bike: 0, Swim: 0 };
    for (const [id, route] of Object.entries(payload.routes)) {
      requireSample(route && id === route.id && sports.includes(route.sport)
        && typeof route.name === 'string' && route.name.trim(), 'route identity');
      requireSample(Array.isArray(route.points) && route.points.length >= 2 && route.points.length <= 2000, 'route point count');
      route.points.forEach((point, index) => {
        requireSample(Array.isArray(point) && point.length === 2
          && inRange(point[0], -90, 90) && inRange(point[1], -180, 180), 'route coordinate');
        if (index > 0) requireSample(distanceKm(route.points[index - 1], point) <= 0.0601, 'discontinuous route');
      });
      const length = routeDistanceKm(route.points);
      requireSample(length > 0 && Number.isFinite(route.distanceKm)
        && Math.abs(route.distanceKm - length) / length <= 0.05, 'route distance');
      requireSample(inRange(route.elevationGain, 0, 5000) && (route.sport !== 'Swim' || route.elevationGain === 0), 'route elevation');
      const provenance = route.provenance;
      requireSample(provenance && validUrl(provenance.sourceUrl) && /^\d{4}-\d{2}-\d{2}$/.test(provenance.retrievedAt)
        && typeof provenance.license === 'string' && provenance.license.trim()
        && typeof provenance.attribution === 'string' && provenance.attribution.trim(), 'route provenance');
      if (route.sport === 'Swim') requireSample(validUrl(provenance.swimmingAccessUrl), 'swimming access evidence');
      routeLengths.set(id, length);
      routeUses.set(id, 0);
      patternCounts[route.sport]++;
    }
    requireSample(patternCounts.Run + patternCounts.Bike >= 12 && patternCounts.Swim >= 2, 'route pattern coverage');

    const byYear = new Map(years.map(year => [year, { count: 0, tracks: 0, sports: new Set(),
      trackedSports: new Set(), months: new Set(), days: new Set(), distance: 0, efforts: new Set() }]));
    const byId = new Map();
    const equipment = { Run: new Set(), Bike: new Set() };
    const metricSports = { heartRate: new Set(), cadence: new Set() };
    let trackedCount = 0;
    for (const activity of payload.activities) {
      requireSample(activity && typeof activity.id === 'string' && /^sample-/.test(activity.id) && !byId.has(activity.id), 'unique activity ID');
      requireSample(typeof activity.name === 'string' && activity.name.trim() && sports.includes(activity.sport)
        && activity.sportRaw === activity.sport, 'activity sport or name');
      requireSample(typeof activity.calendarDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(activity.calendarDate), 'calendar date');
      const civilDate = new Date(`${activity.calendarDate}T12:00:00Z`);
      requireSample(Number.isFinite(civilDate.getTime()) && civilDate.toISOString().slice(0, 10) === activity.calendarDate
        && years.includes(civilDate.getUTCFullYear()), 'valid training day');
      requireSample(typeof activity.localStartTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(activity.localStartTime), 'start time');
      requireSample(Number.isFinite(activity.distance) && activity.distance > 0 && Number.isFinite(activity.duration)
        && activity.duration > 0 && activity.distanceAvailable === true && activity.durationAvailable === true, 'distance or duration');
      const speed = activity.distance / activity.duration * 3600;
      const speedBounds = activity.sport === 'Run' ? [5, 22] : activity.sport === 'Bike' ? [8, 50] : [1, 6];
      requireSample(inRange(speed, ...speedBounds), 'sport-specific speed');
      if (activity.avgSpeed !== undefined) requireSample(Number.isFinite(activity.avgSpeed)
        && Math.abs(activity.avgSpeed - speed) / speed <= 0.01, 'mean speed consistency');
      requireSample(activity.avgHeartRate === null || inRange(activity.avgHeartRate, 60, 200), 'heart rate');
      const cadenceBounds = activity.sport === 'Run' ? [110, 220] : [40, 120];
      requireSample(activity.avgCadence === null || (activity.sport !== 'Swim' && inRange(activity.avgCadence, ...cadenceBounds)), 'cadence');
      requireSample(activity.avgWatts === null || (activity.sport === 'Bike' && inRange(activity.avgWatts, 50, 350)), 'mean power');
      requireSample(activity.elevationGain === null || inRange(activity.elevationGain, 0, 5000), 'elevation gain');
      requireSample(activity.totalSteps === null || (activity.sport === 'Run' && Number.isFinite(activity.totalSteps) && activity.totalSteps > 0), 'step count');
      requireSample(typeof activity.equipment === 'string' && ['outdoor', 'indoor', 'pool'].includes(activity.environment)
        && (activity.environment !== 'pool' || activity.sport === 'Swim'), 'equipment or environment');
      const summary = byYear.get(civilDate.getUTCFullYear());
      summary.count++;
      summary.distance += activity.distance;
      summary.sports.add(activity.sport);
      summary.months.add(civilDate.getUTCMonth());
      summary.days.add(activity.calendarDate);
      if (equipment[activity.sport]) equipment[activity.sport].add(activity.equipment);
      if (activity.avgHeartRate !== null) metricSports.heartRate.add(activity.sport);
      if (activity.avgCadence !== null) metricSports.cadence.add(activity.sport);
      if (activity.routeId !== null) {
        requireSample(activity.environment === 'outdoor' && routeLengths.has(activity.routeId), 'route association');
        const route = payload.routes[activity.routeId];
        requireSample(route.sport === activity.sport && Math.abs(activity.distance - routeLengths.get(activity.routeId))
          / routeLengths.get(activity.routeId) <= 0.05, 'activity route length or sport');
        summary.tracks++;
        trackedCount++;
        summary.trackedSports.add(activity.sport);
        routeUses.set(activity.routeId, routeUses.get(activity.routeId) + 1);
      }
      byId.set(activity.id, activity);
    }

    for (const [id, entry] of Object.entries(payload.fitBestEffortsByActivityId)) {
      const activity = byId.get(id);
      requireSample(activity && activity.sport === 'Bike' && entry && Array.isArray(entry.powerEfforts), 'power association');
      const seen = new Set();
      for (const effort of entry.powerEfforts) {
        requireSample(effort && effortDurations.includes(effort.targetSeconds) && !seen.has(effort.targetSeconds)
          && inRange(effort.avgPower, 1, 2000) && Number.isFinite(effort.startSec) && Number.isFinite(effort.endSec)
          && effort.startSec >= 0 && effort.endSec <= activity.duration
          && effort.endSec - effort.startSec === effort.targetSeconds
          && Number.isFinite(effort.startKm) && Number.isFinite(effort.endKm)
          && effort.startKm >= 0 && effort.startKm <= effort.endKm && effort.endKm <= activity.distance, 'power interval');
        seen.add(effort.targetSeconds);
        byYear.get(Number(activity.calendarDate.slice(0, 4))).efforts.add(effort.targetSeconds);
      }
    }
    requireSample(trackedCount >= 600, 'at least 600 tracked activities required');
    for (const [year, summary] of byYear) {
      const daysInYear = new Date(Date.UTC(year + 1, 0, 1)) - new Date(Date.UTC(year, 0, 1));
      requireSample(summary.count >= 250 && summary.tracks >= 100 && summary.months.size === 12
        && summary.sports.size === 3 && summary.trackedSports.size === 3 && summary.days.size < daysInYear / 86400000
        && summary.efforts.size === effortDurations.length, `year ${year} coverage`);
    }
    requireSample(new Set(Array.from(byYear.values(), summary => summary.distance.toFixed(3))).size > 1, 'varied yearly totals');
    requireSample(equipment.Run.size >= 2 && equipment.Bike.size >= 2 && ['Run', 'Bike'].every(sport =>
      metricSports.heartRate.has(sport) && metricSports.cadence.has(sport)), 'equipment and measurement coverage');
    requireSample(Array.from(routeUses).filter(([id, count]) => payload.routes[id].sport !== 'Swim' && count >= 20).length >= 3,
      'repeated training corridors');
    return payload;
  }

  function hydrateSampleDataset(payload) {
    validateSamplePayload(payload);
    const gpsTracksByActivityId = Object.create(null);
    const sharedRoutePoints = new Map();
    const activities = payload.activities.map(serialized => {
      const [year, month, day] = serialized.calendarDate.split('-').map(Number);
      const [hour, minute, second] = serialized.localStartTime.split(':').map(Number);
      const date = new Date(year, month - 1, day);
      const startTime = new Date(year, month - 1, day, hour, minute, second);
      const monday = new Date(year, month - 1, day);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      if (serialized.routeId !== null) {
        const route = payload.routes[serialized.routeId];
        if (!sharedRoutePoints.has(serialized.routeId)) {
          sharedRoutePoints.set(serialized.routeId, Object.freeze(route.points.map(point => Object.freeze(point.slice()))));
        }
        gpsTracksByActivityId[serialized.id] = { sport: serialized.sport, points: sharedRoutePoints.get(serialized.routeId) };
      }
      return { ...serialized, date, startTime, monday };
    });
    return {
      kind: 'tri-activities-v1', importedAt: new Date().toISOString(), sourceLabel: label,
      sourceType: 'sample', sampleProvenance: { datasetId: payload.datasetId, synthetic: true, label },
      rawCsvData: [], activities, gpsTracksByActivityId,
      fitBestEffortsByActivityId: JSON.parse(JSON.stringify(payload.fitBestEffortsByActivityId))
    };
  }

  const sampleDataUtils = { validateSamplePayload, hydrateSampleDataset, routeDistanceKm };
  if (typeof module !== 'undefined' && module.exports) module.exports = sampleDataUtils;
  if (root) root.sampleDataUtils = sampleDataUtils;
})(typeof window !== 'undefined' ? window : null);