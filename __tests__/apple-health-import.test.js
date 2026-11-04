const fs = require('fs');
const path = require('path');
const vm = require('vm');
const utils = require('../src/apple-health-utils');
const importer = require('../src/apple-health-importer');
const fixtures = require('./fixtures/apple-health');
const zip = require('@zip.js/zip.js/index-native.js');
const sax = require('sax');
const dependencies = { zip, sax, hash: async text => require('crypto').createHash('sha256').update(text).digest('hex') };

describe('Apple Health foundation', () => {
  test('exposes reusable namespaces without a DOM or window', () => {
    const context = vm.createContext({ TextEncoder, TextDecoder, URL, console });
    for (const name of ['apple-health-utils.js', 'apple-health-importer.js']) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context);
    }
    expect(typeof context.appleHealthUtils.parseTimestamp).toBe('function');
    expect(typeof context.appleHealthImporter.importAppleHealthZip).toBe('function');
  });

  test('rejects loose numbers and unknown units without losing measured zero', () => {
    expect(utils.quantity('0', 'm', 'distance')).toBe(0);
    expect(utils.quantity('1000', 'm', 'distance')).toBe(1);
    expect(utils.quantity('4 apples', 'km', 'distance')).toBeNull();
    expect(utils.quantity('4', 'unknown', 'distance')).toBeNull();
    expect(utils.quantity(null, 'km', 'distance')).toBeNull();
    expect(utils.quantity('-1', 'km', 'distance')).toBeNull();
  });

  test('retains the instant and explicit source-local components', () => {
    const parsed = utils.parseTimestamp('2025-03-01 00:30:00 +0200');
    expect(parsed.instant.toISOString()).toBe('2025-02-28T22:30:00.000Z');
    expect(parsed.local).toMatchObject({ year: 2025, month: 3, day: 1, hour: 0, minute: 30, offsetMinutes: 120 });
    expect(utils.parseTimestamp('2025-02-30 08:00:00 +0100')).toBeNull();
  });

  test('has centralized limits and safe errors', async () => {
    expect(importer.LIMITS.mainBytes).toBe(8 * 1024 ** 3);
    expect(importer.LIMITS.directoryBytes).toBe(32 * 1024 ** 2);
    const error = utils.failure('INVALID_XML');
    expect(error.code).toBe('INVALID_XML');
    expect(error.message).not.toContain('<');
    await expect(importer.importAppleHealthZip(null)).rejects.toMatchObject({ code: 'INVALID_ARCHIVE' });
  });
});

