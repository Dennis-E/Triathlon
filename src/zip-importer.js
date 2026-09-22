/**
 * ZIP Import Utility for Strava Data
 * Handles ZIP file extraction, CSV parsing, and relevant column extraction
 */

const FIT_TARGET_DISTANCES_KM = {
  Swim: [0.4, 0.75, 1.5, 1.9, 3.8],
  Run: [5.0, 10.0, 21.0975, 42.195],
  Bike: [20.0, 40.0, 90.0, 180.0]
};

const FIT_BIKE_POWER_DURATIONS_SECONDS = [300, 600, 1200, 3600];
const powerPbUtils = typeof module !== 'undefined' && module.exports
  ? require('./power-pb-utils')
  : (typeof window !== 'undefined' ? window.powerPbUtils : null);

let fitParserModulePromise = null;

// Add JSZip library dynamically if not already loaded
function ensureJSZipLoaded() {
  return new Promise((resolve, reject) => {
    if (typeof JSZip !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load JSZip library'));
    document.head.appendChild(script);
  });
}

/**
 * Load and parse a Strava export ZIP file with JSZip
 * @param {File} zipFile - The ZIP file from Strava export
 * @returns {Promise<Object>} Loaded JSZip instance
 */
async function loadZipArchive(zipFile) {
  await ensureJSZipLoaded();

  if (zipFile.size === 0) {
    throw new Error('ZIP file is empty');
  }

  try {
    const zip = new JSZip();
    await zip.loadAsync(zipFile);
    return zip;
  } catch (err) {
    throw new Error(`Failed to read ZIP file: ${err.message}. Make sure this is a valid Strava export ZIP.`);
  }
}

/**
 * Find and read activities.csv from an already loaded JSZip instance
 * @param {Object} zip - Loaded JSZip instance
 * @returns {Promise<string>} CSV text content
 */
async function readActivitiesCsvFromZip(zip) {
  // Look for activities.csv in the root or in common subdirectories
  let csvFile = null;
  let csvPath = null;

  const findCsv = (folder, prefix = '') => {
    for (const [path, file] of Object.entries(folder.files)) {
      if (path.toLowerCase().endsWith('activities.csv')) {
        csvFile = file;
        csvPath = prefix + path;
        return true;
      }
    }
    return false;
  };

  // Search in root first
  if (findCsv(zip)) {
    try {
      return await csvFile.async('string');
    } catch (err) {
      throw new Error(`Failed to read activities.csv: ${err.message}`);
    }
  }

  // Search in first-level subdirectories
  for (const [folderName, folder] of Object.entries(zip.files)) {
    if (folder.dir && !folderName.startsWith('.')) {
      if (findCsv(folder, folderName)) {
        try {
          return await csvFile.async('string');
        } catch (err) {
          throw new Error(`Failed to read activities.csv from ${csvPath}: ${err.message}`);
        }
      }
    }
  }

  throw new Error('Could not find activities.csv in ZIP file. Make sure you exported data from Strava.');
}

/**
 * Extract activities.csv from Strava ZIP export
 * @param {File} zipFile - The ZIP file from Strava export
 * @returns {Promise<string>} CSV text content
 */
async function extractActivitiesCsvFromZip(zipFile) {
  const zip = await loadZipArchive(zipFile);
  return readActivitiesCsvFromZip(zip);
}

async function importStravaZip(zipFile, onProgress) {
  const reportProgress = typeof onProgress === 'function' ? onProgress : () => {};
  reportProgress({ percent: 10, stage: 'Reading activities.csv...' });
  const zip = await loadZipArchive(zipFile);
  const csvText = await readActivitiesCsvFromZip(zip);
  reportProgress({ percent: 40, stage: 'Preparing activity data...' });

  const activitySportById = parseActivitySportsById(csvText);
  const gpsTracksByActivityId = await extractGpsTracksFromZip(zip, csvText, activitySportById, reportProgress);
  const fitBestEffortsByActivityId = await extractFitPowerEffortsFromZip(zip, csvText, activitySportById, reportProgress);
  reportProgress({ percent: 95, stage: 'Finalizing...' });

  return {
    csvText,
    fitBestEffortsByActivityId,
    gpsTracksByActivityId
  };
}

function normalizeSportForFit(rawSport) {
  if (!rawSport) return null;
  const normalized = String(rawSport).toLowerCase().trim();
  if (['lauf', 'laufen', 'run', 'running', 'trail run', 'trailrun', 'walk', 'gehen', 'virtueller lauf'].includes(normalized)) return 'Run';
  if (['radfahrt', 'radfahren', 'ride', 'bike', 'biking', 'cycling', 'virtual ride', 'virtualride', 'virtuelle radfahrt', 'virtuelle fahrt', 'gravel ride', 'mountain bike ride', 'ebike ride', 'e-bike ride'].includes(normalized)) return 'Bike';
  if (['schwimmen', 'swim', 'swimming'].includes(normalized)) return 'Swim';
  return null;
}

function parseActivitySportsById(reducedCsvText) {
  const rows = parseCsvBasic(reducedCsvText);
  if (rows.length < 2) return new Map();
  const headers = rows[0];
  const idIdx = headers.findIndex(h => h === 'Aktivitäts-ID' || h === 'Activity ID');
  const sportIdx = headers.findIndex(h => h === 'Aktivitätsart' || h === 'Activity Type' || h === 'Sport Type');
  const result = new Map();
  if (idIdx === -1 || sportIdx === -1) return result;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = row[idIdx];
    if (!id) continue;
    const sport = normalizeSportForFit(row[sportIdx]);
    if (sport) result.set(String(id), sport);
  }
  return result;
}

