(function exposeAppleHealthUtils(root) {
  'use strict';

  const MESSAGES = Object.freeze({
    INVALID_ARCHIVE: 'Select a readable original Apple Health ZIP export.',
    MISSING_EXPORT: 'No Apple Health export.xml was found in this archive.',
    AMBIGUOUS_EXPORT: 'The archive contains multiple Apple Health exports. Select one original export.',
    INVALID_XML: 'The main Apple Health export is incomplete or invalid.',
    UNSAFE_XML: 'The export contains unsupported XML declarations.',
    UNSUPPORTED_ENCODING: 'The export must use UTF-8 encoding.',
    RESOURCE_LIMIT: 'This export exceeds a safe processing limit. Your previous dashboard is unchanged.',
    NO_SUPPORTED_WORKOUTS: 'No valid running, cycling or swimming workouts were found.',
    CANCELLED: 'Apple Health import was cancelled.',
    UNSUPPORTED_CAPABILITY: 'Apple Health import requires a modern browser served over HTTP or HTTPS.',
    DEPENDENCY_LOAD_FAILED: 'Apple Health import dependencies could not load. Check your connection and retry.'
  });
  const UNITS = Object.freeze({
    distance: { km: 1, m: 0.001, mi: 1.609344 },
    duration: { s: 1, sec: 1, min: 60, h: 3600, hr: 3600 },
    elevation: { m: 1, cm: 0.01, ft: 0.3048 },
    heartRate: { 'count/min': 1 }, power: { W: 1 }, cadence: { 'count/min': 1 }, steps: { count: 1 }
  });

  function failure(code) {
    const safeCode = Object.prototype.hasOwnProperty.call(MESSAGES, code) ? code : 'INVALID_ARCHIVE';
    return Object.assign(new Error(MESSAGES[safeCode]), { code: safeCode });
  }

  function number(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function quantity(value, unit, kind) {
    const parsed = number(value);
    const factor = UNITS[kind] && Object.prototype.hasOwnProperty.call(UNITS[kind], unit) ? UNITS[kind][unit] : null;
    if (parsed === null || parsed < 0 || factor === null) return null;
    const converted = parsed * factor;
    return Number.isFinite(converted) ? converted : null;
  }

  function parseTimestamp(value) {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*(Z|[+-]\d{2}:?\d{2})$/);
    if (!match) return null;
    const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
    const offsetText = match[8].replace(':', '');
    const offsetHour = offsetText === 'Z' ? 0 : Number(offsetText.slice(1, 3));
    const offsetMinute = offsetText === 'Z' ? 0 : Number(offsetText.slice(3, 5));
    if (year < 100 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) return null;
    const wall = new Date(Date.UTC(year, month - 1, day, hour, minute, second, Number((match[7] || '').padEnd(3, '0'))));
    if (wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1 || wall.getUTCDate() !== day) return null;
    const offsetMinutes = (offsetHour * 60 + offsetMinute) * (offsetText.startsWith('-') ? -1 : 1);
    return { instant: new Date(wall.getTime() - offsetMinutes * 60000), local: { year, month, day, hour, minute, second, offsetMinutes } };
  }

  function calendarDates(local) {
    const date = new Date(local.year, local.month - 1, local.day);
    const monday = new Date(date);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return { date, monday };
  }

  function canonical(value) {
    if (value === undefined) return '["missing"]';
    if (typeof value === 'number' && !Number.isFinite(value)) return '["invalid-number"]';
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }

  async function digest(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function diagnostics() {
    return { importedCount: 0, duplicateCount: 0, unsupportedBySport: Object.create(null), invalidWorkoutCount: 0,
      identityConflictCount: 0, unavailableByMetricAndReason: Object.create(null), skippedRouteCount: 0,
      ignoredRecordTypes: Object.create(null),
      processedBytes: { workoutXml: 0, enrichmentXml: 0, routeXml: 0, total: 0 } };
  }

  function count(table, key, amount = 1) {
    const boundedKey = /^[A-Za-z][A-Za-z0-9_:.-]{0,127}$/.test(String(key)) ? String(key) : 'otherUnknown';
    const safeKey = Object.hasOwn(table, boundedKey) || Object.keys(table).length < 128 ? boundedKey : 'otherUnknown';
    table[safeKey] = (table[safeKey] || 0) + amount;
  }

  function normalizeWorkout(raw, report) {
    const attributes = raw.attributes;
    const sportRaw = attributes.workoutActivityType;
    const sport = { HKWorkoutActivityTypeRunning: 'Run', HKWorkoutActivityTypeCycling: 'Bike', HKWorkoutActivityTypeSwimming: 'Swim' }[sportRaw];
    if (!sport) { count(report.unsupportedBySport, sportRaw); return null; }
    const start = parseTimestamp(attributes.startDate);
    const end = parseTimestamp(attributes.endDate);
    if (!start || !end || end.instant < start.instant) { report.invalidWorkoutCount++; return null; }
    const metadata = raw.metadata;
    function summary(type, field, kind) {
      const values = raw.statistics.filter(statistic => statistic.type === 'HKQuantityTypeIdentifier' + type)
        .map(statistic => quantity(statistic[field], statistic.unit, kind)).filter(value => value !== null);
      if (!values.length) return null;
      return values.every(value => value === values[0]) ? values[0] : null;
    }
    const distanceType = { Run: 'DistanceWalkingRunning', Bike: 'DistanceCycling', Swim: 'DistanceSwimming' }[sport];
    const hasDistanceSummary = raw.statistics.some(statistic => statistic.type === 'HKQuantityTypeIdentifier' + distanceType);
    const distance = hasDistanceSummary ? summary(distanceType, 'sum', 'distance') : quantity(attributes.totalDistance, attributes.totalDistanceUnit, 'distance');
    const duration = quantity(attributes.duration, attributes.durationUnit, 'duration');
    const ascent = String(metadata.HKElevationAscended || '').match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(\S+)$/);
    const positive = value => value !== null && value > 0 ? value : null;
    const activity = {
      id: '', ...calendarDates(start.local), startTime: start.instant, sourceLocalStart: start.local, sportRaw, sport,
      distance: distance === null ? 0 : distance, distanceAvailable: distance !== null,
      duration: duration === null ? 0 : duration, durationAvailable: duration !== null,
      avgHeartRate: positive(summary('HeartRate', 'average', 'heartRate')),
      avgWatts: sport === 'Bike' ? positive(summary('CyclingPower', 'average', 'power')) : null,
      avgCadence: sport === 'Bike' ? positive(summary('CyclingCadence', 'average', 'cadence')) : null,
      totalSteps: sport === 'Run' ? positive(summary('StepCount', 'sum', 'steps')) : null,
      elevationGain: ascent ? quantity(ascent[1], ascent[2], 'elevation') : null, equipment: '', name: 'Activity'
    };
    for (const [metric, available] of Object.entries({ distance: distance !== null, duration: duration !== null,
      heartRate: activity.avgHeartRate !== null, power: activity.avgWatts !== null, cadence: activity.avgCadence !== null,
      steps: activity.totalSteps !== null, elevation: activity.elevationGain !== null })) {
      if (!available) count(report.unavailableByMetricAndReason, metric + ':missingOrInvalid');
    }
    const source = String(attributes.sourceName || '').trim();
    const identityAttributes = Object.fromEntries(Object.entries(attributes).filter(([key]) => !['creationDate', 'sourceVersion'].includes(key)));
    const identityMetadata = Object.fromEntries(Object.entries(metadata).filter(([key]) => key !== 'HKMetadataKeySyncVersion'));
    const fingerprint = canonical({ attributes: identityAttributes, metadata: identityMetadata,
      statistics: raw.statistics.map(canonical).sort(), events: raw.events.map(canonical).sort(), routes: [...new Set(raw.routes)].sort() });
    const external = metadata.HKExternalUUID || metadata.HKMetadataKeySyncIdentifier;
    let activeWindows = [[start.instant.getTime(), end.instant.getTime()]];
    const pauses = raw.events.filter(event => /(?:Pause|Resume|Paused|Resumed)$/.test(event.type || ''));
    if (pauses.length) {
      let cursor = start.instant.getTime();
      let paused = false;
      activeWindows = [];
      for (const event of pauses) {
        const time = parseTimestamp(event.date || event.startDate);
        if (!time || time.instant < cursor || time.instant > end.instant) { activeWindows = null; break; }
        const value = time.instant.getTime();
        const isPause = /(?:Pause|Paused)$/.test(event.type);
        if (isPause === paused) { activeWindows = null; break; }
        if (isPause) activeWindows.push([cursor, value]);
        paused = isPause;
        cursor = value;
      }
      if (activeWindows) {
        if (paused) activeWindows = null;
        else activeWindows.push([cursor, end.instant.getTime()]);
      }
    }
    const completeActiveTime = activeWindows && duration !== null &&
      Math.abs(activeWindows.reduce((sum, window) => sum + window[1] - window[0], 0) / 1000 - duration) <= 1;
    return { activity, source, device: attributes.device || '', startMs: start.instant.getTime(), endMs: end.instant.getTime(),
      activeWindows, completeActiveTime, fingerprint, external: source && external ? canonical([source, external]) : null,
      completeIdentity: !!source && duration !== null, routes: raw.routes, samples: Object.create(null) };
  }

  function reduceSamples(samples, windows, requireCoverage) {
    if (!samples || !samples.length || !windows) return null;
    const devices = new Set(samples.map(sample => sample.device));
    if (devices.size !== 1) return null;
    const unique = new Map();
    for (const sample of samples) {
      const key = canonical([sample.startMs, sample.endMs, sample.device]);
      const previous = unique.get(key);
      if (previous && previous.value !== sample.value) return null;
      unique.set(key, sample);
    }
    const ordered = [...unique.values()].sort((first, second) => first.startMs - second.startMs || first.endMs - second.endMs);
    const points = ordered.every(sample => sample.startMs === sample.endMs);
    const intervals = ordered.every(sample => sample.endMs > sample.startMs);
    if ((!points && !intervals) || (requireCoverage && !intervals)) return null;
    let previousEnd = -Infinity;
    let value = 0;
    let weight = 0;
    for (const sample of ordered) {
      if (intervals && sample.startMs < previousEnd) return null;
      previousEnd = sample.endMs;
      const span = intervals ? sample.endMs - sample.startMs : 1;
      value += requireCoverage ? sample.value : sample.value * span;
      weight += span;
    }
    if (requireCoverage) {
      const expected = windows.reduce((sum, window) => sum + window[1] - window[0], 0);
      if (weight !== expected) return null;
    }
    return { value: requireCoverage ? value : value / weight, ordered, points };
  }

  const api = { failure, number, quantity, parseTimestamp, calendarDates, canonical, digest, diagnostics, count,
    normalizeWorkout, reduceSamples };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.appleHealthUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);