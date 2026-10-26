const fs = require('fs');
const path = require('path');
const vm = require('vm');
const visualizationAvailability = require('../src/visualization-availability');

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
