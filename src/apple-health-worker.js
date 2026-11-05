'use strict';

let appleHealthAbort = null;
let appleHealthWorkerState = 'idle';
let appleHealthWorkerGeneration = null;
let appleHealthWorkerClosed = false;

function closeAppleHealthWorker() {
  if (appleHealthWorkerClosed) return;
  appleHealthWorkerClosed = true;
  self.onmessage = null;
  self.onmessageerror = null;
  self.close();
}

function appleHealthWorkerEnvironment() {
  if (typeof self.appleHealthUtils?.getRuntimeEnvironment === 'function') return self.appleHealthUtils.getRuntimeEnvironment(self, 'worker');
  const hostname = String(self.location?.hostname || '').toLowerCase();
  const loopback = hostname === 'localhost' || hostname === '::1' || hostname === '[::1]' ||
    (/^127(?:\.\d{1,3}){3}$/.test(hostname) && hostname.split('.').every(part => Number(part) <= 255));
  return { scheme: { 'http:': 'http', 'https:': 'https', 'file:': 'file' }[self.location?.protocol] || 'other',
    hostClass: loopback ? 'loopback' : hostname ? 'remote' : 'none', secureContext: self.isSecureContext === true, realm: 'worker' };
}

function postAppleHealthWorker(message, buffers) {
  const envelope = { ...message, v: 1, generation: appleHealthWorkerGeneration };
  if (buffers) self.postMessage(envelope, buffers);
  else self.postMessage(envelope);
}

function failAppleHealthWorker(error, phase = 'worker-start', component = 'worker') {
  if (appleHealthWorkerClosed) return;
  const utility = self.appleHealthUtils;
  const known = typeof utility?.failure === 'function' && error?.code && utility.failure(error.code).code === error.code;
  const code = known ? error.code : ['DEPENDENCY_LOAD_FAILED', 'DEPENDENCY_INVALID'].includes(error?.code) ? error.code : 'INTERNAL_ERROR';
  const inherited = typeof utility?.validateRuntimeDiagnostic === 'function' ? utility.validateRuntimeDiagnostic(error?.diagnostic) : null;
  const context = { ...inherited, phase: inherited?.phase || phase, component: inherited?.component || component,
    generation: appleHealthWorkerGeneration, environment: appleHealthWorkerEnvironment() };
  const diagnostic = typeof utility?.createRuntimeDiagnostic === 'function' ? utility.createRuntimeDiagnostic(code, context)
    : { v: 1, code, phase, component, generation: appleHealthWorkerGeneration, environment: context.environment,
      missingCapabilities: [], action: code === 'INTERNAL_ERROR' ? 'report-safe-diagnostic' : 'retry' };
  try { postAppleHealthWorker({ type: 'error', code, diagnostic }); }
  catch (transportError) { }
  finally { closeAppleHealthWorker(); }
}

