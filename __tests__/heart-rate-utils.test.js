const fs = require('fs');
const path = require('path');
const vm = require('vm');
const heartRate = require('../src/heart-rate-utils');

function training(overrides = {}) {
  return { id: 'one', date: new Date(2026, 9, 1), sport: 'Run', ...overrides };
}

function calendarReferenceHistory() {
  const rows = [
    [2025, 12, 28, 80, 160], [2025, 12, 29, 75, 180], [2025, 12, 30, 75, 175],
    [2026, 1, 1, null, 190], [2026, 1, 4, 75, null], [2026, 1, 5, 65, 165],
    [2026, 1, 31, null, null], [2026, 2, 1, 85, 195], [2026, 2, 28, 60, 160],
    [2026, 3, 1, 60, 175], [2026, 3, 29, 70, 200], [2026, 3, 30, 70, 200]
  ];
  return Object.freeze(rows.map(([year, month, day, minimum, maximum], ordinal) => Object.freeze(training({
    id: `calendar-${ordinal}`, sourceOrdinal: ordinal, date: new Date(year, month - 1, day),
    startTime: new Date(year, month - 1, day, 8), sport: ['Run', 'Bike', 'Swim'][ordinal % 3],
    minHeartRate: minimum, maxHeartRate: maximum, name: 'Synthetic calendar training'
  }))));
}

const calendarOracle = Object.freeze({
  dailyCount: 11,
  weekly: [
    ['2025-12-22', 80, 160], ['2025-12-29', 75, 190], ['2026-01-05', 65, 165],
    ['2026-01-26', 85, 195], ['2026-02-23', 60, 175], ['2026-03-23', 70, 200], ['2026-03-30', 70, 200]
  ],
  monthly: [['2025-12', 75, 180], ['2026-01', 65, 190], ['2026-02', 60, 195], ['2026-03', 60, 200]],
  yearly: [['2025', 75, 180], ['2026', 60, 200]]
});

describe('calendar reference oracle', () => {
  test('preserves twelve synthetic trainings and existing timeline behavior across calendar boundaries', () => {
    const records = calendarReferenceHistory();
    const before = JSON.stringify(records);
    const timeline = heartRate.buildHeartRateTimeline(records, {
      getActivityKey: activity => ({ activityKey: activity.id, sourceOrdinal: activity.sourceOrdinal })
    });
    expect(records).toHaveLength(12);
    expect(new Set(records.map(activity => activity.sport))).toEqual(new Set(['Run', 'Bike', 'Swim']));
    expect(new Set(records.map(activity => activity.date.getFullYear())).size).toBe(2);
    expect(timeline.activityCount).toBe(11);
    expect(timeline.minimumPoints.map(point => point.y)).toEqual([80, 75, 75, 75, 65, 85, 60, 60, 70, 70]);
    expect(timeline.maximumPoints.map(point => point.y)).toEqual([160, 180, 175, 190, 165, 195, 160, 175, 200, 200]);
    expect(timeline.minimumPoints[0]).toMatchObject({ activityKey: 'calendar-0', sourceOrdinal: 0 });
    expect(calendarOracle.dailyCount).toBe(11);
    expect(calendarOracle.weekly).toHaveLength(7);
    expect(calendarOracle.monthly).toHaveLength(4);
    expect(calendarOracle.yearly).toHaveLength(2);
    expect(JSON.stringify(records)).toBe(before);
  });
});

