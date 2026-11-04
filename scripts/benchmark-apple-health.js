#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { createWriteStream } = require('node:fs');
const { mkdir, stat, unlink, writeFile } = require('node:fs/promises');
const { finished } = require('node:stream/promises');
const { Writable } = require('node:stream');
const { performance } = require('node:perf_hooks');
const zip = require('@zip.js/zip.js/index-native.js');

function parseArguments(argumentsList) {
  const options = {
    mode: 'generate', records: null, workouts: 2000, output: 'private-data/apple-health-benchmark.zip',
    cdpUrl: null, url: null, report: 'private-data/apple-health-memory.json',
    workloads: [1000000, 2500000, 4500000], repetitions: 3, sampleIntervalMs: 200, verbose: false
  };
  for (const argument of argumentsList) {
    if (argument === '--help') return null;
    if (argument === '--measure') { options.mode = 'measure'; continue; }
    if (argument === '--verbose') { options.verbose = true; continue; }
    const match = argument.match(/^--(records|workouts|output|cdp-url|url|report|workloads|repetitions|sample-interval-ms)=(.+)$/);
    if (!match) throw new Error(`Unknown option: ${argument}`);
    if (match[1] === 'output') options.output = match[2];
    else if (match[1] === 'report') options.report = match[2];
    else if (match[1] === 'cdp-url') options.cdpUrl = match[2];
    else if (match[1] === 'url') options.url = match[2];
    else if (match[1] === 'workloads') {
      options.workloads = match[2].split(',').map(value => Number(value));
      if (!options.workloads.length || options.workloads.some(value => !Number.isSafeInteger(value) || value <= 0)) {
        throw new Error('Invalid --workloads values.');
      }
    }
    else {
      const value = Number(match[2]);
      const minimum = match[1] === 'records' || match[1] === 'repetitions' || match[1] === 'sample-interval-ms' ? 1 : 0;
      if (!Number.isSafeInteger(value) || value < minimum) {
        throw new Error(`Invalid --${match[1]} value.`);
      }
      options[match[1] === 'sample-interval-ms' ? 'sampleIntervalMs' : match[1]] = value;
    }
  }
  if (options.workouts > 100000) throw new Error('--workouts cannot exceed 100000.');
  if (options.mode === 'measure') {
    if (!options.cdpUrl || !options.url) throw new Error('--measure requires --cdp-url=<local Edge/Chrome debug URL> and --url=<HTTP app URL>.');
    const cdp = new URL(options.cdpUrl);
    if (!['localhost', '127.0.0.1', '::1'].includes(cdp.hostname)) throw new Error('The CDP endpoint must be loopback-only.');
    if (options.sampleIntervalMs > 250) throw new Error('--sample-interval-ms cannot exceed 250.');
    return { ...options, absoluteReport: getPrivateOutputPath(options.report) };
  }
  if (options.records === null) throw new Error('Provide --records=<count> or use --measure.');
  return { ...options, absoluteOutput: getPrivateOutputPath(options.output) };
}

function getPrivateOutputPath(filename) {
  const absoluteOutput = path.resolve(filename);
  const privateDirectory = path.resolve('private-data') + path.sep;
  if (!absoluteOutput.startsWith(privateDirectory)) throw new Error('Benchmark archives must be written under private-data/.');
  return absoluteOutput;
}

function formatAppleTimestamp(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ') + ' +0000';
}

function createWorkout(index) {
  const start = new Date(Date.UTC(2020, 0, 1 + index));
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return `<Workout workoutActivityType="HKWorkoutActivityTypeRunning" sourceName="Synthetic Watch" startDate="${formatAppleTimestamp(start)}" endDate="${formatAppleTimestamp(end)}" duration="30" durationUnit="min"><WorkoutStatistics type="HKQuantityTypeIdentifierDistanceWalkingRunning" sum="5" unit="km"/></Workout>`;
}

