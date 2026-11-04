const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const sampleDataUtils = require('../src/sample-data-utils');

function completePayload() {
  const routes = {};
  for (let routeIndex = 0; routeIndex < 14; routeIndex++) {
    const sport = routeIndex < 6 ? 'Run' : routeIndex < 12 ? 'Bike' : 'Swim';
    const points = Array.from({ length: 41 }, (_, pointIndex) => [
      37.4 + routeIndex * 0.002 + pointIndex * 0.00025, -122.1
    ]);
    const id = `route-${routeIndex}`;
    routes[id] = {
      id, name: `Synthetic test corridor ${routeIndex}`, sport, points,
      distanceKm: 6371 * 0.01 * Math.PI / 180, elevationGain: sport === 'Swim' ? 0 : 20,
      provenance: {
        sourceUrl: 'https://example.org/synthetic-test-geometry',
        retrievedAt: '2026-11-02', license: 'CC0-1.0', attribution: 'Synthetic test fixture',
        swimmingAccessUrl: sport === 'Swim' ? 'https://example.org/test-swimming' : null
      }
    };
  }
  const activities = [];
  const fitBestEffortsByActivityId = {};
  for (let year = 2021; year <= 2025; year++) {
    for (let session = 0; session < 300; session++) {
      const sport = ['Run', 'Bike', 'Swim'][session % 3];
      const date = new Date(Date.UTC(year, 0, 1 + Math.floor(session * 1.2)));
      const routeIndex = sport === 'Run' ? Math.floor(session / 3) % 6
        : sport === 'Bike' ? 6 + Math.floor(session / 3) % 6 : 12 + Math.floor(session / 3) % 2;
      const route = routes[`route-${routeIndex}`];
      const indoor = session % 7 === 0 || (sport === 'Bike' && session === 1);
      const distance = indoor ? (sport === 'Bike' ? 30 + year - 2021 : 2 + (year - 2021) / 10) : route.distanceKm;
      const speed = sport === 'Run' ? 10 : sport === 'Bike' ? 25 : 3;
      const id = `sample-${year}-${session}`;
      const duration = distance / speed * 3600;
      activities.push({
        id, name: `${sport} test ${session}`, sport, sportRaw: sport,
        calendarDate: date.toISOString().slice(0, 10), localStartTime: '07:30:00',
        distance, duration, distanceAvailable: true, durationAvailable: true,
        avgHeartRate: 140, avgCadence: sport === 'Run' ? 170 : sport === 'Bike' ? 85 : null,
        avgWatts: sport === 'Bike' ? 180 : null, elevationGain: route.elevationGain,
        totalSteps: null, equipment: `${sport} ${year < 2023 ? 'A' : 'B'}`,
        environment: indoor ? (sport === 'Swim' ? 'pool' : 'indoor') : 'outdoor',
        routeId: indoor ? null : route.id
      });
      if (sport === 'Bike') {
        fitBestEffortsByActivityId[id] = { powerEfforts: [5, 30, 60, 120, 300, 600, 1200, 3600]
          .filter(targetSeconds => targetSeconds <= duration)
          .map(targetSeconds => ({ targetSeconds, avgPower: 180, startSec: 0,
            endSec: targetSeconds, startKm: 0, endKm: distance * targetSeconds / duration })) };
      }
    }
  }
  return {
    schemaVersion: 1, datasetId: 'silicon-valley-triathlete-v1', synthetic: true,
    label: 'Synthetic sample training data',
    athlete: { name: 'Example Athlete', region: 'Silicon Valley', sportProfile: 'triathlon' },
    years: [2021, 2022, 2023, 2024, 2025], generation: { seed: 76, version: 1 },
    routes, activities, fitBestEffortsByActivityId
  };
}

