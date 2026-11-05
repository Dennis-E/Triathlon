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
    DEPENDENCY_LOAD_FAILED: 'Apple Health import dependencies could not load. Check your connection and retry.',
    UNSUPPORTED_DEPLOYMENT: 'Serve this app over local HTTP or secure HTTPS before importing Apple Health.',
    INSECURE_CONTEXT: 'Apple Health import needs a secure HTTPS origin or local HTTP on localhost or loopback.',
    MISSING_CAPABILITY: 'A required Apple Health import function is unavailable in this environment.',
    DEPENDENCY_INVALID: 'An Apple Health import library is missing required exports. Reload the app and retry.',
    WORKER_START_FAILED: 'The Apple Health import worker could not start. Retry or report the safe diagnostic.',
    WORKER_INIT_TIMEOUT: 'The Apple Health importer did not become ready within 30 seconds. Retry.',
    WORKER_RUNTIME_FAILED: 'The Apple Health import worker stopped unexpectedly. Retry.',
    WORKER_PROTOCOL_ERROR: 'The Apple Health importer returned an invalid message. Retry or report the safe diagnostic.',
    HASH_FAILED: 'Secure workout identity generation failed. No replacement identities were created.',
    INTERNAL_ERROR: 'The Apple Health importer encountered an internal error. Report the safe diagnostic.'
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

  const RUNTIME_ENUMS = Object.freeze({
    phase: ['preflight', 'worker-start', 'dependencies', 'capabilities', 'hashing', 'parsing', 'result', 'commit'],
    component: ['deployment', 'worker', 'stream', 'text', 'zip', 'sax', 'crypto', 'protocol', 'importer'],
    scheme: ['http', 'https', 'file', 'other'], hostClass: ['loopback', 'remote', 'none'], realm: ['window', 'worker'],
    capability: ['Worker', 'ReadableStream', 'WritableStream', 'TextEncoder', 'TextDecoder', 'AbortController', 'crypto.subtle.digest']
  });
  const RUNTIME_ACTIONS = Object.freeze({
    UNSUPPORTED_DEPLOYMENT: 'serve-local', INSECURE_CONTEXT: 'use-secure-origin', MISSING_CAPABILITY: 'use-supported-environment',
    UNSUPPORTED_CAPABILITY: 'use-supported-environment', DEPENDENCY_LOAD_FAILED: 'retry', DEPENDENCY_INVALID: 'retry',
    WORKER_START_FAILED: 'retry', WORKER_INIT_TIMEOUT: 'retry', WORKER_RUNTIME_FAILED: 'retry',
    WORKER_PROTOCOL_ERROR: 'report-safe-diagnostic', HASH_FAILED: 'report-safe-diagnostic', INTERNAL_ERROR: 'report-safe-diagnostic', CANCELLED: 'none'
  });

  function getRuntimeEnvironment(runtime = root, realm = 'window') {
    const protocol = runtime.location && runtime.location.protocol;
    const scheme = { 'http:': 'http', 'https:': 'https', 'file:': 'file' }[protocol] || 'other';
    const hostname = String(runtime.location && runtime.location.hostname || '').toLowerCase();
    const ipv4 = /^127(?:\.\d{1,3}){3}$/.test(hostname) && hostname.split('.').every(part => Number(part) <= 255);
    const loopback = hostname === 'localhost' || hostname === '::1' || hostname === '[::1]' || ipv4;
    return { scheme, hostClass: loopback ? 'loopback' : hostname ? 'remote' : 'none',
      secureContext: runtime.isSecureContext === true, realm: RUNTIME_ENUMS.realm.includes(realm) ? realm : 'window' };
  }

  function createRuntimeDiagnostic(code, context = {}) {
    const safeCode = Object.prototype.hasOwnProperty.call(MESSAGES, code) ? code : 'INTERNAL_ERROR';
    const environment = context.environment || getRuntimeEnvironment(root, context.realm);
    const safeEnvironment = {};
    for (const key of ['scheme', 'hostClass', 'realm']) {
      safeEnvironment[key] = RUNTIME_ENUMS[key].includes(environment[key]) ? environment[key] : { scheme: 'other', hostClass: 'none', realm: 'window' }[key];
    }
    safeEnvironment.secureContext = environment.secureContext === true;
    return { v: 1, code: safeCode,
      phase: RUNTIME_ENUMS.phase.includes(context.phase) ? context.phase : 'preflight',
      component: RUNTIME_ENUMS.component.includes(context.component) ? context.component : 'importer',
      generation: Number.isSafeInteger(context.generation) && context.generation >= 0 ? context.generation : 0,
      environment: safeEnvironment,
      missingCapabilities: [...new Set((Array.isArray(context.missingCapabilities) ? context.missingCapabilities : [])
        .filter(capability => RUNTIME_ENUMS.capability.includes(capability)))],
      action: RUNTIME_ACTIONS[safeCode] || 'select-valid-export' };
  }

  function validateRuntimeDiagnostic(diagnostic, generation) {
    try {
      const fields = ['v', 'code', 'phase', 'component', 'generation', 'environment', 'missingCapabilities', 'action'];
      if (!diagnostic || typeof diagnostic !== 'object' || Object.keys(diagnostic).length !== fields.length ||
          Object.keys(diagnostic).some(key => !fields.includes(key)) || diagnostic.v !== 1 ||
          !Object.prototype.hasOwnProperty.call(MESSAGES, diagnostic.code) || !RUNTIME_ENUMS.phase.includes(diagnostic.phase) ||
          !RUNTIME_ENUMS.component.includes(diagnostic.component) || !Number.isSafeInteger(diagnostic.generation) || diagnostic.generation < 0 ||
          (generation !== undefined && diagnostic.generation !== generation)) return null;
      const environment = diagnostic.environment;
      if (!environment || Object.keys(environment).length !== 4 || Object.keys(environment).some(key => !['scheme', 'hostClass', 'secureContext', 'realm'].includes(key)) ||
          !RUNTIME_ENUMS.scheme.includes(environment.scheme) || !RUNTIME_ENUMS.hostClass.includes(environment.hostClass) ||
          !RUNTIME_ENUMS.realm.includes(environment.realm) || typeof environment.secureContext !== 'boolean') return null;
      const missing = diagnostic.missingCapabilities;
      if (!Array.isArray(missing) || missing.length > RUNTIME_ENUMS.capability.length || new Set(missing).size !== missing.length ||
          missing.some(capability => !RUNTIME_ENUMS.capability.includes(capability)) ||
          diagnostic.action !== (RUNTIME_ACTIONS[diagnostic.code] || 'select-valid-export')) return null;
      return createRuntimeDiagnostic(diagnostic.code, diagnostic);
    } catch (error) {
      return null;
    }
  }

  function runtimeFailure(code, context = {}) {
    const diagnostic = createRuntimeDiagnostic(code, context);
    const error = failure(diagnostic.code);
    if (diagnostic.missingCapabilities.length) error.message += ` Missing: ${diagnostic.missingCapabilities.join(', ')}.`;
    return Object.assign(error, { diagnostic });
  }

  function inspectRuntimeCapabilities(runtime = root, realm = 'window', generation = 0) {
    const environment = getRuntimeEnvironment(runtime, realm);
    const context = { generation, environment, phase: realm === 'worker' ? 'capabilities' : 'preflight', component: 'deployment' };
    if (!['http', 'https'].includes(environment.scheme)) return createRuntimeDiagnostic('UNSUPPORTED_DEPLOYMENT', context);
    if (!environment.secureContext || (environment.scheme === 'http' && environment.hostClass !== 'loopback')) return createRuntimeDiagnostic('INSECURE_CONTEXT', context);
    const required = realm === 'worker' ? ['ReadableStream', 'WritableStream', 'TextEncoder', 'TextDecoder', 'AbortController'] : ['Worker'];
    const missingCapabilities = required.filter(capability => typeof runtime[capability] !== 'function');
    if (realm === 'worker' && (!runtime.crypto || !runtime.crypto.subtle || typeof runtime.crypto.subtle.digest !== 'function')) missingCapabilities.push('crypto.subtle.digest');
    if (!missingCapabilities.length) return null;
    const component = missingCapabilities.includes('crypto.subtle.digest') ? 'crypto' : missingCapabilities.some(name => /Text/.test(name)) ? 'text'
      : missingCapabilities.some(name => /Stream/.test(name)) ? 'stream' : realm === 'window' ? 'worker' : 'importer';
    return createRuntimeDiagnostic('MISSING_CAPABILITY', { ...context, component, missingCapabilities });
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
    if (typeof TextEncoder !== 'function') throw runtimeFailure('MISSING_CAPABILITY', { phase: 'hashing', component: 'text', missingCapabilities: ['TextEncoder'] });
    if (!root.crypto || !root.crypto.subtle || typeof root.crypto.subtle.digest !== 'function') {
      throw runtimeFailure('MISSING_CAPABILITY', { phase: 'hashing', component: 'crypto', missingCapabilities: ['crypto.subtle.digest'] });
    }
    const bytes = new TextEncoder().encode(value);
    try {
      const hash = await root.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      throw runtimeFailure('HASH_FAILED', { phase: 'hashing', component: 'crypto' });
    }
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
    function heartRateExtreme(field) {
      const candidates = raw.statistics.filter(statistic => statistic.type === 'HKQuantityTypeIdentifierHeartRate' && statistic[field] !== undefined);
      let invalidReason = null;
      const values = candidates.map(statistic => {
        if (statistic.startDate !== undefined || statistic.endDate !== undefined) {
          const statisticStart = parseTimestamp(statistic.startDate);
          const statisticEnd = parseTimestamp(statistic.endDate);
          if (!statisticStart || !statisticEnd || statisticStart.instant.getTime() !== start.instant.getTime() ||
              statisticEnd.instant.getTime() !== end.instant.getTime()) {
            invalidReason = 'invalid_boundary';
            return null;
          }
        }
        if (!Object.prototype.hasOwnProperty.call(UNITS.heartRate, statistic.unit)) {
          invalidReason = 'unknown_unit';
          return null;
        }
        const value = quantity(statistic[field], statistic.unit, 'heartRate');
        if (value !== null && value > 0) return value;
        if (!invalidReason) invalidReason = 'invalid_value';
        return null;
      });
      const value = values.length && values[0] !== null && values.every(candidate => candidate === values[0]) ? values[0] : null;
      const status = !values.length ? 'missing' : value !== null ? 'valid' : !invalidReason ? 'conflict' :
        ['invalid_boundary', 'unknown_unit'].includes(invalidReason) ? 'unqualified' : 'invalid';
      return { value, status, source: values.length ? 'summary' : null,
        reason: status === 'valid' ? null : status === 'missing' ? 'missing' : invalidReason || 'conflict', sampleCount: null, readComplete: null };
    }
    const heartRateProvenance = { minimum: heartRateExtreme('minimum'), maximum: heartRateExtreme('maximum') };
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
      minHeartRate: heartRateProvenance.minimum.value,
      maxHeartRate: heartRateProvenance.maximum.value,
      heartRateProvenance,
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

  const api = { failure, runtimeFailure, getRuntimeEnvironment, createRuntimeDiagnostic, validateRuntimeDiagnostic, inspectRuntimeCapabilities,
    number, quantity, parseTimestamp, calendarDates, canonical, digest, diagnostics, count,
    normalizeWorkout, reduceSamples };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.appleHealthUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);