function createHealthXmlStream(recordCount, workoutCount) {
  const encoder = new TextEncoder();
  const recordPadding = 'synthetic-irrelevant-record-'.padEnd(520, 'x');
  const irrelevantRecord = `<Record type="HKQuantityTypeIdentifierSyntheticNoise" unit="count" value="1" sourceName="Synthetic Sensor" sourceVersion="1" startDate="2025-01-01 08:00:00 +0000" endDate="2025-01-01 08:00:01 +0000" device="Synthetic device" note="${recordPadding}"/>`;
  const recordsPerChunk = 96;
  const fullRecordChunk = encoder.encode(irrelevantRecord.repeat(recordsPerChunk));
  const workoutsPerChunk = 16;
  let remainingRecords = recordCount;
  let nextWorkout = 0;
  let xmlHeaderSent = false;
  let xmlFooterSent = false;

  return new ReadableStream({
    pull(controller) {
      if (!xmlHeaderSent) {
        xmlHeaderSent = true;
        controller.enqueue(encoder.encode('<?xml version="1.0" encoding="UTF-8"?><HealthData>'));
        return;
      }
      if (remainingRecords > 0) {
        const chunkRecords = Math.min(recordsPerChunk, remainingRecords);
        controller.enqueue(chunkRecords === recordsPerChunk
          ? fullRecordChunk
          : encoder.encode(irrelevantRecord.repeat(chunkRecords)));
        remainingRecords -= chunkRecords;
        return;
      }
      if (nextWorkout < workoutCount) {
        const chunks = [];
        const chunkEnd = Math.min(workoutCount, nextWorkout + workoutsPerChunk);
        for (; nextWorkout < chunkEnd; nextWorkout++) chunks.push(createWorkout(nextWorkout));
        controller.enqueue(encoder.encode(chunks.join('')));
        return;
      }
      if (!xmlFooterSent) {
        xmlFooterSent = true;
        controller.enqueue(encoder.encode('</HealthData>'));
        return;
      }
      controller.close();
    }
  }, { highWaterMark: 1 });
}

async function generateArchive(options) {
  await mkdir(path.dirname(options.absoluteOutput), { recursive: true });
  const output = createWriteStream(options.absoluteOutput, { flags: 'w' });
  const outputFinished = finished(output);
  zip.configure({ useWebWorkers: false, chunkSize: 65536 });
  const writer = new zip.ZipWriter(Writable.toWeb(output), { useWebWorkers: false, level: 6 });
  try {
    await writer.add('apple_health_export/Export.xml', createHealthXmlStream(options.records, options.workouts), {
      level: 6,
      useWebWorkers: false
    });
    await writer.close();
    await outputFinished;
  } catch (error) {
    output.destroy(error);
    await outputFinished.catch(() => {});
    await unlink(options.absoluteOutput).catch(() => {});
    throw error;
  }
  const outputStats = await stat(options.absoluteOutput);
  return {
    file: options.absoluteOutput,
    sourceWorkoutCount: options.workouts,
    irrelevantRecordCount: options.records,
    estimatedUncompressedBytes: Buffer.byteLength('<?xml version="1.0" encoding="UTF-8"?><HealthData></HealthData>') +
      options.records * Buffer.byteLength(`<Record type="HKQuantityTypeIdentifierSyntheticNoise" unit="count" value="1" sourceName="Synthetic Sensor" sourceVersion="1" startDate="2025-01-01 08:00:00 +0000" endDate="2025-01-01 08:00:01 +0000" device="Synthetic device" note="${'synthetic-irrelevant-record-'.padEnd(520, 'x')}"/>`) +
      Array.from({ length: options.workouts }, (_unused, index) => Buffer.byteLength(createWorkout(index))).reduce((sum, size) => sum + size, 0),
    compressedBytes: outputStats.size
  };
}

class DevToolsConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch (_error) { return; }
      if (message.id !== undefined) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        clearTimeout(request.timeout);
        if (message.error) request.reject(new Error(message.error.message || 'CDP command failed.'));
        else request.resolve(message.result || {});
        return;
      }
      const callbacks = this.listeners.get(message.method) || [];
      callbacks.forEach(callback => callback(message.params || {}, message.sessionId || null));
    });
  }

  static async connect(cdpUrl) {
    const response = await fetch(new URL('/json/version', cdpUrl));
    if (!response.ok) throw new Error(`Could not read local CDP endpoint (${response.status}).`);
    const version = await response.json();
    if (!version.webSocketDebuggerUrl) throw new Error('CDP response has no WebSocket endpoint.');
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error('Could not connect to the local browser CDP WebSocket.')), { once: true });
    });
    return new DevToolsConnection(socket);
  }

  on(method, callback) {
    const callbacks = this.listeners.get(method) || [];
    callbacks.push(callback);
    this.listeners.set(method, callbacks);
    return () => this.listeners.set(method, callbacks.filter(candidate => candidate !== callback));
  }

  send(method, params = {}, sessionId = null, timeoutMs = 30000) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() {
    this.pending.forEach(request => {
      clearTimeout(request.timeout);
      request.reject(new Error('CDP connection closed.'));
    });
    this.pending.clear();
    this.socket.close();
  }
}