self.onmessageerror = () => failAppleHealthWorker({ code: 'WORKER_PROTOCOL_ERROR' }, 'worker-start', 'protocol');
self.onmessage = async event => {
  if (appleHealthWorkerClosed) return;
  const { v, type, generation, file } = event.data || {};
  const validGeneration = Number.isSafeInteger(generation) && generation >= 0;
  if (appleHealthWorkerGeneration === null && validGeneration) appleHealthWorkerGeneration = generation;
  if (validGeneration && generation !== appleHealthWorkerGeneration) return;
  if (v !== 1 || !validGeneration) {
    failAppleHealthWorker({ code: 'WORKER_PROTOCOL_ERROR' }, 'worker-start', 'protocol');
    return;
  }
  if (type === 'cancel') {
    appleHealthAbort?.abort();
    failAppleHealthWorker({ code: 'CANCELLED' });
    return;
  }
  if (type === 'init' && appleHealthWorkerState === 'idle') {
    appleHealthWorkerState = 'initializing';
    let phase = 'dependencies';
    try {
      try {
        importScripts('./apple-health-utils.js');
        importScripts('https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.11/dist/zip-native.min.js',
          'https://cdn.jsdelivr.net/npm/sax@1.6.1/lib/sax.js', './power-pb-utils.js', './zip-importer.js', './apple-health-importer.js');
      } catch (error) { throw { code: 'DEPENDENCY_LOAD_FAILED' }; }
      const utility = self.appleHealthUtils;
      if (typeof utility?.inspectRuntimeCapabilities !== 'function' || typeof utility?.runtimeFailure !== 'function') throw { code: 'DEPENDENCY_INVALID' };
      const dependencies = [
        ['zip', typeof self.zip?.configure === 'function' && typeof self.zip?.ZipReader === 'function' && typeof self.zip?.BlobReader === 'function'],
        ['sax', typeof self.sax?.parser === 'function'],
        ['importer', typeof self.appleHealthImporter?.importAppleHealthZip === 'function'],
        ['importer', typeof self.powerPbUtils?.calculatePowerEffortsForDurations === 'function' && Array.isArray(self.powerPbUtils?.POWER_DURATIONS) && typeof self.extractGpxTrackpoints === 'function']
      ];
      for (const [component, valid] of dependencies) {
        if (!valid) throw utility.runtimeFailure('DEPENDENCY_INVALID', { phase, component, generation, environment: appleHealthWorkerEnvironment() });
      }
      phase = 'capabilities';
      const diagnostic = utility.inspectRuntimeCapabilities(self, 'worker', generation);
      if (diagnostic) throw utility.runtimeFailure(diagnostic.code, diagnostic);
      appleHealthAbort = new AbortController();
      phase = 'hashing';
      try {
        const hash = new Uint8Array(await self.crypto.subtle.digest('SHA-256', new TextEncoder().encode('abc')));
        const hexadecimal = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
        if (hexadecimal !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') throw new Error('Invalid hash probe');
      }
      catch (error) { throw utility.runtimeFailure('HASH_FAILED', { phase, component: 'crypto' }); }
      if (appleHealthWorkerClosed) return;
      self.zip.configure({ useWebWorkers: false, chunkSize: 65536 });
      appleHealthWorkerState = 'ready';
      postAppleHealthWorker({ type: 'ready' });
    } catch (error) {
      failAppleHealthWorker(error, phase, phase === 'hashing' ? 'crypto' : 'importer');
    }
    return;
  }
  if (type !== 'start' || appleHealthWorkerState !== 'ready' || !file) {
    failAppleHealthWorker({ code: 'WORKER_PROTOCOL_ERROR' }, 'worker-start', 'protocol');
    return;
  }
  appleHealthWorkerState = 'processing';
  try {
    const result = await self.appleHealthImporter.importAppleHealthZip(file,
      progress => postAppleHealthWorker({ ...progress, type: 'progress' }),
      { signal: appleHealthAbort.signal, powerPbUtils: self.powerPbUtils });
    const buffers = [];
    const tracks = Object.create(null);
    for (const [id, track] of Object.entries(result.gpsTracksByActivityId)) {
      const segments = track.segments || [track.points];
      const coordinates = new Float64Array(segments.reduce((sum, segment) => sum + segment.length * 2, 0));
      const offsets = new Uint32Array(segments.length + 1);
      let cursor = 0;
      segments.forEach((segment, index) => {
        offsets[index] = cursor / 2;
        for (const point of segment) { coordinates[cursor++] = point[0]; coordinates[cursor++] = point[1]; }
      });
      offsets[segments.length] = cursor / 2;
      tracks[id] = { sport: track.sport, coordinates, offsets };
      buffers.push(coordinates.buffer, offsets.buffer);
    }
    const activities = result.activities.map(activity => ({ ...activity,
      date: activity.date.getTime(), monday: activity.monday.getTime(), startTime: activity.startTime.getTime() }));
    postAppleHealthWorker({ type: 'complete',
      result: { ...result, activities, gpsTracksByActivityId: tracks } }, buffers);
  } catch (error) {
    failAppleHealthWorker(error, 'parsing', 'importer');
  } finally {
    closeAppleHealthWorker();
  }
};