function parseFitFileIdToActivityId(rawCsvText) {
  const rows = parseCsvBasic(rawCsvText);
  if (rows.length < 2) return new Map();

  const headers = rows[0];
  const activityIdIdx = headers.findIndex(h => h === 'Activity ID' || h === 'Aktivitäts-ID');
  const filenameIdx = headers.findIndex(h => h === 'Filename' || h === 'Dateiname');
  const result = new Map();

  if (activityIdIdx === -1 || filenameIdx === -1) return result;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const activityId = row[activityIdIdx] ? String(row[activityIdIdx]).trim() : '';
    const filename = row[filenameIdx] ? String(row[filenameIdx]).trim() : '';
    if (!activityId || !filename) continue;

    const match = filename.match(/^activities\/(\d+)\.fit(?:\.gz)?$/i);
    if (!match) continue;

    const fitFileId = match[1];
    result.set(fitFileId, activityId);
  }

  return result;
}

/**
 * Map GPS track filenames (activities/{id}.gpx or .fit, optionally .gz) to Strava activity IDs
 * @param {string} rawCsvText - Raw activities.csv text (with Filename column)
 * @returns {Map<string, {activityId: string, ext: 'gpx'|'fit'}>} filename -> activity mapping
 */
function parseGpsFileIdToActivityId(rawCsvText) {
  const rows = parseCsvBasic(rawCsvText);
  if (rows.length < 2) return new Map();

  const headers = rows[0];
  const activityIdIdx = headers.findIndex(h => h === 'Activity ID' || h === 'Aktivitäts-ID');
  const filenameIdx = headers.findIndex(h => h === 'Filename' || h === 'Dateiname');
  const result = new Map();

  if (activityIdIdx === -1 || filenameIdx === -1) return result;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const activityId = row[activityIdIdx] ? String(row[activityIdIdx]).trim() : '';
    const filename = row[filenameIdx] ? String(row[filenameIdx]).trim() : '';
    if (!activityId || !filename) continue;

    const match = filename.match(/^activities\/(.+)\.(gpx|fit)(?:\.gz)?$/i);
    if (!match) continue;

    result.set(filename, { activityId, ext: match[2].toLowerCase() });
  }

  return result;
}