describe('heart-rate calendar periods', () => {
  test('groups ten thousand trainings without multiplying points or changing identities', () => {
    const activities=Object.freeze(Array.from({length:10000},(_,ordinal)=>Object.freeze(training({
      id:`scale-${ordinal}`,date:new Date(2026,0,1+ordinal%365),minHeartRate:75,maxHeartRate:180
    }))));
    const before=JSON.stringify(activities);
    const model=heartRate.buildHeartRatePeriodModel(activities,{aggregation:'yearly'});
    expect(model.activityCount).toBe(10000);
    expect(model.periodCount).toBe(1);
    expect(model.minimumPoints).toHaveLength(1);
    expect(model.maximumPoints).toHaveLength(1);
    expect(model.periods[0].contributors).toHaveLength(10000);
    expect(model.periods[0].minimum.sources).toHaveLength(10000);
    expect(JSON.stringify(activities)).toBe(before);
  });

  test.each(['daily', 'weekly', 'monthly', 'yearly'])('matches independent %s extrema and never mutates inputs', aggregation => {
    const activities = calendarReferenceHistory();
    const before = JSON.stringify(activities);
    const model = heartRate.buildHeartRatePeriodModel(activities, { aggregation,
      getActivityKey: activity => ({ activityKey: activity.id, sourceOrdinal: activity.sourceOrdinal }) });
    expect(model.activityCount).toBe(11);
    expect(model.periodCount).toBe(aggregation === 'daily' ? calendarOracle.dailyCount : calendarOracle[aggregation].length);
    if (aggregation !== 'daily') expect(model.periods.map(period => [period.periodKey, period.minimum.value, period.maximum.value])).toEqual(calendarOracle[aggregation]);
    expect(model.minimumPoints.length + model.maximumPoints.length).toBeLessThanOrEqual(2 * model.periodCount);
    expect(model.periods.every(period => period.endExclusiveMs > period.startMs)).toBe(true);
    expect(JSON.stringify(activities)).toBe(before);
  });

  test('keeps ISO-week year, all contributors and every tied extremum source', () => {
    const model = heartRate.buildHeartRatePeriodModel(calendarReferenceHistory(), { aggregation: 'weekly' });
    const week = model.periods.find(period => period.periodKey === '2025-12-29');
    expect(week.label).toContain('2026');
    expect(week.contributors).toHaveLength(4);
    expect(week.minimum.sources).toHaveLength(3);
    expect(week.maximum.sources).toHaveLength(1);
    expect(week.minimum.sources.every(source => source.kind === 'minimum')).toBe(true);
  });

  test('clips period point placement to an inclusive requested window after selection', () => {
    const activities = calendarReferenceHistory();
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2026, 0, 4).getTime();
    const filtered = activities.filter(activity => activity.date.getTime() >= start && activity.date.getTime() <= end);
    const model = heartRate.buildHeartRatePeriodModel(filtered, { aggregation: 'weekly', rangeStart: start, rangeEnd: end });
    expect(model.periods).toHaveLength(1);
    expect(model.periods[0].minimum.value).toBe(75);
    expect(model.periods[0].maximum.value).toBe(190);
    expect(model.periods[0].contributors).toHaveLength(2);
    expect(model.minimumPoints[0].x).toBe(start + (end - start) / 2);
  });

  test('keeps one-sided periods and rejects contradictions without fabricating empty periods', () => {
    const model = heartRate.buildHeartRatePeriodModel([
      training({ minHeartRate: 75 }), training({ minHeartRate: 180, maxHeartRate: 150 }),
      training({ date: new Date(2026, 10, 1), maxHeartRate: 180 }), training({ avgHeartRate: 145 })
    ], { aggregation: 'monthly' });
    expect(model.periodCount).toBe(2);
    expect(model.minimumPoints).toHaveLength(1);
    expect(model.maximumPoints).toHaveLength(1);
    expect(model.activityCount).toBe(2);
  });
});

