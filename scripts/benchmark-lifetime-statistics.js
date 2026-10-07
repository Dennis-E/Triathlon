const { performance } = require('perf_hooks');
const { aggregateLifetimeStatistics } = require('../src/lifetime-statistics-utils');

const ACTIVITY_COUNT = 5000;
const WARMUP_RUNS = 5;
const MEASURED_RUNS = 25;
const TARGET_MILLISECONDS = 1000;
const sports = ['Run', 'Bike', 'Swim', null];

const activities = Array.from({ length: ACTIVITY_COUNT }, (_, index) => ({
  id: `benchmark-${index}`,
  name: `Synthetic workout ${index}`,
  sport: sports[index % sports.length],
  date: new Date(2020 + Math.floor(index / 1460), index % 12, (index % 28) + 1),
  distance: index % 11 === 0 ? 0 : (index % 500) / 10,
  distanceAvailable: index % 13 !== 0,
  duration: index % 17 === 0 ? 0 : (index % 7200) + 300,
  durationAvailable: index % 19 !== 0,
  elevationGain: index % 7 === 0 ? null : index % 1600,
  equipment: index % 5 === 0 ? `Bike ${index % 37}` : ''
}));

for (let run = 0; run < WARMUP_RUNS; run += 1) {
  aggregateLifetimeStatistics(activities);
}

const durations = [];
for (let run = 0; run < MEASURED_RUNS; run += 1) {
  const start = performance.now();
  aggregateLifetimeStatistics(activities);
  durations.push(performance.now() - start);
}

durations.sort((first, second) => first - second);
const medianMilliseconds = durations[Math.floor(durations.length / 2)];
const passes = medianMilliseconds < TARGET_MILLISECONDS;

console.log(`Lifetime statistics benchmark: ${ACTIVITY_COUNT.toLocaleString()} activities`);
console.log(`${MEASURED_RUNS} measured runs after ${WARMUP_RUNS} warmups`);
console.log(`Median aggregation time: ${medianMilliseconds.toFixed(3)} ms`);
console.log(`Target (< ${TARGET_MILLISECONDS} ms): ${passes ? 'PASS' : 'FAIL'}`);

if (!passes) process.exitCode = 1;