/**
 * Extract latitude/longitude trackpoints from GPX XML text (regex-based, no DOMParser needed)
 * @param {string} xmlText - GPX file content
 * @returns {Array<{lat: number, lon: number}>}
 */
function extractGpxTrackpoints(xmlText) {
  if (!xmlText) return [];
  const points = [];
  const pointTagPattern = /<(?:\w+:)?(?:trkpt|rtept)\b[^>]*\blat="(-?\d+(?:\.\d+)?)"[^>]*\blon="(-?\d+(?:\.\d+)?)"[^>]*\/?>/gi;
  let match;
  while ((match = pointTagPattern.exec(xmlText)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push({ lat, lon });
    }
  }
  return points;
}

/**
 * Extract latitude/longitude trackpoints from parsed FIT records
 * @param {Array} fitRecords - Records returned by fit-file-parser
 * @returns {Array<{lat: number, lon: number}>}
 */
function extractFitTrackpoints(fitRecords) {
  if (!Array.isArray(fitRecords)) return [];
  const points = [];
  for (const rec of fitRecords) {
    const lat = rec && Number.isFinite(rec.position_lat) ? rec.position_lat : null;
    const lon = rec && Number.isFinite(rec.position_long) ? rec.position_long : null;
    if (lat !== null && lon !== null) {
      points.push({ lat, lon });
    }
  }
  return points;
}

/**
 * Reduce a track to at most maxPoints, always keeping the first and last point
 * @param {Array} points - Track points
 * @param {number} maxPoints - Maximum number of points to keep
 * @returns {Array}
 */
function downsampleTrack(points, maxPoints = 180) {
  if (!Array.isArray(points) || points.length <= maxPoints || maxPoints < 2) {
    return Array.isArray(points) ? points : [];
  }
  const stride = (points.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(points[Math.round(i * stride)]);
  }
  return sampled;
}

const SIMPLIFY_EARTH_RADIUS_METERS = 6371000;

// Equirectangular projection to local planar meters, referenced to the given latitude,
// so perpendicular-distance comparisons stay latitude-independent (research.md Decision 2).
function projectToLocalMeters(point, refLatDegrees) {
  const latRad = point.lat * Math.PI / 180;
  const lonRad = point.lon * Math.PI / 180;
  const refLatRad = refLatDegrees * Math.PI / 180;
  return [
    lonRad * Math.cos(refLatRad) * SIMPLIFY_EARTH_RADIUS_METERS,
    latRad * SIMPLIFY_EARTH_RADIUS_METERS
  ];
}

// Perpendicular distance (meters) from `point` to the infinite line through `lineStart`/`lineEnd`.
function perpendicularDistanceMeters(point, lineStart, lineEnd) {
  const refLat = (lineStart.lat + lineEnd.lat) / 2;
  const [px, py] = projectToLocalMeters(point, refLat);
  const [x1, y1] = projectToLocalMeters(lineStart, refLat);
  const [x2, y2] = projectToLocalMeters(lineEnd, refLat);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 1e-9) return Math.hypot(px - x1, py - y1);
  return Math.abs(dy * (px - x1) - dx * (py - y1)) / Math.sqrt(lengthSquared);
}

// Recursive Ramer–Douglas–Peucker: keeps the point(s) that deviate most from the chord
// between the current endpoints whenever that deviation exceeds toleranceMeters, and drops
// everything else (research.md Decision 2). Never interpolates a new point (FR-005).
function rdpSimplify(points, toleranceMeters) {
  if (points.length < 3) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let maxDistance = -1;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistanceMeters(points[i], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  if (maxDistance > toleranceMeters) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), toleranceMeters);
    const right = rdpSimplify(points.slice(maxIndex), toleranceMeters);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