describe('heart-rate field evidence', () => {
  const completeRead = Object.freeze({
    readStatus: 'complete', lengthValidated: true, integrityValidated: true, strictParseCompleted: true,
    recordsComplete: true, resourceLimited: false, unit: 'bpm', reason: null
  });
  const qualification = Object.freeze({ qualified: true, readEvidence: completeRead });
  const records = Object.freeze([140, 80, 170].map((value, ordinal) => Object.freeze({
    timestamp: new Date(2026, 6, 19, 10, ordinal), heart_rate: value
  })));
  const direct = (minimum, maximum) => heartRate.inspectCsvHeartRateExtrema(['Min Heart Rate', 'Max. Herzfrequenz'], [minimum, maximum]);

  test.each([
    ['', '', null, 'missing'], ['', '180', 180, 'valid'], ['180', '180', 180, 'valid'],
    ['180', '190', null, 'conflict'], ['180', 'bad', null, 'invalid'],
    ['180 bpm', '', null, 'invalid'], ['0', '', null, 'invalid'], ['1e2', '', null, 'invalid'],
    ['+175,5', '', 175.5, 'valid']
  ])('inspects exact duplicate CSV evidence %s / %s', (first, second, value, status) => {
    const result = heartRate.inspectCsvHeartRateExtrema(['Max. Herzfrequenz', 'Max. Herzfrequenz'], [first, second]);
    expect(result.maximum).toEqual({ value, status, source: status === 'missing' ? null : 'summary',
      reason: { valid: null, missing: 'missing', conflict: 'conflict', invalid: 'invalid_value' }[status],
      sampleCount: null, readComplete: null });
    expect(result.minimum).toMatchObject({ value: null, status: 'missing', source: null });
  });

  test('does not infer extrema from an average or unknown-unit header', () => {
    const result = heartRate.inspectCsvHeartRateExtrema(['Average Heart Rate', 'Min Heart Rate (Hz)'], ['145', '75']);
    expect([result.minimum.status, result.maximum.status]).toEqual(['missing', 'missing']);
  });

  test('derives only actual positive integer bpm observations without mutation or a coverage heuristic', () => {
    const before = JSON.stringify(records);
    const result = heartRate.deriveTimedHeartRateExtrema(records, qualification);
    expect(result.minimum).toMatchObject({ value: 80, status: 'valid', source: 'records', sampleCount: 3, readComplete: true });
    expect(result.maximum).toMatchObject({ value: 170, status: 'valid', source: 'records', sampleCount: 3, readComplete: true });
    const single = heartRate.deriveTimedHeartRateExtrema([records[0]], qualification);
    expect([single.minimum.value, single.maximum.value]).toEqual([140, 140]);
    const invalid = [255, 0, -1, Infinity, '70', 80.5].map(value => ({ timestamp: records[0].timestamp, heart_rate: value }));
    expect(heartRate.deriveTimedHeartRateExtrema([...records, ...invalid], qualification).minimum.value).toBe(80);
    expect(heartRate.deriveTimedHeartRateExtrema(invalid, qualification).minimum).toMatchObject({ value: null, status: 'unqualified', reason: 'no_samples' });
    expect(JSON.stringify(records)).toBe(before);
  });

  test.each([
    [{ readStatus: 'incomplete' }, 'read_incomplete'], [{ readStatus: 'unknown' }, 'read_unknown'],
    [{ integrityValidated: false }, 'read_incomplete'], [{ recordsComplete: false }, 'read_incomplete'],
    [{ strictParseCompleted: false }, 'read_incomplete'], [{ lengthValidated: false }, 'read_incomplete'],
    [{ resourceLimited: true }, 'resource_limit'], [{ unit: 'Hz' }, 'unknown_unit']
  ])('rejects unqualified read evidence %o', (changes, reason) => {
    const result = heartRate.deriveTimedHeartRateExtrema(records, { qualified: true, readEvidence: { ...completeRead, ...changes } });
    expect(result.minimum).toMatchObject({ value: null, status: 'unqualified', reason, readComplete: false });
    expect(result.maximum.value).toBeNull();
  });

  test('requires ownership and trustworthy record timestamps', () => {
    expect(heartRate.deriveTimedHeartRateExtrema(records, { qualified: false, reason: 'overlapping_sessions', readEvidence: completeRead }).minimum.reason).toBe('overlapping_sessions');
    expect(heartRate.deriveTimedHeartRateExtrema([{ timestamp: null, heart_rate: 80 }], qualification).minimum.reason).toBe('invalid_timestamp');
  });

  test('preserves direct values and only fills missing fields', () => {
    const summary = direct('', '180');
    const observed = heartRate.deriveTimedHeartRateExtrema(records, qualification);
    const before = JSON.stringify([summary, observed]);
    const result = heartRate.resolveHeartRateExtrema(summary, observed);
    expect(result).toMatchObject({ minHeartRate: 80, maxHeartRate: 180, heartRateProvenance: {
      minimum: { source: 'records', sampleCount: 3 }, maximum: { source: 'summary' }
    } });
    expect(heartRate.resolveHeartRateExtrema(direct('75', '180'), observed).minHeartRate).toBe(75);
    expect(heartRate.resolveHeartRateExtrema(direct('bad', '180'), observed)).toMatchObject({ minHeartRate: null, heartRateProvenance: { minimum: { status: 'invalid' } } });
    const conflict = heartRate.inspectCsvHeartRateExtrema(['Min Heart Rate', 'Minimum Heart Rate'], ['75', '80']);
    expect(heartRate.resolveHeartRateExtrema(conflict, observed).heartRateProvenance.minimum.status).toBe('conflict');
    expect(JSON.stringify([summary, observed])).toBe(before);
  });

  test('does not repair reversed summaries or contradict a direct opposite field', () => {
    const observed = heartRate.deriveTimedHeartRateExtrema(records, qualification);
    const reversed = heartRate.resolveHeartRateExtrema(direct('180', '150'), observed);
    expect(reversed).toMatchObject({ minHeartRate: 180, maxHeartRate: 150 });
    expect(heartRate.hasHeartRateData([training(reversed)])).toBe(false);
    expect(heartRate.resolveHeartRateExtrema(direct('', '70'), observed)).toMatchObject({
      minHeartRate: null, maxHeartRate: 70, heartRateProvenance: { minimum: { status: 'unqualified', reason: 'inconsistent_with_summary' } }
    });
  });

  test('summarizes local coverage separately from averages without retaining individual values', () => {
    const observed = heartRate.deriveTimedHeartRateExtrema(records, qualification);
    const activities = [
      training({ ...heartRate.resolveHeartRateExtrema(direct('', '180'), observed), avgHeartRate: 145 }),
      training({ ...heartRate.resolveHeartRateExtrema(direct('', '')), avgHeartRate: 146 })
    ];
    const coverage = heartRate.summarizeHeartRateCoverage(activities);
    expect(coverage).toMatchObject({ average: 2, minimum: { records: 1, missing: 1 }, maximum: { summary: 1, missing: 1 } });
    expect(JSON.stringify(coverage)).not.toMatch(/145|146|180|calendar|activityKey/);
  });
});