describe('Apple Health original archive import', () => {
  async function importContents(contents, entries = {}, options = {}) {
    const file = await fixtures.archive({ 'nested/apple_health_export/Export.xml': fixtures.healthXml(contents), ...entries });
    return importer.importAppleHealthZip(file, undefined, { ...dependencies, ...options });
  }

  test('normalizes only explicit supported workouts and preserves absent measurements', async () => {
    const result = await importContents(fixtures.workout({}, fixtures.statistic()) +
      fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeCycling' }, fixtures.statistic('DistanceCycling', 10000, 'm')) +
      fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeSwimming' }, fixtures.statistic('DistanceSwimming', 500, 'm')) +
      fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeWalking' }, fixtures.statistic()));
    expect(result.activities.map(activity => activity.sport).sort()).toEqual(['Bike', 'Run', 'Swim']);
    const run = result.activities.find(activity => activity.sport === 'Run');
    expect(run).toMatchObject({ distance: 5, duration: 1800, distanceAvailable: true, durationAvailable: true,
      avgHeartRate: null, avgWatts: null, avgCadence: null, equipment: '', name: 'Activity' });
    expect(run.date).toBeInstanceOf(Date);
    expect(result.diagnostics.unsupportedBySport.HKWorkoutActivityTypeWalking).toBe(1);
    expect(result.mediaLibrary).toBeUndefined();
  });

  test('does not duplicate complete identities but preserves missing-source candidates', async () => {
    const complete = fixtures.workout({}, fixtures.statistic());
    const incomplete = fixtures.workout({ sourceName: undefined }, fixtures.statistic());
    const result = await importContents(complete + complete + incomplete + incomplete);
    expect(result.activities).toHaveLength(3);
    expect(result.diagnostics.duplicateCount).toBe(1);
    expect(new Set(result.activities.map(activity => activity.id)).size).toBe(3);
  });

  test('reimporting identical archive bytes preserves normalized identities and totals', async () => {
    const file = await fixtures.archive({
      'nested/apple_health_export/Export.xml': fixtures.healthXml(
        fixtures.workout({}, fixtures.statistic()) +
        fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeCycling',
          startDate: '2025-03-02 08:00:00 +0100', endDate: '2025-03-02 08:30:00 +0100' },
        fixtures.statistic('DistanceCycling', '12', 'km'))
      )
    });
    const first = await importer.importAppleHealthZip(file, undefined, dependencies);
    const second = await importer.importAppleHealthZip(file, undefined, dependencies);
    const summarize = result => ({
      ids: result.activities.map(activity => activity.id),
      sports: result.activities.map(activity => activity.sport),
      distanceKm: result.activities.reduce((sum, activity) => sum + activity.distance, 0),
      durations: result.activities.map(activity => activity.duration),
      duplicates: result.diagnostics.duplicateCount
    });

    expect(summarize(second)).toEqual(summarize(first));
  });

  test.each([
    ['missing source scope', { sourceName: undefined }],
    ['missing duration', { duration: undefined }],
    ['invalid duration unit', { durationUnit: 'fortnights' }]
  ])('does not fingerprint-deduplicate candidates with %s', async (_label, overrides) => {
    const incomplete = fixtures.workout(overrides, fixtures.statistic());
    const result = await importContents(incomplete + incomplete);

    expect(result.activities).toHaveLength(2);
    expect(result.diagnostics.duplicateCount).toBe(0);
  });

  test('keeps missing and measured-zero distance identities distinct while deduplicating each complete copy', async () => {
    const missing = fixtures.workout();
    const measuredZero = fixtures.workout({}, fixtures.statistic('DistanceWalkingRunning', '0', 'km'));
    const result = await importContents(missing + missing + measuredZero + measuredZero);

    expect(result.activities).toHaveLength(2);
    expect(result.diagnostics.duplicateCount).toBe(2);
    expect(result.activities.map(activity => activity.distanceAvailable).sort()).toEqual([false, true]);
  });

  test('keeps conflicting payloads with the same scoped external workout identifier distinct', async () => {
    const first = fixtures.workout({}, `${fixtures.statistic()}<MetadataEntry key="HKExternalUUID" value="stable-id"/>`);
    const second = fixtures.workout({}, `${fixtures.statistic('DistanceWalkingRunning', '6', 'km')}<MetadataEntry key="HKExternalUUID" value="stable-id"/>`);
    const result = await importContents(first + second);

    expect(result.activities).toHaveLength(2);
    expect(result.diagnostics.identityConflictCount).toBe(1);
    expect(new Set(result.activities.map(activity => activity.id)).size).toBe(2);
  });

  test('skips invalid core timestamps and excludes unsupported sports rather than reclassifying them', async () => {
    const valid = fixtures.workout({}, fixtures.statistic());
    const missingStart = fixtures.workout({ startDate: undefined }, fixtures.statistic());
    const reversedTime = fixtures.workout({ startDate: '2025-03-01 09:00:00 +0100' }, fixtures.statistic());
    const unknownSport = fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeWalking' }, fixtures.statistic());
    const result = await importContents(valid + missingStart + reversedTime + unknownSport);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].sport).toBe('Run');
    expect(result.diagnostics.invalidWorkoutCount).toBe(2);
    expect(result.diagnostics.unsupportedBySport.HKWorkoutActivityTypeWalking).toBe(1);
  });

  test('prefers workout statistics, converts ascent and distinguishes zero from absent', async () => {
    const result = await importContents(fixtures.workout({ totalDistance: '99', totalDistanceUnit: 'km' },
      fixtures.statistic('DistanceWalkingRunning', '0') + '<MetadataEntry key="HKElevationAscended" value="2500 cm"/>'));
    expect(result.activities[0]).toMatchObject({ distance: 0, distanceAvailable: true, elevationGain: 25 });
    const missing = await importContents(fixtures.workout());
    expect(missing.activities[0]).toMatchObject({ distance: 0, distanceAvailable: false });
  });

  test('associates pulse only from an unambiguous exact source inside the workout', async () => {
    const result = await importContents(fixtures.record('HeartRate', '140') + fixtures.record('HeartRate', '160', {
      startDate: '2025-03-01 08:15:00 +0100', endDate: '2025-03-01 08:15:00 +0100'
    }) + fixtures.record('HeartRate', '220', { sourceName: 'Unrelated' }) + fixtures.workout({}, fixtures.statistic()));
    expect(result.activities[0].avgHeartRate).toBe(150);
  });

  function runStepInterval(startMinute, endMinute, device) {
    const format = minute => `2025-03-01 08:${String(minute).padStart(2, '0')}:00 +0100`;
    return fixtures.record('StepCount', '80', { unit: 'count', sourceName: 'Synthetic Watch', device,
      startDate: format(startMinute), endDate: format(endMinute) });
  }

  test('derives run steps and cadence only from complete nonoverlapping intervals', async () => {
    const records = Array.from({ length: 30 }, (_unused, minute) => runStepInterval(minute, minute + 1, 'Wrist Device')).join('');
    const result = await importContents(records + fixtures.workout({}, fixtures.statistic()));

    expect(result.activities[0]).toMatchObject({ totalSteps: 2400, avgCadence: 80 });
  });

  test('does not combine overlapping run-step samples from competing devices', async () => {
    const records = Array.from({ length: 30 }, (_unused, minute) =>
      runStepInterval(minute, minute + 1, 'First Device') + runStepInterval(minute, minute + 1, 'Second Device')).join('');
    const result = await importContents(records + fixtures.workout({}, fixtures.statistic()));

    expect(result.activities[0]).toMatchObject({ totalSteps: null, avgCadence: null });
    expect(result.diagnostics.unavailableByMetricAndReason['steps:ambiguousOrIncomplete']).toBe(1);
  });

  function cyclingPowerRecord(seconds, value = 220) {
    const time = `2025-03-01 08:00:${String(seconds).padStart(2, '0')} +0100`;
    return fixtures.record('CyclingPower', String(value), { unit: 'W', startDate: time, endDate: time });
  }

  function cyclingWorkout(powerAverage = null, overrides = {}) {
    const powerSummary = powerAverage === null ? ''
      : fixtures.statistic('CyclingPower', String(powerAverage), 'W', { average: String(powerAverage) });
    return fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeCycling', ...overrides },
      fixtures.statistic('DistanceCycling', '30', 'km') + powerSummary);
  }

  test('retains the source average and derives power best efforts from a complete series', async () => {
    const contents = Array.from({ length: 31 }, (_unused, seconds) => cyclingPowerRecord(seconds, 220 + seconds)).join('') +
      cyclingWorkout(180);
    const result = await importContents(contents);
    const activity = result.activities[0];
    const efforts = result.fitBestEffortsByActivityId[activity.id]?.powerEfforts || [];

    expect(activity.avgWatts).toBe(180);
    expect(efforts.find(effort => effort.targetSeconds === 5)).toMatchObject({
      targetSeconds: 5, avgPower: 248, startSec: 26, endSec: 30, startKm: null, endKm: null
    });
  });

  test('derives both average power and efforts when a complete series has no summary', async () => {
    const contents = Array.from({ length: 31 }, (_unused, seconds) => cyclingPowerRecord(seconds, 220)).join('') +
      cyclingWorkout(null, { duration: '30', durationUnit: 's', endDate: '2025-03-01 08:00:30 +0100' });
    const result = await importContents(contents);
    const activity = result.activities[0];

    expect(activity.avgWatts).toBe(220);
    expect(result.fitBestEffortsByActivityId[activity.id].powerEfforts.some(effort => effort.targetSeconds === 5)).toBe(true);
  });

  test('does not create power efforts from an average without a timed series', async () => {
    const result = await importContents(cyclingWorkout(180));

    expect(result.activities[0].avgWatts).toBe(180);
    expect(result.fitBestEffortsByActivityId).toEqual({});
  });

  test('rejects gapped timed power samples for best-effort output', async () => {
    const contents = [0, 30, 60].map(seconds => cyclingPowerRecord(seconds)).join('') + cyclingWorkout(180);
    const result = await importContents(contents);

    expect(result.activities[0].avgWatts).toBe(180);
    expect(result.fitBestEffortsByActivityId).toEqual({});
  });

  test('does not derive a workout average from a partial power series', async () => {
    const contents = [0, 30, 60].map(seconds => cyclingPowerRecord(seconds)).join('') + cyclingWorkout();
    const result = await importContents(contents);

    expect(result.activities[0].avgWatts).toBeNull();
    expect(result.fitBestEffortsByActivityId).toEqual({});
  });

  test('keeps clinical/profile records out of the result and never opens the clinical copy', async () => {
    const result = await importContents('<Me HKCharacteristicTypeIdentifierBloodType="private-value"/>' +
      fixtures.record('BodyMass', '70', { unit: 'kg' }) + fixtures.workout({}, fixtures.statistic()),
    { 'nested/apple_health_export/export_cda.xml': 'not XML and must not be opened' });
    expect(JSON.stringify(result)).not.toContain('private-value');
    expect(result.activities).toHaveLength(1);
    expect(result.diagnostics.ignoredRecordTypes.HKQuantityTypeIdentifierBodyMass).toBe(1);
  });

  test('discards clinical, profile, sleep, recovery and daily records with bounded diagnostics', async () => {
    const privateMarkers = ['profile-private-marker', 'ecg-private-marker', 'sleep-private-marker', 'recovery-private-marker'];
    const records = [
      fixtures.record('BodyMass', '70', { unit: 'kg' }),
      fixtures.record('ActiveEnergyBurned', '500', { unit: 'kcal' }),
      fixtures.record('HeartRateVariabilitySDNN', '42', { unit: 'ms' }),
      `<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="asleep" sourceName="Synthetic Watch" startDate="2025-03-01 08:00:00 +0100" endDate="2025-03-01 08:10:00 +0100"/>`,
      fixtures.record('SyntheticRecoveryScore', '88', { unit: 'count' })
    ].join('');
    const unknownRecords = Array.from({ length: 140 }, (_unused, index) =>
      fixtures.record(`SyntheticUnknown${String(index).padStart(3, '0')}`, '1', { unit: 'count' })).join('');
    const clinicalContent = `<Me HKCharacteristicTypeIdentifierBiologicalSex="${privateMarkers[0]}"/>` +
      `<Audiogram><SensitivityPoint frequency="1000" leftEarSensitivity="${privateMarkers[2]}"/></Audiogram>` +
      `<ECG averageHeartRate="${privateMarkers[1]}"><Voltage measurement="private"/></ECG>` +
      `<ActivitySummary activeEnergyBurned="900" appleExerciseTime="60"/>` + records + unknownRecords +
      fixtures.workout({}, fixtures.statistic());
    const file = await fixtures.archive({
      'nested/apple_health_export/Export.xml': fixtures.healthXml(clinicalContent),
      'nested/apple_health_export/export_cda.xml': privateMarkers[3],
      'nested/apple_health_export/electrocardiograms/synthetic.csv': privateMarkers[1]
    });
    const result = await importer.importAppleHealthZip(file, undefined, dependencies);

    expect(result.activities).toHaveLength(1);
    expect(result.diagnostics.ignoredRecordTypes.HKQuantityTypeIdentifierBodyMass).toBe(1);
    expect(result.diagnostics.ignoredRecordTypes.HKQuantityTypeIdentifierActiveEnergyBurned).toBe(1);
    expect(result.diagnostics.ignoredRecordTypes.HKQuantityTypeIdentifierHeartRateVariabilitySDNN).toBe(1);
    expect(Object.keys(result.diagnostics.ignoredRecordTypes).length).toBeLessThanOrEqual(129);
    expect(result.diagnostics.ignoredRecordTypes.otherUnknown).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain(privateMarkers[0]);
    expect(JSON.stringify(result)).not.toContain(privateMarkers[1]);
    expect(JSON.stringify(result)).not.toContain(privateMarkers[2]);
    expect(JSON.stringify(result)).not.toContain(privateMarkers[3]);
    expect(result).not.toHaveProperty('clinicalData');
    expect(result).not.toHaveProperty('mediaLibrary');
  });

  test.each([
    ['<HealthData><Workout>', 'INVALID_XML'],
    ['<!DOCTYPE HealthData [<!ENTITY x "unsafe">]><HealthData/>', 'UNSAFE_XML'],
    ['<Other/>', 'INVALID_XML']
  ])('rejects unsafe or malformed main input safely', async (xml, code) => {
    const file = await fixtures.archive({ 'apple_health_export/export.xml': xml });
    await expect(importer.importAppleHealthZip(file, undefined, dependencies)).rejects.toMatchObject({ code });
  });

  test('supports tiny UTF-8 chunks and a legitimate inline Apple DTD', async () => {
    const seen = [];
    const xml = '<!DOCTYPE HealthData [<!ELEMENT HealthData ANY><!ATTLIST HealthData locale CDATA #IMPLIED>]>' +
      fixtures.healthXml(fixtures.workout({ sourceName: 'Synthetic & Watch' }, fixtures.statistic())).replace(/<\?xml[^>]+>/, '');
    await importer.parseHealthXml(fixtures.xmlChunks(xml, 1), { workout: value => seen.push(value) }, dependencies);
    expect(seen).toHaveLength(1);
    expect(seen[0].attributes.sourceName).toBe('Synthetic & Watch');
  });

  test('rejects missing/ambiguous main entries, unsupported-only archives and resource limits', async () => {
    await expect(importer.importAppleHealthZip(await fixtures.archive({ 'only.txt': 'none' }), undefined, dependencies))
      .rejects.toMatchObject({ code: 'MISSING_EXPORT' });
    await expect(importContents(fixtures.workout({ workoutActivityType: 'HKWorkoutActivityTypeYoga' })))
      .rejects.toMatchObject({ code: 'NO_SUPPORTED_WORKOUTS' });
    await expect(importContents(fixtures.workout(), {}, { limits: { mainBytes: 5 } }))
      .rejects.toMatchObject({ code: 'RESOURCE_LIMIT' });
    await expect(importContents(fixtures.workout(), {}, { limits: { directoryBytes: 1 } }))
      .rejects.toMatchObject({ code: 'RESOURCE_LIMIT' });
    const file = await fixtures.archive({ 'a/export.xml': '<HealthData/>', 'b/Export.xml': '<HealthData/>' });
    await expect(importer.importAppleHealthZip(file, undefined, dependencies)).rejects.toMatchObject({ code: 'AMBIGUOUS_EXPORT' });
  });

  test('rejects an Apple ZIP whose primary-entry CRC is corrupted', async () => {
    const file = await fixtures.archive({
      'nested/apple_health_export/Export.xml': fixtures.healthXml(fixtures.workout({}, fixtures.statistic()))
    });
    const corrupt = await fixtures.corruptFirstCentralDirectoryCrc(file);

    await expect(importer.importAppleHealthZip(corrupt, undefined, dependencies))
      .rejects.toMatchObject({ code: 'INVALID_ARCHIVE' });
  });

  test('attaches only explicitly referenced GPX tracks and preserves disconnected segments', async () => {
    const route = fixtures.gpx([
      [[48.1000, 11.5000], [48.1010, 11.5000]],
      [[48.1100, 11.5000], [48.1110, 11.5000]]
    ]);
    const workout = fixtures.workout({}, `${fixtures.statistic()}<WorkoutRoute><FileReference path="/apple_health_export/routes/run.gpx"/></WorkoutRoute>`);
    const file = await fixtures.archive({
      'apple_health_export/Export.xml': fixtures.healthXml(workout),
      'apple_health_export/routes/run.gpx': route,
      'apple_health_export/routes/unreferenced.gpx': fixtures.gpx([[[50, 10], [50.001, 10]]])
    });
    const result = await importer.importAppleHealthZip(file, undefined, dependencies);
    const track = result.gpsTracksByActivityId[result.activities[0].id];

    expect(track).toMatchObject({ sport: 'Run' });
    expect(track.segments).toEqual([
      [[48.1, 11.5], [48.101, 11.5]],
      [[48.11, 11.5], [48.111, 11.5]]
    ]);
    expect(track.points).toEqual(track.segments.flat());
    expect(Object.keys(result.gpsTracksByActivityId)).toHaveLength(1);
    expect(result.diagnostics.skippedRouteCount).toBe(0);
  });

  test('reports actual decompressed bytes separately for each main pass and referenced route', async () => {
    const route = fixtures.gpx([[[48.1, 11.5], [48.101, 11.5]]]);
    const workout = fixtures.workout({}, `${fixtures.statistic()}<WorkoutRoute><FileReference path="/apple_health_export/routes/run.gpx"/></WorkoutRoute>`);
    const xml = fixtures.healthXml(fixtures.record('HeartRate', '150') + workout);
    const file = await fixtures.archive({
      'apple_health_export/Export.xml': xml,
      'apple_health_export/routes/run.gpx': route
    });
    const result = await importer.importAppleHealthZip(file, undefined, dependencies);
    const mainBytes = Buffer.byteLength(xml);
    const routeBytes = Buffer.byteLength(route);

    expect(result.diagnostics.processedBytes).toEqual({
      workoutXml: mainBytes,
      enrichmentXml: mainBytes,
      routeXml: routeBytes,
      total: mainBytes * 2 + routeBytes
    });
  });

  test('skips missing or corrupt optional GPX without discarding its workout', async () => {
    const workout = fixtures.workout({}, `${fixtures.statistic()}<WorkoutRoute><FileReference path="/apple_health_export/routes/missing.gpx"/></WorkoutRoute>`);
    const file = await fixtures.archive({ 'apple_health_export/Export.xml': fixtures.healthXml(workout) });
    const result = await importer.importAppleHealthZip(file, undefined, dependencies);

    expect(result.activities).toHaveLength(1);
    expect(result.gpsTracksByActivityId).toEqual({});
    expect(result.diagnostics.skippedRouteCount).toBe(1);
  });
});