/**
 * Reduce a GPS track's point count using curve-preserving (Ramer–Douglas–Peucker)
 * simplification instead of a fixed-count, evenly-spaced stride: points are dropped only
 * where they lie within `toleranceMeters` of the straight chord between their retained
 * neighbors, so curves and turns survive while straight sections shrink (spec 005 FR-004).
 * The first and last point are always kept, and no new point is ever interpolated (FR-005).
 * If the tolerance-based result still exceeds `maxPoints`, an even-stride reduction of that
 * result is applied only as a bounded safety-maximum fallback (FR-004).
 * @param {Array<{lat: number, lon: number}>} points - Track points
 * @param {{toleranceMeters?: number, maxPoints?: number}} [options]
 * @returns {Array<{lat: number, lon: number}>}
 */
function simplifyTrackPoints(points, options = {}) {
  if (!Array.isArray(points) || points.length === 0) return [];
  if (points.length <= 2) return points.slice();

  const toleranceMeters = Number.isFinite(options.toleranceMeters) && options.toleranceMeters > 0
    ? options.toleranceMeters : 3;
  const maxPoints = Number.isFinite(options.maxPoints) && options.maxPoints >= 2
    ? options.maxPoints : 2000;

  const simplified = rdpSimplify(points, toleranceMeters);
  return simplified.length > maxPoints ? downsampleTrack(simplified, maxPoints) : simplified;
}

/**
 * Extract GPS tracks for every matching activity file found in the ZIP archive
 * @param {Object} zip - Loaded JSZip instance
 * @param {string} rawCsvText - Raw activities.csv text (with Filename column)
 * @param {Map<string, string>} activitySportById - activityId -> sport (Run/Bike/Swim)
 * @param {Function} [reportProgress] - Optional progress callback ({percent, stage})
 * @returns {Promise<Object>} { [activityId]: { sport, points: [[lat, lon], ...] } }
 */
async function extractGpsTracksFromZip(zip, rawCsvText, activitySportById, reportProgress) {
  const notify = typeof reportProgress === 'function' ? reportProgress : () => {};
  const fileIdMap = parseGpsFileIdToActivityId(rawCsvText);
  const entries = Array.from(fileIdMap.entries()).filter(([filename]) => zip.files[filename] && !zip.files[filename].dir);

  const result = {};
  let processed = 0;

  for (const [filename, { activityId, ext }] of entries) {
    processed++;
    if (entries.length > 0) {
      const percent = 40 + Math.round((processed / entries.length) * 50);
      notify({ percent, stage: `Extracting GPS tracks (${processed}/${entries.length})...` });
    }

    try {
      const isGzipped = /\.gz$/i.test(filename);
      let points;

      if (ext === 'gpx') {
        const text = isGzipped
          ? new TextDecoder('utf-8').decode(await gunzipUint8Array(await zip.files[filename].async('uint8array')))
          : await zip.files[filename].async('string');
        points = extractGpxTrackpoints(text);
      } else {
        const bytes = isGzipped
          ? await gunzipUint8Array(await zip.files[filename].async('uint8array'))
          : await zip.files[filename].async('uint8array');
        const FitParserCtor = await ensureFitParserLoaded();
        const records = await parseFitRecords(FitParserCtor, bytes);
        points = extractFitTrackpoints(records);
      }

      if (!points.length) continue;

      const simplified = simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 2000 });
      result[activityId] = {
        sport: (activitySportById && activitySportById.get(activityId)) || null,
        points: simplified.map(p => [p.lat, p.lon])
      };
    } catch (err) {
      // Skip activities whose GPS file can't be read/parsed; the rest of the import should still succeed
      continue;
    }
  }

  return result;
}