describe('heart-rate availability', () => {
  test.each([
    [{ minHeartRate: 75 }, true],
    [{ maxHeartRate: 180 }, true],
    [{ minHeartRate: 150, maxHeartRate: 150 }, true],
    [{ minHeartRate: 180, maxHeartRate: 150 }, false],
    [{ minHeartRate: 0, maxHeartRate: 170 }, true],
    [{ minHeartRate: -1 }, false],
    [{ minHeartRate: Infinity }, false],
    [{ minHeartRate: NaN }, false],
    [{ minHeartRate: '75' }, false],
    [{ avgHeartRate: 145 }, false],
    [{ minHeartRate: 75, date: null }, false],
    [{ minHeartRate: 75, date: '' }, false],
    [{ minHeartRate: 75, date: new Date(NaN) }, false],
    [{ minHeartRate: 75, sport: 'Walk' }, false]
  ])('validates %o independently', (fields, expected) => {
    expect(heartRate.hasHeartRateData([Object.freeze(training(fields))])).toBe(expected);
  });

  test('short circuits without sorting or changing input', () => {
    const records = [Object.freeze(training({ maxHeartRate: 180 }))];
    Object.defineProperty(records, 1, { get() { throw new Error('unnecessary scan'); } });
    expect(heartRate.hasHeartRateData(records)).toBe(true);
    expect(heartRate.hasHeartRateData(null)).toBe(false);
    expect(heartRate.hasHeartRateData([null, {}])).toBe(false);
  });

  test('provides the same API as a collision-free classic browser script', () => {
    const context = vm.createContext({ window: {} });
    const source = fs.readFileSync(path.join(__dirname, '../src/heart-rate-utils.js'), 'utf8');
    vm.runInContext(source, context);
    vm.runInContext(source, context);
    expect(context.window.heartRateUtils.hasHeartRateData([training({ minHeartRate: 70 })])).toBe(true);
    expect(Object.keys(context.window.heartRateUtils)).toEqual(Object.keys(heartRate));
  });
});

