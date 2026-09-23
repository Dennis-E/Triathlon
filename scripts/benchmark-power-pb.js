const { performance } = require('perf_hooks');
const {
  POWER_DURATIONS,
  normalizePowerValue,
  calculatePowerEffortsForDurations
} = require('../src/power-pb-utils');
const { extractGpsAndPowerFromZip } = require('../src/zip-importer');

const WARM_UP_RUNS = 3;
const MEASURED_RUNS = 7;

function makeRecords(count, powerAt = index => 200 + (index % 100)) {
  return Array.from({ length: count }, (_, index) => ({
    tSec: index,
    distKm: index * 0.01,
    power: powerAt(index)
  }));
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(callback, warmUps = WARM_UP_RUNS, runs = MEASURED_RUNS) {
  for (let index = 0; index < warmUps; index++) callback();
  const values = [];
  for (let index = 0; index < runs; index++) {
    const startedAt = performance.now();
    callback();
    values.push(performance.now() - startedAt);
  }
  return median(values);
}

function legacyEffort(records, targetSeconds, coverageThreshold = 0.8) {
  const points = records
    .filter(record => record && Number.isFinite(record.tSec) && Number.isFinite(record.distKm))
    .map(record => ({ ...record, power: normalizePowerValue(record.power) }))
    .sort((a, b) => a.tSec - b.tSec);
  let best = null;

  for (const start of points) {
    const window = points.filter(point => point.tSec >= start.tSec && point.tSec <= start.tSec + targetSeconds);
    if (window.length < 2) continue;
    const end = window[window.length - 1];
    const validPoints = window.filter(point => point.power !== null);
    const coverage = Math.min(1, (end.tSec - start.tSec) / targetSeconds) * (validPoints.length / window.length);
    if (coverage < coverageThreshold || validPoints.length === 0) continue;
    const effort = {
      avgPower: validPoints.reduce((sum, point) => sum + point.power, 0) / validPoints.length
    };
    if (!best || effort.avgPower > best.avgPower) best = effort;
  }
  return best;
}

function legacyAllDurations(records) {
  return POWER_DURATIONS.map(duration => legacyEffort(records, duration.seconds)).filter(Boolean);
}

async function measureImportPhases() {
  const records = Array.from({ length: 7201 }, (_, index) => ({
    timestamp: new Date(index * 1000),
    distance: index * 10,
    power: 200 + (index % 100),
    position_lat: 48 + index * 0.000001,
    position_long: 11 + index * 0.000001
  }));
  const files = {};
  const csvRows = ['Activity ID,Filename'];
  const sports = new Map();
  for (let activity = 0; activity < 100; activity++) {
    const filename = `activities/${activity}.fit`;
    files[filename] = { dir: false, async: async () => new Uint8Array([activity]) };
    csvRows.push(`${activity},${filename}`);
    sports.set(String(activity), 'Bike');
  }

  const timings = [];
  let lastProgressAt = performance.now();
  let longestProgressGapMs = 0;
  await extractGpsAndPowerFromZip(
    { files },
    csvRows.join('\n'),
    sports,
    () => {
      const progressAt = performance.now();
      longestProgressGapMs = Math.max(longestProgressGapMs, progressAt - lastProgressAt);
      lastProgressAt = progressAt;
    },
    {
      ensureFitParserLoaded: async () => function FakeFitParser() {},
      parseFitRecords: async () => records,
      onTiming: timing => timings.push(timing)
    }
  );

  return {
    parseMs: timings.reduce((sum, timing) => sum + timing.parseMs, 0),
    gpsMs: timings.reduce((sum, timing) => sum + timing.gpsMs, 0),
    powerMs: timings.reduce((sum, timing) => sum + timing.powerMs, 0),
    longestProgressGapMs
  };
}

async function run() {
  const smaller = makeRecords(7201);
  const fourHour = makeRecords(14401);
  const noPower = makeRecords(14401, () => null);
  const baselineRecords = makeRecords(3601);

  const smallerMs = measure(() => calculatePowerEffortsForDurations(smaller, POWER_DURATIONS));
  const fourHourMs = measure(() => calculatePowerEffortsForDurations(fourHour, POWER_DURATIONS));
  const noPowerMs = measure(() => calculatePowerEffortsForDurations(noPower, POWER_DURATIONS));
  const legacyMs = measure(() => legacyAllDurations(baselineRecords), 1, 3);
  const optimizedMs = measure(() => calculatePowerEffortsForDurations(baselineRecords, POWER_DURATIONS));
  const reductionPercent = (1 - optimizedMs / legacyMs) * 100;

  const historyStartedAt = performance.now();
  for (let activity = 0; activity < 100; activity++) {
    calculatePowerEffortsForDurations(makeRecords(7201), POWER_DURATIONS);
  }
  const historyMs = performance.now() - historyStartedAt;
  const phases = await measureImportPhases();

  const report = {
    warmUpRuns: WARM_UP_RUNS,
    measuredRuns: MEASURED_RUNS,
    smallerRecords: smaller.length,
    largerRecords: fourHour.length,
    smallerMedianMs: Number(smallerMs.toFixed(2)),
    largerMedianMs: Number(fourHourMs.toFixed(2)),
    scalingRatio: Number((fourHourMs / smallerMs).toFixed(2)),
    noPowerMedianMs: Number(noPowerMs.toFixed(2)),
    baselineRecords: baselineRecords.length,
    legacyMedianMs: Number(legacyMs.toFixed(2)),
    optimizedMedianMs: Number(optimizedMs.toFixed(2)),
    reductionPercent: Number(reductionPercent.toFixed(2)),
    historyActivities: 100,
    historyRecords: 720000,
    historyTotalMs: Number(historyMs.toFixed(2)),
    phaseTotalsMs: {
      parse: Number(phases.parseMs.toFixed(2)),
      gps: Number(phases.gpsMs.toFixed(2)),
      power: Number(phases.powerMs.toFixed(2))
    },
    longestProgressGapMs: Number(phases.longestProgressGapMs.toFixed(2))
  };

  console.log(JSON.stringify(report, null, 2));

  const failures = [];
  if (report.scalingRatio > 2.5) failures.push(`scaling ratio ${report.scalingRatio} exceeds 2.5`);
  if (report.noPowerMedianMs > 100) failures.push(`no-power median ${report.noPowerMedianMs}ms exceeds 100ms`);
  if (report.reductionPercent < 75) failures.push(`reduction ${report.reductionPercent}% is below 75%`);
  if (failures.length > 0) {
    failures.forEach(failure => console.error(`FAIL: ${failure}`));
    process.exitCode = 1;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});