async function extractFitPowerEffortsFromZip(zip, rawCsvText, activitySportById, reportProgress) {
  const notify = typeof reportProgress === 'function' ? reportProgress : () => {};
  const fileIdMap = parseGpsFileIdToActivityId(rawCsvText);
  const entries = Array.from(fileIdMap.entries()).filter(([filename, metadata]) =>
    metadata.ext === 'fit' && zip.files[filename] && !zip.files[filename].dir &&
    activitySportById && activitySportById.get(metadata.activityId) === 'Bike'
  );
  const result = {};

  for (let index = 0; index < entries.length; index++) {
    const [filename, { activityId }] = entries[index];
    notify({ percent: 90 + Math.round(((index + 1) / Math.max(entries.length, 1)) * 5), stage: `Extracting bike power (${index + 1}/${entries.length})...` });
    try {
      const isGzipped = /\.gz$/i.test(filename);
      const bytes = isGzipped
        ? await gunzipUint8Array(await zip.files[filename].async('uint8array'))
        : await zip.files[filename].async('uint8array');
      const FitParserCtor = await ensureFitParserLoaded();
      const records = await parseFitRecords(FitParserCtor, bytes);
      const powerEfforts = buildFitPowerEfforts(records);
      if (powerEfforts.length > 0) result[activityId] = { powerEfforts };
    } catch (err) {
      continue;
    }
  }

  return result;
}

async function ensureFitParserLoaded() {
  if (!fitParserModulePromise) {
    fitParserModulePromise = import('https://esm.sh/fit-file-parser@1.10.0');
  }
  const module = await fitParserModulePromise;
  return module.default || (module && module.default && module.default.default) || module;
}

async function gunzipUint8Array(input) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support gzip decompression (DecompressionStream).');
  }
  const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream('gzip'));
  const outputBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(outputBuffer);
}