describe('sample training data contract', () => {
  it('validates a complete history without modifying its input', () => {
    const payload = completePayload();
    const before = JSON.stringify(payload);
    expect(sampleDataUtils.validateSamplePayload(payload)).toBe(payload);
    expect(JSON.stringify(payload)).toBe(before);
  });

  it.each([
    ['unsupported version', payload => { payload.schemaVersion = 2; }],
    ['partial history', payload => { payload.activities = payload.activities.slice(0, 30); }],
    ['missing year', payload => { payload.activities = payload.activities.filter(activity => !activity.calendarDate.startsWith('2025')); }],
    ['duplicate ID', payload => { payload.activities[1].id = payload.activities[0].id; }],
    ['impossible date', payload => { payload.activities[0].calendarDate = '2021-02-30'; }],
    ['invalid sport', payload => { payload.activities[0].sport = 'Other'; }],
    ['missing optional value', payload => { delete payload.activities[0].avgHeartRate; }],
    ['implausible heart rate', payload => { payload.activities[0].avgHeartRate = 999; }],
    ['implausible speed', payload => { payload.activities[0].duration = 1; }],
    ['implausible cadence', payload => { payload.activities[0].avgCadence = 400; }],
    ['indoor GPS', payload => { payload.activities[0].routeId = 'route-0'; }],
    ['discontinuous geometry', payload => { payload.routes['route-0'].points[1][0] += 1; }],
    ['unlicensed geometry', payload => { payload.routes['route-0'].provenance.license = ''; }],
    ['out-of-range effort', payload => { Object.values(payload.fitBestEffortsByActivityId)[0].powerEfforts[0].endSec = 999999; }],
    ['dangling effort', payload => { payload.fitBestEffortsByActivityId.missing = { powerEfforts: [] }; }]
  ])('rejects %s before hydration', (label, mutate) => {
    const payload = completePayload();
    mutate(payload);
    expect(() => sampleDataUtils.validateSamplePayload(payload)).toThrow();
    expect(() => sampleDataUtils.hydrateSampleDataset(payload)).toThrow();
  });

  it('hydrates fresh dates, associations and provenance, retaining missing measurements', () => {
    const payload = completePayload();
    payload.activities[0].avgHeartRate = null;
    const dataset = sampleDataUtils.hydrateSampleDataset(payload);
    expect(dataset.kind).toBe('tri-activities-v1');
    expect(dataset.sourceType).toBe('sample');
    expect(dataset.sampleProvenance.label).toBe(payload.label);
    expect(dataset.activities).toHaveLength(1500);
    expect(dataset.activities[0].date).toBeInstanceOf(Date);
    expect(dataset.activities[0].date.getFullYear()).toBe(2021);
    expect(dataset.activities[0].startTime.getHours()).toBe(7);
    expect(dataset.activities[0].monday.getDay()).toBe(1);
    expect(dataset.activities[0].avgHeartRate).toBeNull();
    expect(dataset.gpsTracksByActivityId[dataset.activities[0].id]).toBeUndefined();
    const outdoor = dataset.activities.find(activity => activity.routeId);
    const repeat = dataset.activities.find(activity => activity.id !== outdoor.id && activity.routeId === outdoor.routeId);
    expect(dataset.gpsTracksByActivityId[outdoor.id].points).toBe(dataset.gpsTracksByActivityId[repeat.id].points);
    expect(Object.isFrozen(dataset.gpsTracksByActivityId[outdoor.id].points)).toBe(true);
    dataset.gpsTracksByActivityId[outdoor.id].points[0][0] = 0;
    expect(payload.routes[outdoor.routeId].points[0][0]).not.toBe(0);
  });

  it.each(['UTC', 'America/Los_Angeles', 'Europe/Berlin'])('preserves local days in %s', timezone => {
    const output = execFileSync(process.execPath, ['-e', `
      const fs = require('fs');
      const {hydrateSampleDataset} = require('./src/sample-data-utils');
      const dataset = hydrateSampleDataset(JSON.parse(fs.readFileSync(0, 'utf8')));
      console.log(JSON.stringify(dataset.activities.map(activity => [
        activity.date.getFullYear(), activity.date.getMonth() + 1, activity.date.getDate(),
        activity.startTime.getHours(), activity.startTime.getMinutes(), activity.monday.getDay()
      ])));
    `], { cwd: path.join(__dirname, '..'), env: { ...process.env, TZ: timezone }, input: JSON.stringify(completePayload()) });
    const dates = JSON.parse(output.toString());
    completePayload().activities.forEach((activity, index) => {
      expect(dates[index]).toEqual([...activity.calendarDate.split('-').map(Number), 7, 30, 1]);
    });
  });

  it('exposes an isolated browser bridge without global redeclarations', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/sample-data-utils.js'), 'utf8');
    const context = { window: {} };
    vm.runInNewContext(`${source}\n${source}`, context);
    expect(typeof context.window.sampleDataUtils.hydrateSampleDataset).toBe('function');
  });
});

