'use strict';

let appleHealthAbort = null;

self.onmessage = async event => {
  const { type, generation, file } = event.data || {};
  if (type === 'cancel') { if (appleHealthAbort) appleHealthAbort.abort(); return; }
  if (type !== 'start' || appleHealthAbort) return;
  appleHealthAbort = new AbortController();
  try {
    try {
      importScripts('https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.11/dist/zip-native.min.js',
        'https://cdn.jsdelivr.net/npm/sax@1.6.1/lib/sax.js',
        './apple-health-utils.js', './power-pb-utils.js', './zip-importer.js', './apple-health-importer.js');
    } catch (error) {
      self.postMessage({ type: 'error', generation, code: 'DEPENDENCY_LOAD_FAILED' });
      return;
    }
    self.zip.configure({ useWebWorkers: false, chunkSize: 65536 });
    const result = await self.appleHealthImporter.importAppleHealthZip(file,
      progress => self.postMessage({ type: 'progress', generation, ...progress }),
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
    self.postMessage({ type: 'complete', generation,
      result: { ...result, activities, gpsTracksByActivityId: tracks } }, buffers);
  } catch (error) {
    const safe = self.appleHealthUtils ? self.appleHealthUtils.failure(error.code) : { code: 'INVALID_ARCHIVE' };
    self.postMessage({ type: 'error', generation, code: safe.code });
  } finally {
    self.close();
  }
};