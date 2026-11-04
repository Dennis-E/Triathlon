const zip = require('@zip.js/zip.js/index-native.js');

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

function attributes(values) {
  return Object.entries(values).filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${escapeXml(value)}"`).join(' ');
}

function workout(overrides = {}, children = '') {
  return `<Workout ${attributes({ workoutActivityType: 'HKWorkoutActivityTypeRunning', sourceName: 'Synthetic Watch',
    startDate: '2025-03-01 08:00:00 +0100', endDate: '2025-03-01 08:30:00 +0100',
    duration: '30', durationUnit: 'min', ...overrides })}>${children}</Workout>`;
}

function statistic(type = 'DistanceWalkingRunning', sum = '5', unit = 'km', extra = {}) {
  return `<WorkoutStatistics ${attributes({ type: `HKQuantityTypeIdentifier${type}`, sum, unit, ...extra })}/>`;
}

function record(type = 'HeartRate', value = '150', extra = {}) {
  return `<Record ${attributes({ type: `HKQuantityTypeIdentifier${type}`, value, unit: 'count/min',
    sourceName: 'Synthetic Watch', startDate: '2025-03-01 08:10:00 +0100',
    endDate: '2025-03-01 08:10:00 +0100', ...extra })}/>`;
}

function healthXml(contents = '') {
  return `<?xml version="1.0" encoding="UTF-8"?><HealthData locale="en_US">${contents}</HealthData>`;
}

function gpx(segments) {
  const tracks = (Array.isArray(segments) ? segments : []).map(points =>
    `<trkseg>${points.map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join('')}</trkseg>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><gpx><trk>${tracks}</trk></gpx>`;
}

function xmlChunks(contents, size = 19) {
  return (async function* generate() {
    const bytes = new TextEncoder().encode(contents);
    for (let offset = 0; offset < bytes.length; offset += size) yield bytes.subarray(offset, offset + size);
  })();
}

async function archive(entries = { 'apple_health_export/Export.xml': healthXml(workout({}, statistic())) }) {
  const writer = new zip.ZipWriter(new zip.BlobWriter('application/zip'), { useWebWorkers: false });
  for (const [name, content] of Object.entries(entries)) {
    await writer.add(name, new zip.TextReader(content), { useWebWorkers: false });
  }
  return writer.close();
}

async function corruptFirstCentralDirectoryCrc(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset + 46 <= bytes.length; offset++) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    view.setUint32(offset + 16, view.getUint32(offset + 16, true) ^ 1, true);
    return new Blob([bytes], { type: 'application/zip' });
  }
  throw new Error('Synthetic ZIP has no central-directory entry.');
}

async function* largeXmlChunks(count, workouts = workout({}, statistic())) {
  const encoder = new TextEncoder();
  yield encoder.encode('<?xml version="1.0" encoding="UTF-8"?><HealthData>');
  const item = record('BasalEnergyBurned', '1', { unit: 'kcal' });
  const batchSize = 128;
  const batch = encoder.encode(item.repeat(batchSize));
  for (let index = 0; index < Math.floor(count / batchSize); index++) yield batch;
  yield encoder.encode(item.repeat(count % batchSize) + workouts + '</HealthData>');
}

module.exports = { attributes, workout, statistic, record, healthXml, xmlChunks, archive,
  gpx, corruptFirstCentralDirectoryCrc, largeXmlChunks };