const fs = require('fs');
const path = require('path');
const vm = require('vm');
const visualizationAvailability = require('../src/visualization-availability');
const appleHealthImporter = require('../src/apple-health-importer');
const appleHealthFixtures = require('./fixtures/apple-health');
const appleHealthDependencies = {
  zip: require('@zip.js/zip.js/index-native.js'),
  sax: require('sax'),
  hash: async value => require('crypto').createHash('sha256').update(value).digest('hex')
};

function createActivity(overrides = {}) {
  return {
    id: 'run-1',
    date: new Date('2025-03-01T08:00:00Z'),
    startTime: new Date('2025-03-01T08:00:00Z'),
    sport: 'Run',
    distance: 5,
    duration: 1500,
    equipment: 'Nike Road Shoe',
    name: 'Morning Forest Run',
    elevationGain: 120,
    avgHeartRate: 148,
    ...overrides
  };
}

describe('visualization availability', () => {
  it('uses resolved field evidence without changing average-supported views or requiring pairs', () => {
    const heartRate = require('../src/heart-rate-utils');
    const missing = heartRate.inspectCsvHeartRateExtrema([], []);
    const records = [{ timestamp: new Date('2026-07-19T10:00:00Z'), heart_rate: 80 }];
    const readEvidence = { readStatus: 'complete', lengthValidated: true, integrityValidated: true, strictParseCompleted: true,
      recordsComplete: true, resourceLimited: false, unit: 'bpm' };
    const observed = heartRate.deriveTimedHeartRateExtrema(records, { qualified: true, readEvidence });
    const unqualified = heartRate.deriveTimedHeartRateExtrema(records, { qualified: false, reason: 'overlapping_sessions', readEvidence });
    const cases = [
      [heartRate.resolveHeartRateExtrema(heartRate.inspectCsvHeartRateExtrema(['Max. Herzfrequenz'], ['180'])), true],
      [heartRate.resolveHeartRateExtrema(heartRate.inspectCsvHeartRateExtrema(['Min Heart Rate'], ['75'])), true],
      [heartRate.resolveHeartRateExtrema(missing, observed), true],
      [heartRate.resolveHeartRateExtrema(missing), false],
      [heartRate.resolveHeartRateExtrema(heartRate.inspectCsvHeartRateExtrema(['Max. Herzfrequenz', 'Max. Herzfrequenz'], ['180', '190'])), false],
      [heartRate.resolveHeartRateExtrema(missing, unqualified), false]
    ];
    const { heartRate: oldEligibility, ...otherViews } = visualizationAvailability.getVisualizationAvailability([createActivity()]);
    for (const [fields, expected] of cases) {
      const { heartRate: eligibility, ...unchanged } = visualizationAvailability.getVisualizationAvailability([createActivity(fields)]);
      expect(eligibility).toBe(expected);
      expect(unchanged).toEqual(otherViews);
    }
  });

  it('makes heartRate available for exactly one valid extremum independently of the source label', () => {
    for (const sourceLabel of ['Strava ZIP import', 'TrainingPeaks ZIP import', 'Apple Health ZIP import']) {
      expect(visualizationAvailability.getVisualizationAvailability([createActivity()], { sourceLabel }).heartRate).toBe(false);
      expect(visualizationAvailability.getVisualizationAvailability([createActivity({ minHeartRate: 75 })], { sourceLabel }).heartRate).toBe(true);
      expect(visualizationAvailability.getVisualizationAvailability([createActivity({ maxHeartRate: 180 })], { sourceLabel }).heartRate).toBe(true);
      expect(visualizationAvailability.getVisualizationAvailability([createActivity({ minHeartRate: 180, maxHeartRate: 150 })], { sourceLabel }).heartRate).toBe(false);
    }
  });

  it('loads as a classic script beside utilities with shared global names', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/visualization-availability.js'), 'utf8');
    const browserWindow = {
      scatterUtils: {}, equipmentUtils: {}, heatmapUtils: {}, distributionUtils: {},
      workoutTimeUtils: {}, trainingCalendarUtils: {}, wordcloudUtils: {},
      pieChartUtils: {}, lifetimeStatisticsUtils: {}
    };
    const context = { window: browserWindow };
    vm.createContext(context);

    expect(() => vm.runInContext(`const SUPPORTED_SPORTS = ['Run'];\n${source}`, context)).not.toThrow();
    expect(typeof browserWindow.visualizationAvailability.getVisualizationAvailability).toBe('function');
  });

  it('marks every view unavailable when no imported activity can produce output', () => {
    expect(visualizationAvailability.getVisualizationAvailability([], {})).toEqual({
      totalDistance: false,
      paceMetrics: false,
      heartRate: false,
      equipment: false,
      equipmentTimeline: false,
      personalBests: false,
      heatmap: false,
      distributions: false,
      workoutTime: false,
      trainingCalendar: false,
      wordcloud: false,
      pieCharts: false,
      lifetimeStatistics: false,
      mediaGallery: false
    });
  });

  it('derives all view visibility from a normalized Apple Health import with missing optional data', async () => {
    const xml = appleHealthFixtures.healthXml(
      appleHealthFixtures.workout({}, appleHealthFixtures.statistic())
    );
    const file = await appleHealthFixtures.archive({ 'nested/apple_health_export/Export.xml': xml });
    const imported = await appleHealthImporter.importAppleHealthZip(file, undefined, appleHealthDependencies);
    const availability = visualizationAvailability.getVisualizationAvailability(imported.activities, {
      gpsTracksByActivityId: imported.gpsTracksByActivityId,
      fitBestEffortsByActivityId: imported.fitBestEffortsByActivityId
    });

    expect(availability).toEqual({
      totalDistance: true,
      paceMetrics: true,
      heartRate: false,
      equipment: false,
      equipmentTimeline: false,
      personalBests: true,
      heatmap: false,
      distributions: true,
      workoutTime: true,
      trainingCalendar: true,
      wordcloud: false,
      pieCharts: true,
      lifetimeStatistics: true,
      mediaGallery: false
    });
  });

  it.each([
    ['missing', appleHealthFixtures.workout(), false],
    ['measured zero', appleHealthFixtures.workout({}, appleHealthFixtures.statistic('DistanceWalkingRunning', '0', 'km')), true],
    ['invalid', appleHealthFixtures.workout({}, appleHealthFixtures.statistic('DistanceWalkingRunning', '-5', 'km')), false]
  ])('does not expose distance-dependent views for %s Apple Health distance', async (label, workout, distanceAvailable) => {
    const file = await appleHealthFixtures.archive({
      'nested/apple_health_export/Export.xml': appleHealthFixtures.healthXml(workout)
    });
    const imported = await appleHealthImporter.importAppleHealthZip(file, undefined, appleHealthDependencies);
    const availability = visualizationAvailability.getVisualizationAvailability(imported.activities, {
      gpsTracksByActivityId: imported.gpsTracksByActivityId,
      fitBestEffortsByActivityId: imported.fitBestEffortsByActivityId
    });

    expect(imported.activities[0]).toMatchObject({ distance: 0, distanceAvailable });
    expect(availability).toEqual({
      totalDistance: false,
      paceMetrics: false,
      heartRate: false,
      equipment: false,
      equipmentTimeline: false,
      personalBests: false,
      heatmap: false,
      distributions: true,
      workoutTime: true,
      trainingCalendar: true,
      wordcloud: false,
      pieCharts: true,
      lifetimeStatistics: true,
      mediaGallery: false
    });
  });

  it('hides every metric-dependent view when a valid imported workout has no distance or duration', async () => {
    const file = await appleHealthFixtures.archive({
      'nested/apple_health_export/Export.xml': appleHealthFixtures.healthXml(
        appleHealthFixtures.workout({ duration: undefined })
      )
    });
    const imported = await appleHealthImporter.importAppleHealthZip(file, undefined, appleHealthDependencies);
    const availability = visualizationAvailability.getVisualizationAvailability(imported.activities, {
      gpsTracksByActivityId: imported.gpsTracksByActivityId,
      fitBestEffortsByActivityId: imported.fitBestEffortsByActivityId
    });

    expect(imported.activities[0]).toMatchObject({ distance: 0, distanceAvailable: false, duration: 0, durationAvailable: false });
    expect(availability).toEqual({
      totalDistance: false,
      paceMetrics: false,
      heartRate: false,
      equipment: false,
      equipmentTimeline: false,
      personalBests: false,
      heatmap: false,
      distributions: false,
      workoutTime: true,
      trainingCalendar: true,
      wordcloud: false,
      pieCharts: true,
      lifetimeStatistics: true,
      mediaGallery: false
    });
  });

  it('derives availability from valid model output rather than source labels or field names', () => {
    const activity = createActivity();
    const activities = [activity];
    const originalActivities = structuredClone(activities);
    const availability = visualizationAvailability.getVisualizationAvailability(activities, {
      sourceLabel: 'TrainingPeaks ZIP import',
      gpsTracksByActivityId: {}
    });

    expect(availability).toEqual({
      totalDistance: true,
      paceMetrics: true,
      heartRate: false,
      equipment: true,
      equipmentTimeline: true,
      personalBests: true,
      heatmap: false,
      distributions: true,
      workoutTime: true,
      trainingCalendar: true,
      wordcloud: true,
      pieCharts: true,
      lifetimeStatistics: true,
      mediaGallery: false
    });
    expect(activities).toEqual(originalActivities);
  });

  it('keeps equipment views unavailable when equipment labels are missing', () => {
    const availability = visualizationAvailability.getVisualizationAvailability([
      createActivity({ equipment: '' })
    ], {});

    expect(availability.equipment).toBe(false);
    expect(availability.equipmentTimeline).toBe(false);
    expect(availability.totalDistance).toBe(true);
  });

  it('uses equivalent readiness for equivalent Strava and TrainingPeaks data', () => {
    const activities = [createActivity()];
    const strava = visualizationAvailability.getVisualizationAvailability(activities, {
      sourceLabel: 'Imported Strava history'
    });
    const trainingPeaks = visualizationAvailability.getVisualizationAvailability(activities, {
      sourceLabel: 'TrainingPeaks ZIP import'
    });

    expect(trainingPeaks).toEqual(strava);
  });

  it('hides only views whose required fields are absent from the current source import', () => {
    const strava = visualizationAvailability.getVisualizationAvailability([
      createActivity({ equipment: 'Road shoe', avgHeartRate: 148 })
    ], { sourceLabel: 'Imported Strava history' });
    const trainingPeaks = visualizationAvailability.getVisualizationAvailability([
      createActivity({ equipment: '', avgHeartRate: null })
    ], { sourceLabel: 'TrainingPeaks ZIP import' });

    expect(strava.equipment).toBe(true);
    expect(trainingPeaks.equipment).toBe(false);
    expect(strava.totalDistance).toBe(true);
    expect(trainingPeaks.totalDistance).toBe(true);
  });

  it('requires route segments and start times for heatmap and workout-time views', () => {
    const activity = createActivity({ startTime: null });
    const availability = visualizationAvailability.getVisualizationAvailability([activity], {
      gpsTracksByActivityId: {
        'run-1': { sport: 'Run', points: [[48.1, 11.5], [48.105, 11.5]] }
      }
    });

    expect(availability.heatmap).toBe(true);
    expect(availability.workoutTime).toBe(false);
    expect(availability.trainingCalendar).toBe(true);
  });

  it('shows the media gallery only when a readable media library is available', () => {
    const activities = [createActivity()];

    expect(visualizationAvailability.getVisualizationAvailability(activities, {
      mediaLibrary: { hasReadableMedia: true }
    }).mediaGallery).toBe(true);
    expect(visualizationAvailability.getVisualizationAvailability(activities, {
      mediaLibrary: { hasReadableMedia: false }
    }).mediaGallery).toBe(false);
    expect(visualizationAvailability.getVisualizationAvailability(activities, {
      sourceLabel: 'TrainingPeaks ZIP import', mediaLibrary: { hasReadableMedia: true }
    }).mediaGallery).toBe(false);
  });
});