function parseFitRecords(FitParserCtor, fitBytes) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new FitParserCtor({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        mode: 'list',
        elapsedRecordField: false
      });
      parser.parse(fitBytes.buffer, (error, data) => {
        if (error) {
          reject(new Error(String(error)));
          return;
        }
        const records = Array.isArray(data && data.records) ? data.records : [];
        resolve(records);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function normalizeFitRecords(records) {
  if (powerPbUtils && typeof powerPbUtils.normalizeFitPowerRecords === 'function') {
    return powerPbUtils.normalizeFitPowerRecords(records);
  }
  const normalized = [];
  for (const rec of records) {
    const ts = rec && rec.timestamp instanceof Date ? rec.timestamp.getTime() : null;
    const distM = rec && Number.isFinite(rec.distance) ? rec.distance : null;
    if (!Number.isFinite(ts) || !Number.isFinite(distM)) continue;
    normalized.push({
      tSec: ts / 1000,
      distKm: distM / 1000,
      power: Number.isFinite(rec.power) ? rec.power : null
    });
  }

  normalized.sort((a, b) => a.tSec - b.tSec);

  const deduped = [];
  for (const point of normalized) {
    if (deduped.length === 0) {
      deduped.push(point);
      continue;
    }
    const last = deduped[deduped.length - 1];
    if (point.tSec <= last.tSec) {
      if (point.tSec === last.tSec) {
        if (point.distKm > last.distKm) last.distKm = point.distKm;
        if (Number.isFinite(point.power)) last.power = point.power;
      }
      continue;
    }
    if (point.distKm < last.distKm) continue;
    deduped.push(point);
  }
  return deduped;
}

function buildFitPowerEfforts(records) {
  if (!powerPbUtils || typeof powerPbUtils.calculateRollingPowerEfforts !== 'function') return [];
  const normalized = normalizeFitRecords(records);
  const powerEfforts = [];
  FIT_BIKE_POWER_DURATIONS_SECONDS.forEach(targetSeconds => {
    const effort = powerPbUtils.calculateRollingPowerEfforts(normalized, targetSeconds)[0];
    if (effort) powerEfforts.push(effort);
  });
  return powerEfforts;
}

function parseCsvBasic(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nextCh = text[i + 1];
    if (ch === '"') {
      if (inQuotes && nextCh === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && nextCh === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some(v => v !== '')) rows.push(row);
  }
  return rows;
}

function serializeCsvBasic(rows) {
  return `${rows.map(r => r.map(v => {
    const s = v === null || v === undefined ? '' : String(v);
    if (!/[",\n\r]/.test(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
  }).join(',')).join('\n')}\n`;
}

function extractRelevantColumns(csvText) {
  const rows = parseCsvBasic(csvText);
  if (!rows || rows.length === 0) return '';
  const headers = rows[0];

  const findOneOf = (names) => {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIdx = findOneOf(['Aktivitäts-ID', 'Activity ID']);
  const dateIdx = findOneOf(['Aktivitätsdatum', 'Activity Date']);
  const nameIdx = findOneOf(['Name der Aktivität', 'Activity Name']);
  const sportIdx = findOneOf(['Aktivitätsart', 'Activity Type', 'Sport Type']);
  const gearIdx = findOneOf(['Aktivitätsausrüstung', 'Activity Gear', 'Ausrüstung', 'Fahrrad', 'Gear', 'Bike']);
  const movingIdx = findOneOf(['Bewegungszeit', 'Moving Time']);

  // Distances: prefer to provide two distance columns where present
  const distIndices = [];
  headers.forEach((h, i) => {
    if (h === 'Distanz' || h === 'Distance') distIndices.push(i);
  });
  const distIdx = distIndices.length > 1 ? distIndices[1] : (distIndices[0] || -1);

  // avg heart rate predicate
  const avgHrIdx = headers.findIndex(h => {
    if (!h) return false;
    const n = String(h).toLowerCase();
    return (n.includes('herz') || n.includes('heart')) && (n.includes('durch') || n.includes('durchschnitt') || n.includes('avg') || n.includes('average'));
  });

  const avgPowerIdx = headers.findIndex(h => {
    if (!h) return false;
    const n = String(h).toLowerCase();
    return (n.includes('watt') || n.includes('power')) && (n.includes('durch') || n.includes('durchschnitt') || n.includes('avg') || n.includes('average'));
  });

  const outHeaders = [
    'Aktivitäts-ID',
    'Aktivitätsdatum',
    'Name der Aktivität',
    'Aktivitätsart',
    'Aktivitätsausrüstung',
    'Bewegungszeit',
    'Distanz',
    'Durchschnittliche Herzfrequenz',
    'Durchschnittliche Wattzahl',
    'Distanz'
  ];

  const outputRows = [outHeaders];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const outRow = [];
    outRow.push(idIdx !== -1 ? row[idIdx] : '');
    outRow.push(dateIdx !== -1 ? row[dateIdx] : '');
    outRow.push(nameIdx !== -1 ? row[nameIdx] : '');
    outRow.push(sportIdx !== -1 ? row[sportIdx] : '');
    outRow.push(gearIdx !== -1 ? row[gearIdx] : '');
    outRow.push(movingIdx !== -1 ? row[movingIdx] : '');
    outRow.push(distIdx !== -1 ? row[distIdx] : '');
    outRow.push(avgHrIdx !== -1 ? row[avgHrIdx] : '');
    outRow.push(avgPowerIdx !== -1 ? row[avgPowerIdx] : '');
    // For the last Distanz column, if we have two occurrences try to use the first occurrence if only one exists
    if (distIndices.length > 1) outRow.push(row[distIndices[1]]); else outRow.push(row[distIndices[0]] || '');
    outputRows.push(outRow);
  }

  return serializeCsvBasic(outputRows);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    importStravaZip,
    parseCsvBasic,
    serializeCsvBasic,
    extractRelevantColumns,
    parseGpsFileIdToActivityId,
    extractGpxTrackpoints,
    extractFitTrackpoints,
    downsampleTrack,
    simplifyTrackPoints,
    extractGpsTracksFromZip,
    normalizeFitRecords,
    buildFitPowerEfforts,
    extractFitPowerEffortsFromZip
  };
}