describe('bundled Silicon Valley training history', () => {
  it('is reproducible and populates every non-media visualization', () => {
    const { generateSampleData } = require('../scripts/generate-sample-data');
    const routes = require('../sample-data/routes.json');
    const payload = generateSampleData(routes);
    expect(JSON.stringify(generateSampleData(routes))).toBe(JSON.stringify(payload));
    expect(sampleDataUtils.validateSamplePayload(payload)).toBe(payload);
    expect(payload.activities.length).toBeGreaterThanOrEqual(1500);
    const dataset = sampleDataUtils.hydrateSampleDataset(payload);
    const availability = require('../src/visualization-availability').getVisualizationAvailability(dataset.activities, dataset);
    expect(Object.entries(availability).filter(([name]) => name !== 'mediaGallery').every(([, available]) => available)).toBe(true);
    expect(availability.mediaGallery).toBe(false);
    const equipmentUtils = require('../src/equipment-utils');
    const shoeEquipment = equipmentUtils.aggregateEquipmentDistance(dataset.activities, 'Shoes');
    const bikeEquipment = equipmentUtils.aggregateEquipmentDistance(dataset.activities, 'Bikes');
    expect(shoeEquipment.map(([name]) => name)).toEqual(expect.arrayContaining([
      'Coast Road Shoes', 'Peninsula Road Shoes', 'Hoka Speedgoat Trail Shoes'
    ]));
    expect(bikeEquipment.map(([name]) => name)).toEqual(expect.arrayContaining([
      'Foothills Road Bike', 'Bay Endurance Bike', 'Santa Cruz Mountain Bike'
    ]));
    expect(equipmentUtils.aggregateEquipmentTimeline(dataset.activities).length).toBeGreaterThanOrEqual(6);
    const runActivities = dataset.activities.filter(activity => activity.sport === 'Run');
    const trailShoeActivities = runActivities.filter(activity => activity.equipment === 'Hoka Speedgoat Trail Shoes');
    expect(trailShoeActivities.length).toBeGreaterThan(0);
    expect(trailShoeActivities.length).toBeLessThan(runActivities.length * 0.1);
    expect(new Set(trailShoeActivities.map(activity => activity.calendarDate.slice(0, 4))).size).toBeLessThan(5);
    for (const year of payload.years) {
      const yearActivities = payload.activities.filter(activity => activity.calendarDate.startsWith(String(year)));
      const monthlyDistance = Array.from({ length: 12 }, (_, month) => yearActivities
        .filter(activity => Number(activity.calendarDate.slice(5, 7)) === month + 1)
        .reduce((total, activity) => total + activity.distance, 0));
      expect(Math.max(...monthlyDistance)).toBeGreaterThan(Math.min(...monthlyDistance) * 1.15);
    }
    const recoveryDates = [...new Set(payload.activities
      .filter(activity => activity.calendarDate.startsWith('2023'))
      .map(activity => activity.calendarDate))].sort();
    const longestGap = recoveryDates.slice(1).reduce((longest, date, index) => Math.max(longest,
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${recoveryDates[index]}T00:00:00Z`)) / 86400000), 0);
    expect(longestGap).toBeGreaterThanOrEqual(10);
    expect(dataset.activities.filter(activity => activity.sport === 'Swim')
      .every(activity => activity.avgWatts === null && activity.avgCadence === null)).toBe(true);
    for (const year of payload.years) {
      const efforts = dataset.activities.filter(activity => activity.sport === 'Bike' && activity.date.getFullYear() === year)
        .flatMap(activity => dataset.fitBestEffortsByActivityId[activity.id]?.powerEfforts || []);
      expect(Array.from(new Set(efforts.map(effort => effort.targetSeconds))).sort((left, right) => left - right))
        .toEqual([5, 30, 60, 120, 300, 600, 1200, 3600]);
    }
    expect(Buffer.byteLength(JSON.stringify(payload))).toBeLessThanOrEqual(4 * 1024 * 1024);
  });

  it('ships the same payload the offline generator produces', () => {
    const { generateSampleData } = require('../scripts/generate-sample-data');
    expect(require('../sample-data/silicon-valley-training.json')).toEqual(generateSampleData(require('../sample-data/routes.json')));
  });
});