async function evaluateValue(cdp, sessionId, expression) {
  const response = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (response.exceptionDetails) throw new Error('Browser evaluation failed during benchmark.');
  return response.result && response.result.value;
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function measureBrowserImport(options, inputFile) {
  const log = message => { if (options.verbose) console.error(`[memory-benchmark] ${message}`); };
  const cdp = await DevToolsConnection.connect(options.cdpUrl);
  log('connected to local CDP');
  const workerTargets = new Map();
  const samples = [];
  const measurementErrors = [];
  let pageSessionId = null;
  let pageTargetId = null;
  let sampleInFlight = false;
  let maxProgressGapMs = null;
  let progressSamples = 0;
  let baselineBytes = null;

  const attachWorker = (params, parentSessionId) => {
    if (parentSessionId !== pageSessionId || !params.targetInfo || params.targetInfo.type !== 'worker') return;
    const worker = { sessionId: params.sessionId, ready: null, lastSampleAt: null, sampleCount: 0, detachedAt: null };
    workerTargets.set(worker.sessionId, worker);
    worker.ready = cdp.send('Runtime.enable', {}, worker.sessionId)
      .then(() => cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, worker.sessionId))
      .catch(error => measurementErrors.push(`worker-enable:${error.message}`));
  };
  const detachWorker = (params, parentSessionId) => {
    if (parentSessionId !== pageSessionId) return;
    const worker = workerTargets.get(params.sessionId);
    if (worker) worker.detachedAt = performance.now();
  };
  cdp.on('Target.attachedToTarget', attachWorker);
  cdp.on('Target.detachedFromTarget', detachWorker);

  try {
    const target = await cdp.send('Target.createTarget', { url: 'about:blank' });
    log('created blank page target');
    pageTargetId = target.targetId;
    const attached = await cdp.send('Target.attachToTarget', { targetId: pageTargetId, flatten: true });
    log('attached to page target');
    pageSessionId = attached.sessionId;
    await cdp.send('Page.enable', {}, pageSessionId);
    await cdp.send('Runtime.enable', {}, pageSessionId);
    await cdp.send('DOM.enable', {}, pageSessionId);
    await cdp.send('Network.enable', {}, pageSessionId);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, pageSessionId);
    await cdp.send('Page.setInterceptFileChooserDialog', { enabled: true }, pageSessionId);
    await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, pageSessionId);
    log('enabled flattened worker auto-attach');
    await cdp.send('Page.navigate', { url: options.url }, pageSessionId);

    const pageReadyAt = Date.now() + 120000;
    while (Date.now() < pageReadyAt) {
      const ready = await evaluateValue(cdp, pageSessionId,
        "document.readyState === 'complete' && !!document.getElementById('appleHealthIngestBtn')");
      if (ready) break;
      await delay(200);
    }
    if (!await evaluateValue(cdp, pageSessionId, "!!document.getElementById('appleHealthIngestBtn')")) {
      throw new Error('Apple Health import action did not load at the supplied URL.');
    }
    log('landing page loaded');
    await evaluateValue(cdp, pageSessionId,
      `(() => { window.__benchmarkProgress = []; const stage = document.getElementById('importProgressStage'); const percent = document.getElementById('importProgressPercent'); const observer = new MutationObserver(() => window.__benchmarkProgress.push({ at: performance.now(), stage: stage?.textContent || '', percent: percent?.textContent || '' })); observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style'] }); window.__benchmarkProgressObserver = observer; return true; })()`);

    const sampleMemory = async () => {
      const targets = [{ label: 'main', sessionId: pageSessionId }, ...[...workerTargets.values()]
        .filter(worker => worker.detachedAt === null)
        .map(worker => ({ label: 'worker', sessionId: worker.sessionId, worker }))];
      const contexts = await Promise.all(targets.map(async targetInfo => {
        try {
          if (targetInfo.worker && targetInfo.worker.ready) await targetInfo.worker.ready;
          const heap = await cdp.send('Runtime.getHeapUsage', {}, targetInfo.sessionId, 5000);
          const usedBytes = (heap.usedSize || 0) + (heap.backingStorageSize || 0) + (heap.embedderHeapUsedSize || 0);
          if (targetInfo.worker) {
            targetInfo.worker.lastSampleAt = performance.now();
            targetInfo.worker.sampleCount++;
          }
          return { target: targetInfo.label, usedSize: heap.usedSize || 0,
            backingStorageSize: heap.backingStorageSize || 0, embedderHeapUsedSize: heap.embedderHeapUsedSize || 0,
            totalBytes: usedBytes };
        } catch (error) {
          measurementErrors.push(`${targetInfo.label}-sample:${error.message}`);
          return null;
        }
      }));
      const validContexts = contexts.filter(Boolean);
      const sample = { at: performance.now(), contexts: validContexts,
        totalBytes: validContexts.reduce((sum, context) => sum + context.totalBytes, 0) };
      samples.push(sample);
      return sample;
    };

    const baseline = await sampleMemory();
    log(`sampled pre-import baseline (${workerTargets.size} workers attached)`);
    baselineBytes = baseline.totalBytes;
    let finishedSampling = false;
    const sampleTimer = setInterval(() => {
      if (sampleInFlight || finishedSampling) return;
      sampleInFlight = true;
      sampleMemory().catch(error => measurementErrors.push(`sample:${error.message}`)).finally(() => { sampleInFlight = false; });
    }, options.sampleIntervalMs);

    let fileChooserResolve;
    let fileChooserReject;
    const fileChooserPromise = new Promise((resolve, reject) => { fileChooserResolve = resolve; fileChooserReject = reject; });
    const removeFileChooser = cdp.on('Page.fileChooserOpened', (params, eventSessionId) => {
      if (eventSessionId !== pageSessionId) return;
      removeFileChooser();
      cdp.send('DOM.setFileInputFiles', { files: [inputFile], backendNodeId: params.backendNodeId }, pageSessionId)
        .then(fileChooserResolve, fileChooserReject);
    });

    const buttonBounds = await evaluateValue(cdp, pageSessionId, `(() => {
      const bounds = document.getElementById('appleHealthIngestBtn')?.getBoundingClientRect();
      return bounds && { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    })()`);
    if (!buttonBounds) throw new Error('Apple Health import action has no visible hit target.');
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...buttonBounds }, pageSessionId);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...buttonBounds, button: 'left', clickCount: 1 }, pageSessionId);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...buttonBounds, button: 'left', clickCount: 1 }, pageSessionId);
    try { await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('File chooser did not open.')), 30000);
      fileChooserPromise.then(() => { log('file chooser opened'); resolve(); }, reject).finally(() => clearTimeout(timeout));
    }); }
    catch (error) { removeFileChooser(); clearInterval(sampleTimer); throw error; }

    const importDeadline = Date.now() + 30 * 60 * 1000;
    let finalState = null;
    while (Date.now() < importDeadline) {
      finalState = await evaluateValue(cdp, pageSessionId, `(() => {
        const status = document.getElementById('appleHealthImportStatus')?.textContent || '';
        const error = document.getElementById('importProgressError');
        const detail = document.getElementById('importProgressDetail')?.textContent || '';
        return { status, error: !!error && !error.classList.contains('hidden') ? detail : null,
          pageVisible: document.visibilityState === 'visible', workerProgress: (window.__benchmarkProgress || []).slice(-1)[0] || null };
      })()`);
      if (finalState.error || /\d+ workouts imported/.test(finalState.status)) break;
      await delay(100);
    }
    log(finalState.error ? `import failed: ${finalState.error}` : `import completed: ${finalState.status}`);
    finishedSampling = true;
    clearInterval(sampleTimer);
    if (sampleInFlight) await delay(options.sampleIntervalMs);
    await sampleMemory();
    log(`finished memory sampling (${workerTargets.size} worker targets attached)`);
    const progress = await evaluateValue(cdp, pageSessionId, `(() => {
      window.__benchmarkProgressObserver?.disconnect();
      return window.__benchmarkProgress || [];
    })()`);
    const progressTimes = progress.map(item => item.at).filter(Number.isFinite);
    const progressGapsMs = progressTimes.slice(1).map((value, index) => value - progressTimes[index]);
    const samplingGapsMs = samples.slice(1).map((value, index) => value.at - samples[index].at);
    const peakBytes = samples.reduce((peak, sample) => Math.max(peak, sample.totalBytes - baselineBytes), 0);
    const workerSampleCount = [...workerTargets.values()].reduce((sum, worker) => sum + worker.sampleCount, 0);
    const maxSamplingGapMs = samplingGapsMs.length ? Math.max(...samplingGapsMs) : 0;
    const maxWorkerTailGapMs = [...workerTargets.values()].reduce((maximum, worker) => {
      if (worker.detachedAt === null || worker.lastSampleAt === null) return Math.max(maximum, Infinity);
      return Math.max(maximum, worker.detachedAt - worker.lastSampleAt);
    }, 0);
    const importedMatch = String(finalState && finalState.status || '').match(/^(\d+) workouts imported/);
    return {
      baselineBytes,
      peakDeltaBytes: peakBytes,
      samples,
      workerTargetCount: workerTargets.size,
      workerSampleCount,
      measurementErrors,
      maxSamplingGapMs,
      maxWorkerTailGapMs,
      progressSampleCount: progress.length,
      maxProgressGapMs: progressGapsMs.length ? Math.max(...progressGapsMs) : 0,
      importedWorkoutCount: importedMatch ? Number(importedMatch[1]) : null,
      status: finalState && finalState.status,
      error: finalState && finalState.error,
      pageVisible: finalState && finalState.pageVisible
    };
  } finally {
    if (pageSessionId) await cdp.send('Target.closeTarget', { targetId: pageTargetId }).catch(() => {});
    cdp.close();
  }
}

