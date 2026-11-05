(function exposeAppleHealthImporter(root) {
  'use strict';
  const utils = typeof module !== 'undefined' && module.exports ? require('./apple-health-utils') : root.appleHealthUtils;
  const LIMITS = Object.freeze({
    fileBytes: 8 * 1024 ** 3, directoryBytes: 32 * 1024 ** 2, entries: 100000, pathBytes: 1024,
    mainBytes: 8 * 1024 ** 3, totalBytes: 24 * 1024 ** 3, chunkBytes: 65536, depth: 64,
    attributes: 128, tokenBytes: 65536, workouts: 100000, samplesPerMetric: 50000, samples: 2000000,
    gpxBytes: 32 * 1024 ** 2, pointsPerActivity: 500000, points: 2000000, resultBytes: 128 * 1024 ** 2
  });

  function xmlConsumer(handlers, dependencies) {
    const limits = { ...LIMITS, ...dependencies.limits };
    const sax = dependencies.sax || root.sax;
    if (!sax) throw utils.runtimeFailure('DEPENDENCY_LOAD_FAILED', { phase: 'dependencies', component: 'sax' });
    if (typeof sax.parser !== 'function') throw utils.runtimeFailure('DEPENDENCY_INVALID', { phase: 'dependencies', component: 'sax' });
    if (typeof TextDecoder !== 'function') throw utils.runtimeFailure('MISSING_CAPABILITY', { phase: 'capabilities', component: 'text', missingCapabilities: ['TextDecoder'] });
    const parser = sax.parser(true, { strictEntities: true, position: true, trim: false });
    if (!parser || typeof parser.write !== 'function' || typeof parser.close !== 'function') throw utils.runtimeFailure('DEPENDENCY_INVALID', { phase: 'dependencies', component: 'sax' });
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const stack = [];
    let workout = null;
    let record = null;
    let bytes = 0;
    let roots = 0;
    let closed = false;
    parser.onerror = () => { throw utils.failure('INVALID_XML'); };
    parser.ondoctype = declaration => {
      if (declaration.length > limits.tokenBytes) throw utils.failure('RESOURCE_LIMIT');
      const bare = declaration.replace(/<!--[\s\S]*?-->/g, '').replace(/"[^"]*"|'[^']*'/g, '');
      if (!/^\s*HealthData(?:\s|\[|$)/.test(bare) || /<!\s*ENTITY\b|\b(?:SYSTEM|PUBLIC)\b|%/i.test(bare)) throw utils.failure('UNSAFE_XML');
    };
    parser.onprocessinginstruction = instruction => {
      if (instruction.name.toLowerCase() === 'xml') {
        const encoding = instruction.body.match(/encoding\s*=\s*["']([^"']+)["']/i);
        if (encoding && !/^utf-8$/i.test(encoding[1])) throw utils.failure('UNSUPPORTED_ENCODING');
      }
    };
    parser.onopentag = tag => {
      stack.push(tag.name);
      if (stack.length > limits.depth || Object.keys(tag.attributes).length > limits.attributes) throw utils.failure('RESOURCE_LIMIT');
      for (const [key, value] of Object.entries(tag.attributes)) {
        if (key.length + String(value).length > limits.tokenBytes) throw utils.failure('RESOURCE_LIMIT');
      }
      if (stack.length === 1 && (tag.name !== 'HealthData' || ++roots !== 1)) throw utils.failure('INVALID_XML');
      const attributes = Object.assign(Object.create(null), tag.attributes);
      if (tag.name === 'Workout') {
        if (stack.length !== 2 || workout) throw utils.failure('INVALID_XML');
        workout = { attributes, statistics: [], metadata: Object.create(null), events: [], routes: [] };
      } else if (tag.name === 'Record' && stack.length === 2) {
        if (handlers.recordType) handlers.recordType(attributes.type);
        if (handlers.record && (!handlers.acceptRecord || handlers.acceptRecord(attributes))) record = { attributes, metadata: Object.create(null) };
      } else if (tag.name === 'WorkoutStatistics' && workout) {
        if (workout.statistics.length >= 128) throw utils.failure('RESOURCE_LIMIT');
        workout.statistics.push(attributes);
      } else if (tag.name === 'MetadataEntry') {
        const owner = stack[stack.length - 2];
        const target = owner === 'Workout' && workout ? workout.metadata : owner === 'Record' && record ? record.metadata : null;
        if (target) {
          if (Object.keys(target).length >= 128) throw utils.failure('RESOURCE_LIMIT');
          target[attributes.key] = attributes.value;
        }
      } else if (tag.name === 'WorkoutEvent' && workout) {
        if (workout.events.length >= 10000) throw utils.failure('RESOURCE_LIMIT');
        workout.events.push(attributes);
      } else if (tag.name === 'FileReference' && workout && stack.includes('WorkoutRoute')) {
        if (workout.routes.length >= 1000) throw utils.failure('RESOURCE_LIMIT');
        workout.routes.push(attributes.path);
      }
    };
    parser.onclosetag = name => {
      if (name === 'Workout' && workout) { if (handlers.workout) handlers.workout(workout); workout = null; }
      if (name === 'Record' && record) { handlers.record(record); record = null; }
      if (stack.pop() !== name) throw utils.failure('INVALID_XML');
      if (name === 'HealthData') closed = true;
    };
    function guard(callback) {
      try { return callback(); } catch (error) {
        if (error && error.code && utils.failure(error.code).code === error.code) throw utils.runtimeFailure(error.code,
          utils.validateRuntimeDiagnostic(error.diagnostic) || { phase: 'parsing', component: 'sax' });
        throw utils.runtimeFailure('INTERNAL_ERROR', { phase: 'parsing', component: 'sax' });
      }
    }
    function decode(chunk, options) {
      try { return decoder.decode(chunk, options); }
      catch (error) { throw utils.failure('UNSUPPORTED_ENCODING'); }
    }
    return {
      write(chunk) {
        bytes += chunk.byteLength;
        if (bytes > limits.mainBytes) throw utils.failure('RESOURCE_LIMIT');
        guard(() => {
          for (let offset = 0; offset < chunk.length; offset += limits.chunkBytes) {
            parser.write(decode(chunk.subarray(offset, offset + limits.chunkBytes), { stream: true }));
          }
        });
      },
      close() {
        guard(() => { parser.write(decode()); parser.close(); });
        if (!closed || roots !== 1 || stack.length) throw utils.failure('INVALID_XML');
      }
    };
  }

  async function parseHealthXml(chunks, handlers = {}, dependencies = {}) {
    const consumer = xmlConsumer(handlers, dependencies);
    for await (const chunk of chunks) {
      if (dependencies.signal && dependencies.signal.aborted) throw utils.failure('CANCELLED');
      consumer.write(chunk);
    }
    consumer.close();
  }

  function safePath(path, allowLeading = false) {
    if (typeof path !== 'string' || path.includes('\0') || /:/.test(path)) throw utils.failure('INVALID_ARCHIVE');
    const normalized = path.replace(/\\/g, '/');
    if ((!allowLeading && normalized.startsWith('/')) || normalized.split('/').includes('..')) throw utils.failure('INVALID_ARCHIVE');
    return normalized.split('/').filter(part => part && part !== '.').join('/');
  }

  function hasCompletePointPowerCoverage(samples, activeWindows) {
    if (!Array.isArray(samples) || !samples.length || !Array.isArray(activeWindows) || !activeWindows.length ||
        samples.some(sample => sample.startMs !== sample.endMs)) return false;
    const ordered = samples.slice().sort((first, second) => first.startMs - second.startMs);
    return activeWindows.every(([windowStart, windowEnd]) => {
      const points = ordered.filter(sample => sample.startMs >= windowStart && sample.startMs < windowEnd);
      if (points.length < 2 || points[0].startMs - windowStart > 5000 || windowEnd - points[points.length - 1].startMs > 5000) return false;
      return points.slice(1).every((sample, index) => sample.startMs - points[index].startMs <= 5000);
    });
  }

  async function checkDirectory(file, limits) {
    const start = Math.max(0, file.size - 65557);
    const bytes = new Uint8Array(await file.slice(start).arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let found = -1;
    for (let offset = bytes.length - 22; offset >= 0; offset--) {
      if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === bytes.length) { found = offset; break; }
    }
    if (found < 0) throw utils.failure('INVALID_ARCHIVE');
    let size = view.getUint32(found + 12, true);
    let entries = view.getUint16(found + 10, true);
    if (size === 0xffffffff || entries === 0xffff) {
      if (found < 20 || view.getUint32(found - 20, true) !== 0x07064b50) throw utils.failure('INVALID_ARCHIVE');
      const offset = Number(view.getBigUint64(found - 12, true));
      if (!Number.isSafeInteger(offset) || offset < 0 || offset + 56 > file.size) throw utils.failure('INVALID_ARCHIVE');
      const zip64 = new DataView(await file.slice(offset, offset + 56).arrayBuffer());
      if (zip64.getUint32(0, true) !== 0x06064b50) throw utils.failure('INVALID_ARCHIVE');
      size = Number(zip64.getBigUint64(40, true));
      entries = Number(zip64.getBigUint64(32, true));
    }
    if (size > limits.directoryBytes || entries > limits.entries) throw utils.failure('RESOURCE_LIMIT');
  }

  async function importAppleHealthZip(file, reportProgress, dependencies = {}) {
    if (!file || typeof file.slice !== 'function' || !Number.isFinite(file.size)) throw utils.failure('INVALID_ARCHIVE');
    const limits = { ...LIMITS, ...dependencies.limits };
    if (file.size > limits.fileBytes) throw utils.failure('RESOURCE_LIMIT');
    const zip = dependencies.zip || root.zip;
    if (!zip) throw utils.runtimeFailure('DEPENDENCY_LOAD_FAILED', { phase: 'dependencies', component: 'zip' });
    if (typeof zip.ZipReader !== 'function' || typeof zip.BlobReader !== 'function') throw utils.runtimeFailure('DEPENDENCY_INVALID', { phase: 'dependencies', component: 'zip' });
    const missingCapabilities = [['WritableStream', typeof WritableStream], ['ReadableStream', typeof ReadableStream], ['TextEncoder', typeof TextEncoder]]
      .filter(([, type]) => type !== 'function').map(([name]) => name);
    if (missingCapabilities.length) throw utils.runtimeFailure('MISSING_CAPABILITY', { phase: 'capabilities',
      component: missingCapabilities.includes('TextEncoder') ? 'text' : 'stream', missingCapabilities });
    const powerPbUtils = dependencies.powerPbUtils || (typeof module !== 'undefined' && module.exports
      ? require('./power-pb-utils') : root.powerPbUtils);
    const report = utils.diagnostics();
    const candidates = [];
    const recordTypes = new Set();
    const clock = dependencies.clock || Date.now;
    const yieldWork = dependencies.yield || (() => new Promise(resolve => setTimeout(resolve, 0)));
    const hash = async value => {
      try {
        const result = await (dependencies.hash || utils.digest)(value);
        if (typeof result !== 'string' || !/^[a-f0-9]{64}$/i.test(result)) throw utils.runtimeFailure('HASH_FAILED', { phase: 'hashing', component: 'crypto' });
        return result;
      } catch (error) {
        if (error && ['HASH_FAILED', 'MISSING_CAPABILITY'].includes(error.code)) throw utils.runtimeFailure(error.code,
          utils.validateRuntimeDiagnostic(error.diagnostic) || { phase: 'hashing', component: 'crypto' });
        throw utils.runtimeFailure('HASH_FAILED', { phase: 'hashing', component: 'crypto' });
      }
    };
    const archiveError = error => {
      if (error && error.code && utils.failure(error.code).code === error.code) return utils.runtimeFailure(error.code,
        utils.validateRuntimeDiagnostic(error.diagnostic) || { phase: 'parsing', component: 'importer' });
      const knownInputError = error && Object.keys(zip).some(key => /^ERR_/.test(key) && typeof zip[key] === 'string' && zip[key] === error.message);
      return utils.runtimeFailure(knownInputError ? 'INVALID_ARCHIVE' : 'INTERNAL_ERROR', { phase: 'parsing', component: knownInputError ? 'zip' : 'importer' });
    };
    let totalBytes = 0;
    const processedBytes = { workoutXml: 0, enrichmentXml: 0, routeXml: 0 };
    let lastYield = clock();
    let lastProgress = -Infinity;
    let lastPercent = 0;
    function aborted() { if (dependencies.signal && dependencies.signal.aborted) throw utils.failure('CANCELLED'); }
    function progress(phase, percent, force = false) {
      if (!reportProgress || (!force && clock() - lastProgress < 1000)) return;
      lastProgress = clock();
      lastPercent = Math.max(lastPercent, Math.min(100, percent));
      reportProgress({ phase, stage: phase, percent: lastPercent, processedBytes: totalBytes, processedWorkouts: candidates.length });
    }
    async function tick() {
      aborted();
      if (clock() - lastYield >= 8) { await yieldWork(); lastYield = clock(); }
    }
    let reader;
    try {
      aborted();
      await checkDirectory(file, limits);
      const blobReader = new zip.BlobReader(file);
      if (!blobReader || typeof blobReader.readUint8Array !== 'function') throw utils.runtimeFailure('DEPENDENCY_INVALID', { phase: 'dependencies', component: 'zip' });
      const originalRead = blobReader.readUint8Array.bind(blobReader);
      blobReader.readUint8Array = (offset, length, ...rest) => {
        if (length > limits.directoryBytes) throw utils.failure('RESOURCE_LIMIT');
        return originalRead(offset, length, ...rest);
      };
      reader = new zip.ZipReader(blobReader, { useWebWorkers: false, chunkSize: limits.chunkBytes });
      if (!reader || typeof reader.getEntriesGenerator !== 'function' || typeof reader.close !== 'function') throw utils.runtimeFailure('DEPENDENCY_INVALID', { phase: 'dependencies', component: 'zip' });
      const entries = new Map();
      const primary = [];
      for await (const entry of reader.getEntriesGenerator()) {
        aborted();
        const name = safePath(entry.filename);
        if (entries.has(name)) throw utils.failure('INVALID_ARCHIVE');
        if (new TextEncoder().encode(name).length > limits.pathBytes || entries.size >= limits.entries) throw utils.failure('RESOURCE_LIMIT');
        entries.set(name, entry);
        if (!entry.directory && !name.startsWith('__MACOSX/') && /(?:^|\/)export\.xml$/i.test(name)) primary.push([name, entry]);
      }
      if (!primary.length) throw utils.failure('MISSING_EXPORT');
      if (primary.length !== 1) throw utils.failure('AMBIGUOUS_EXPORT');
      const [primaryName, main] = primary[0];
      if (main.encrypted) throw utils.failure('INVALID_ARCHIVE');
      const base = primaryName.includes('/') ? primaryName.slice(0, primaryName.lastIndexOf('/')) : '';
      async function readMain(handlers, phase, start, span) {
        const consumer = xmlConsumer(handlers, { ...dependencies, limits });
        let bytes = 0;
        let sinkError = null;
        try {
          await main.getData(new WritableStream({ async write(chunk) {
            try {
              aborted();
              totalBytes += chunk.byteLength;
              bytes += chunk.byteLength;
              processedBytes[phase === 'readingWorkouts' ? 'workoutXml' : 'enrichmentXml'] += chunk.byteLength;
              if (totalBytes > limits.totalBytes) throw utils.failure('RESOURCE_LIMIT');
              consumer.write(chunk);
              progress(phase, start + span * Math.min(1, bytes / Math.max(1, main.uncompressedSize)));
              await tick();
            } catch (error) { sinkError = error; throw error; }
          } }), { useWebWorkers: false, checkSignature: true, signal: dependencies.signal });
        } catch (error) { throw sinkError || archiveError(error); }
        consumer.close();
        progress(phase, start + span, true);
      }
      await readMain({
        recordType(type) { if (['HKQuantityTypeIdentifierHeartRate', 'HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierCyclingPower', 'HKQuantityTypeIdentifierCyclingCadence'].includes(type)) recordTypes.add(type); utils.count(report.ignoredRecordTypes, type); },
        workout(raw) {
          const candidate = utils.normalizeWorkout(raw, report);
          if (candidate) {
            if (candidates.length >= limits.workouts) throw utils.failure('RESOURCE_LIMIT');
            candidates.push(candidate);
          }
        }
      }, 'readingWorkouts', 0, 45);
      const deduplicated = [];
      const seen = new Set();
      const external = new Map();
      const ordinals = new Map();
      for (const candidate of candidates) {
        const fingerprint = await hash(candidate.fingerprint);
        if ((candidate.completeIdentity || candidate.external) && seen.has(fingerprint)) { report.duplicateCount++; continue; }
        seen.add(fingerprint);
        if (candidate.external) {
          if (external.has(candidate.external) && external.get(candidate.external) !== fingerprint) report.identityConflictCount++;
          external.set(candidate.external, fingerprint);
        }
        const ordinal = ordinals.get(fingerprint) || 0;
        ordinals.set(fingerprint, ordinal + 1);
        candidate.activity.id = 'ah-' + fingerprint + (ordinal ? '-' + ordinal : '');
        candidate.fingerprint = null;
        deduplicated.push(candidate);
        progress('normalizing', 48);
        await tick();
      }
      if (!deduplicated.length) throw utils.failure('NO_SUPPORTED_WORKOUTS');
      const bySource = new Map();
      for (const candidate of deduplicated) {
        if (!bySource.has(candidate.source)) bySource.set(candidate.source, []);
        bySource.get(candidate.source).push(candidate);
      }
      for (const list of bySource.values()) {
        list.sort((first, second) => first.startMs - second.startMs);
        let maximum = -Infinity;
        for (const candidate of list) { maximum = Math.max(maximum, candidate.endMs); candidate.prefixEnd = maximum; }
      }
      const metrics = {
        HKQuantityTypeIdentifierHeartRate: ['heartRate', 'avgHeartRate'],
        HKQuantityTypeIdentifierStepCount: ['steps', 'totalSteps'],
        HKQuantityTypeIdentifierCyclingPower: ['power', 'avgWatts'],
        HKQuantityTypeIdentifierCyclingCadence: ['cadence', 'avgCadence']
      };
      let sampleCount = 0;
      const needsPowerSeries = recordTypes.has('HKQuantityTypeIdentifierCyclingPower') &&
        deduplicated.some(candidate => candidate.activity.sport === 'Bike');
      const acceptedRecordTypes = new Set([...recordTypes].filter(type => {
        const definition = metrics[type];
        if (!definition) return false;
        if (type === 'HKQuantityTypeIdentifierHeartRate') return deduplicated.some(candidate => candidate.activity.avgHeartRate === null);
        if (type === 'HKQuantityTypeIdentifierStepCount') return deduplicated.some(candidate =>
          candidate.activity.sport === 'Run' && (candidate.activity.totalSteps === null || candidate.activity.avgCadence === null));
        if (type === 'HKQuantityTypeIdentifierCyclingCadence') return deduplicated.some(candidate =>
          candidate.activity.sport === 'Bike' && candidate.activity.avgCadence === null);
        if (type === 'HKQuantityTypeIdentifierCyclingPower') return needsPowerSeries || deduplicated.some(candidate =>
          candidate.activity.sport === 'Bike' && candidate.activity.avgWatts === null);
        return false;
      }));
      const needsScalarEnrichment = acceptedRecordTypes.size > 0;
      if (needsScalarEnrichment || needsPowerSeries) {
        await readMain({
          acceptRecord(attributes) { return acceptedRecordTypes.has(attributes.type) && bySource.has(String(attributes.sourceName || '').trim()); },
          record(raw) {
            const attributes = raw.attributes;
            const [metric, field] = metrics[attributes.type];
            const source = String(attributes.sourceName || '').trim();
            if (!source) return;
            const start = utils.parseTimestamp(attributes.startDate);
            const end = utils.parseTimestamp(attributes.endDate);
            const value = utils.quantity(attributes.value, attributes.unit, metric);
            if (!start || !end || end.instant < start.instant || value === null || (metric !== 'steps' && value <= 0)) return;
            const startMs = start.instant.getTime();
            const endMs = end.instant.getTime();
            const list = bySource.get(source);
            let lower = 0;
            let upper = list.length;
            while (lower < upper) { const middle = Math.floor((lower + upper) / 2); if (list[middle].startMs <= startMs) lower = middle + 1; else upper = middle; }
            const owners = [];
            for (let index = lower - 1; index >= 0 && list[index].prefixEnd >= endMs; index--) {
              const candidate = list[index];
              if ((metric === 'steps' && candidate.activity.sport !== 'Run') || ((metric === 'power' || metric === 'cadence') && candidate.activity.sport !== 'Bike')) continue;
              if (candidate.device && candidate.device !== attributes.device) continue;
              if (candidate.activeWindows && candidate.activeWindows.some(window => startMs >= window[0] && endMs <= window[1] && (startMs !== endMs || startMs < window[1]))) owners.push(candidate);
            }
            if (owners.length !== 1) { if (owners.length) utils.count(report.unavailableByMetricAndReason, metric + ':ambiguous'); return; }
            const candidate = owners[0];
            if (candidate.activity[field] !== null && metric !== 'power') return;
            if (candidate.samples[metric] === null) return;
            const samples = candidate.samples[metric] || (candidate.samples[metric] = []);
            if (samples.length >= limits.samplesPerMetric || sampleCount >= limits.samples) {
              sampleCount -= samples.length;
              candidate.samples[metric] = null;
              utils.count(report.unavailableByMetricAndReason, metric + ':sampleLimit');
              return;
            }
            samples.push({ startMs, endMs, value, device: attributes.device || '' });
            sampleCount++;
          }
        }, 'enrichingMeasurements', 50, 35);
      }
      const fitBestEffortsByActivityId = Object.create(null);
      for (const candidate of deduplicated) {
        for (const [metric, field] of [['heartRate', 'avgHeartRate'], ['steps', 'totalSteps'], ['power', 'avgWatts'], ['cadence', 'avgCadence']]) {
          const samples = candidate.samples[metric];
          if (!samples) continue;
          const reduced = utils.reduceSamples(samples, candidate.activeWindows, metric === 'steps');
          const powerAverageCovered = metric !== 'power' || (candidate.completeActiveTime &&
            hasCompletePointPowerCoverage(samples, candidate.activeWindows));
          if (candidate.activity[field] === null && reduced && powerAverageCovered &&
              (metric !== 'steps' || candidate.completeActiveTime)) {
            candidate.activity[field] = reduced.value > 0 ? reduced.value : null;
          }
          if (!reduced) utils.count(report.unavailableByMetricAndReason, metric + ':ambiguousOrIncomplete');
        }
        const powerSamples = candidate.samples.power;
        if (candidate.activity.sport === 'Bike' && Array.isArray(powerSamples) && powerSamples.length > 1 &&
            powerPbUtils && typeof powerPbUtils.calculatePowerEffortsForDurations === 'function') {
          const orderedPowerSamples = powerSamples.slice().sort((first, second) => first.startMs - second.startMs);
          const pointSamples = orderedPowerSamples.every(sample => sample.startMs === sample.endMs);
          const maximumGapSeconds = orderedPowerSamples.slice(1).reduce((maximum, sample, index) =>
            Math.max(maximum, (sample.startMs - orderedPowerSamples[index].startMs) / 1000), 0);
          if (!pointSamples || maximumGapSeconds > 5) {
            utils.count(report.unavailableByMetricAndReason, 'power:incompleteSeries');
          } else {
            const relativeRecords = orderedPowerSamples.map(sample => ({
              tSec: (sample.startMs - candidate.startMs) / 1000,
              distKm: 0,
              power: sample.value
            }));
            const efforts = powerPbUtils.calculatePowerEffortsForDurations(relativeRecords, powerPbUtils.POWER_DURATIONS);
            if (efforts.length) {
              fitBestEffortsByActivityId[candidate.activity.id] = {
                powerEfforts: efforts.map(effort => ({ ...effort, startKm: null, endKm: null }))
              };
            }
          }
        }
        if (candidate.activity.sport === 'Run' && candidate.activity.avgCadence === null && candidate.activity.totalSteps && candidate.completeActiveTime && candidate.activity.duration > 0) {
          candidate.activity.avgCadence = candidate.activity.totalSteps * 60 / candidate.activity.duration;
        }
      }
      const gpsTracksByActivityId = Object.create(null);
      const extractPoints = dependencies.extractGpxTrackpoints || (typeof module !== 'undefined' && module.exports ? require('./zip-importer').extractGpxTrackpoints : root.extractGpxTrackpoints);
      let pointCount = 0;
      const routeCache = new Map();
      for (let index = 0; index < deduplicated.length; index++) {
        const candidate = deduplicated[index];
        const segments = [];
        const resolved = new Set();
        for (const reference of candidate.routes) {
          try {
            const clean = safePath(reference, true);
            const name = clean.startsWith(base + '/') ? clean : [base, clean].filter(Boolean).join('/');
            if (resolved.has(name)) continue;
            resolved.add(name);
            const entry = entries.get(name);
            if (!entry || !/\.gpx$/i.test(name) || entry.encrypted || entry.uncompressedSize > limits.gpxBytes) throw utils.failure('INVALID_ARCHIVE');
            if (!routeCache.has(name)) {
              const chunks = [];
              let size = 0;
              const decoder = new TextDecoder('utf-8', { fatal: true });
              await entry.getData(new WritableStream({ async write(chunk) {
                aborted(); size += chunk.length; totalBytes += chunk.length;
                processedBytes.routeXml += chunk.length;
                if (size > limits.gpxBytes || totalBytes > limits.totalBytes) throw utils.failure('RESOURCE_LIMIT');
                chunks.push(decoder.decode(chunk, { stream: true })); await tick();
              } }), { useWebWorkers: false, checkSignature: true, signal: dependencies.signal });
              const xml = chunks.join('') + decoder.decode();
              const paths = [];
              const subpaths = xml.match(/<trkseg\b[^>]*>[\s\S]*?<\/trkseg>/g) || [xml];
              for (const subpath of subpaths) {
                let points = [];
                for (const match of subpath.matchAll(/<trkpt\b[^>]*(?:\/>|>[\s\S]*?<\/trkpt>)/g)) {
                  const parsed = extractPoints ? extractPoints(match[0]) : [];
                  const parsedPoint = parsed[0];
                  const point = Array.isArray(parsedPoint) ? parsedPoint : parsedPoint && [parsedPoint.lat, parsedPoint.lon];
                  if (point && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180) points.push(point);
                  else { if (points.length >= 2) paths.push(points); points = []; }
                }
                if (points.length >= 2) paths.push(points);
              }
              routeCache.set(name, paths);
            }
            segments.push(...routeCache.get(name));
          } catch (error) {
            if (dependencies.signal && dependencies.signal.aborted) throw utils.failure('CANCELLED');
            report.skippedRouteCount++;
          }
        }
        const size = segments.reduce((sum, segment) => sum + segment.length, 0);
        if (size > limits.pointsPerActivity || pointCount + size > limits.points) { report.skippedRouteCount++; continue; }
        if (size) {
          pointCount += size;
          gpsTracksByActivityId[candidate.activity.id] = { sport: candidate.activity.sport, points: segments.flat(), segments };
        }
        progress('readingRoutes', 85 + 13 * (index + 1) / deduplicated.length);
        await tick();
      }
      const activities = deduplicated.map(candidate => candidate.activity).sort((first, second) => first.date - second.date || first.startTime - second.startTime || first.id.localeCompare(second.id));
      report.importedCount = activities.length;
      report.processedBytes = { ...processedBytes, total: totalBytes };
      if (JSON.stringify(activities).length * 2 + pointCount * 32 > limits.resultBytes) throw utils.failure('RESOURCE_LIMIT');
      progress('finalizing', 100, true);
      return { activities, gpsTracksByActivityId, fitBestEffortsByActivityId, diagnostics: report };
    } catch (error) {
      if (dependencies.signal && dependencies.signal.aborted) throw utils.failure('CANCELLED');
      throw archiveError(error);
    } finally {
      if (reader && typeof reader.close === 'function') await reader.close().catch(() => {});
    }
  }

  const api = { LIMITS, importAppleHealthZip, parseHealthXml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.appleHealthImporter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);