describe('heart-rate timeline', () => {
  test('handles ten thousand trainings without mutation or invented observations', () => {
    const records = Object.freeze(Array.from({ length: 10000 }, (_, ordinal) => Object.freeze(training({
      id: `scale-${ordinal}`, date: new Date(2026, 0, 1 + ordinal % 365), minHeartRate: 75, maxHeartRate: 180
    }))));
    const before = JSON.stringify(records);
    expect(heartRate.hasHeartRateData(records)).toBe(true);
    const model = heartRate.buildHeartRateTimeline(records);
    expect(model.activityCount).toBe(10000);
    expect(model.minimumPoints).toHaveLength(10000);
    expect(model.maximumPoints).toHaveLength(10000);
    expect(JSON.stringify(records)).toBe(before);
  });

  function referenceHistory() {
    return Array.from({ length: 12 }, (_, ordinal) => Object.freeze(training({
      id: ordinal < 2 ? 'duplicate' : undefined,
      date: new Date(2026, 9, 1 + Math.floor(ordinal / 3)),
      startTime: ordinal === 2 ? null : new Date(2026, 9, 1 + Math.floor(ordinal / 3), 8 + ordinal % 2),
      sport: ['Run', 'Bike', 'Swim'][ordinal % 3],
      minHeartRate: ordinal % 3 === 0 ? null : 70 + ordinal,
      maxHeartRate: ordinal % 3 === 1 ? null : 170 + ordinal,
      name: ordinal === 0 ? '' : 'Synthetic training'
    })));
  }

  test('keeps every available extremum attached to the original training without aggregation or mutation', () => {
    const records = referenceHistory();
    const registry = new Map(records.map((activity, sourceOrdinal) => [activity, { activityKey: `activity-${sourceOrdinal}`, sourceOrdinal }]));
    const unsorted = Object.freeze(records.slice().reverse());
    const before = JSON.stringify(unsorted);
    const model = heartRate.buildHeartRateTimeline(unsorted, { getActivityKey: activity => registry.get(activity) });
    expect(model.activityCount).toBe(12);
    expect(model.minimumPoints).toHaveLength(8);
    expect(model.maximumPoints).toHaveLength(8);
    for (const point of [...model.minimumPoints, ...model.maximumPoints]) {
      const original = records[point.sourceOrdinal];
      expect(point.x).toBe(original.date.getTime());
      expect(point.y).toBe(original[point.kind === 'minimum' ? 'minHeartRate' : 'maxHeartRate']);
      expect(point.activityKey).toBe(`activity-${point.sourceOrdinal}`);
      expect(point.sport).toBe(original.sport);
      expect(point.displayName).toContain(`Training ${point.sourceOrdinal + 1}`);
    }
    for (const points of [model.minimumPoints, model.maximumPoints]) {
      expect(points.map(point => point.x)).toEqual(points.map(point => point.x).slice().sort((first, second) => first - second));
    }
    expect(JSON.stringify(unsorted)).toBe(before);
    const filtered = heartRate.buildHeartRateTimeline([records[8]], { getActivityKey: activity => registry.get(activity) });
    expect(filtered.minimumPoints[0].activityKey).toBe('activity-8');
  });

  test('excludes contradictions and invalid values, retains equal/one-sided values and uses stable time tie-breaking', () => {
    const day = new Date(2026, 9, 1);
    const records = [
      training({ minHeartRate: 150, maxHeartRate: 150, startTime: null }),
      training({ minHeartRate: 180, maxHeartRate: 150 }),
      training({ minHeartRate: 75, maxHeartRate: Infinity, startTime: new Date(2026, 9, 1, 7) }),
      training({ maxHeartRate: 170, startTime: new Date(2026, 9, 1, 8) })
    ];
    const result = heartRate.buildHeartRateTimeline(records);
    expect(result.activityCount).toBe(3);
    expect(result.minimumPoints.map(point => point.y)).toEqual([75, 150]);
    expect(result.maximumPoints.map(point => point.y)).toEqual([170, 150]);
    expect(result.minimumPoints.every(point => point.x === day.getTime())).toBe(true);
    expect(heartRate.buildHeartRateTimeline(null)).toEqual({ minimumPoints: [], maximumPoints: [], activityCount: 0 });
  });
});