async function runBrowserMemoryAcceptance(options) {
  const workloadResults = [];
  for (const recordCount of options.workloads) {
    if (options.verbose) console.error(`[memory-benchmark] generating ${recordCount} irrelevant records`);
    const archivePath = getPrivateOutputPath(`private-data/apple-health-${recordCount}.zip`);
    const generated = await generateArchive({ records: recordCount, workouts: options.workouts, absoluteOutput: archivePath });
    if (options.verbose) console.error(`[memory-benchmark] warm-up: ${recordCount}`);
    const warmup = await measureBrowserImport(options, archivePath);
    const repetitions = [];
    for (let repetition = 0; repetition < options.repetitions; repetition++) {
      if (options.verbose) console.error(`[memory-benchmark] measured run ${repetition + 1}/${options.repetitions}: ${recordCount}`);
      repetitions.push(await measureBrowserImport(options, archivePath));
    }
    workloadResults.push({ ...generated, warmup: { ...warmup, samples: undefined }, repetitions });
  }

  const memoryValid = workloadResults.every(workload => workload.repetitions.every(run =>
    run.workerTargetCount > 0 && run.workerSampleCount > 0 && run.measurementErrors.length === 0 &&
    run.maxSamplingGapMs <= 250 && run.maxWorkerTailGapMs <= 250 && run.pageVisible));
  const progressValid = workloadResults.every(workload => workload.repetitions.every(run => run.maxProgressGapMs <= 5000));
  const correctCounts = workloadResults.every(workload => workload.repetitions.every(run =>
    run.importedWorkoutCount === options.workouts && !run.error));
  const worstPeaks = workloadResults.map(workload => Math.max(...workload.repetitions.map(run => run.peakDeltaBytes)));
  const growthBytes = worstPeaks.length >= 2 ? Math.max(...worstPeaks) - Math.min(...worstPeaks) : null;
  const memoryPass = memoryValid && growthBytes !== null && growthBytes <= 64 * 1024 * 1024;
  return {
    acceptance: memoryPass && progressValid && correctCounts ? 'PASS' : !memoryValid ? 'UNVERIFIED' : 'FAIL',
    memory: { validWorkerSampling: memoryValid, worstPeakBytesByWorkload: worstPeaks, growthBytes, limitBytes: 64 * 1024 * 1024 },
    progress: { withinFiveSeconds: progressValid },
    importedCounts: { correct: correctCounts, expected: options.workouts },
    workloadResults
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options) {
    console.log('Generate: node scripts/benchmark-apple-health.js --records=<count> [--workouts=2000] [--output=private-data/<name>.zip]');
    console.log('Measure:  node scripts/benchmark-apple-health.js --measure --cdp-url=http://127.0.0.1:9222 --url=http://localhost:8000/index.html [--repetitions=3]');
    return;
  }
  if (options.mode === 'measure') {
    const result = await runBrowserMemoryAcceptance(options);
    await mkdir(path.dirname(options.absoluteReport), { recursive: true });
    await writeFile(options.absoluteReport, JSON.stringify(result, null, 2), 'utf8');
    console.log(JSON.stringify({ acceptance: result.acceptance, report: options.absoluteReport,
      memory: result.memory, progress: result.progress, importedCounts: result.importedCounts,
      workloadSummaries: result.workloadResults.map(workload => ({ records: workload.irrelevantRecordCount,
        estimatedUncompressedBytes: workload.estimatedUncompressedBytes,
        compressedBytes: workload.compressedBytes,
        warmupImported: workload.warmup.importedWorkoutCount,
        repetitions: workload.repetitions.map(run => ({ imported: run.importedWorkoutCount,
          peakDeltaBytes: run.peakDeltaBytes, workerTargets: run.workerTargetCount, workerSamples: run.workerSampleCount,
          maxSamplingGapMs: run.maxSamplingGapMs, maxWorkerTailGapMs: run.maxWorkerTailGapMs,
          maxProgressGapMs: run.maxProgressGapMs, measurementErrors: run.measurementErrors })) })) }, null, 2));
    if (result.acceptance !== 'PASS') process.exitCode = 1;
    return;
  }
  const result = await generateArchive(options);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message || 'Synthetic benchmark archive generation failed.');
  process.exitCode = 1;
});