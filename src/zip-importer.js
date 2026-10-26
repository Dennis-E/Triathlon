/**
 * ZIP Import Utility for Strava and TrainingPeaks Data
 * Handles provider-specific ZIP extraction, CSV/FIT parsing, and normalization helpers
 */

const FIT_TARGET_DISTANCES_KM = {
  Swim: [0.4, 0.75, 1.5, 1.9, 3.8],
  Run: [5.0, 10.0, 21.0975, 42.195],
  Bike: [20.0, 40.0, 90.0, 180.0]
};

const powerPbUtils = typeof module !== 'undefined' && module.exports
  ? require('./power-pb-utils')
  : (typeof window !== 'undefined' ? window.powerPbUtils : null);
const mediaUtils = typeof module !== 'undefined' && module.exports
  ? require('./media-utils')
  : (typeof window !== 'undefined' ? window.mediaUtils : null);

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
  const { gpsTracksByActivityId, fitBestEffortsByActivityId } = await extractGpsAndPowerFromZip(zip, csvText, activitySportById, reportProgress);
  const mediaLibrary = await extractMediaFromZip(zip, csvText);
  mediaLibrary.activityOptions = mediaLibrary.activityOptions.map(activity => ({
    ...activity,
    hasRoute: !!gpsTracksByActivityId[String(activity.id)]
  }));
  mediaLibrary.gpsTracksByActivityId = gpsTracksByActivityId;
  reportProgress({ percent: 95, stage: 'Finalizing...' });

  return {
    csvText,
    fitBestEffortsByActivityId,
    gpsTracksByActivityId,
    mediaLibrary
  };
}

function findCsvEntry(zip, filename) {
  const normalizedName = filename.toLowerCase();
  const matches = Object.entries(zip.files || {})
    .filter(([path, entry]) => entry && !entry.dir &&
      (path.toLowerCase() === normalizedName || path.toLowerCase().endsWith(`/${normalizedName}`)))
    .sort(([first], [second]) => Number(first.includes('/')) - Number(second.includes('/')));
  return matches.length ? matches[0][1] : null;
}

async function readMediaManifestFromZip(zip) {
  const entry = findCsvEntry(zip, 'media.csv');
  return entry ? entry.async('string') : '';
}

function findColumnIndex(headers, acceptedNames) {
  const accepted = new Set(acceptedNames.map(name => name.trim().toLowerCase()));
  return headers.findIndex(header => accepted.has(String(header || '').trim().toLowerCase()));
}

function splitMediaReference(value) {
  const source = String(value || '');
  const filenameMatches = source.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|mp4)/gi);
  return filenameMatches || source.split(/[;,|\n]+/).map(token => token.trim()).filter(Boolean);
}

async function extractMediaFromZip(zip, activityCsvText) {
  let manifestText = '';
  try {
    manifestText = await readMediaManifestFromZip(zip);
  } catch (error) {
    manifestText = '';
  }

  const manifestRows = parseCsvBasic(manifestText);
  const manifestHeaders = manifestRows[0] || [];
  const filenameIndex = findColumnIndex(manifestHeaders, ['Medien-Dateiname', 'Media Filename', 'Filename']);
  const captionIndex = findColumnIndex(manifestHeaders, ['Medienunterschrift', 'Media Caption', 'Caption']);
  const normalizedManifest = filenameIndex < 0 ? [] : manifestRows.slice(1)
    .filter(row => row[filenameIndex])
    .map(row => ({ filename: row[filenameIndex], caption: captionIndex < 0 ? '' : row[captionIndex] || '' }));

  const activityRows = parseCsvBasic(activityCsvText);
  const activityHeaders = activityRows[0] || [];
  const idIndex = findColumnIndex(activityHeaders, ['Aktivitäts-ID', 'Activity ID']);
  const sportIndex = findColumnIndex(activityHeaders, ['Aktivitätsart', 'Activity Type', 'Sport Type']);
  const dateIndex = findColumnIndex(activityHeaders, ['Aktivitätsdatum', 'Activity Date']);
  const nameIndex = findColumnIndex(activityHeaders, ['Name der Aktivität', 'Activity Name', 'Aktivitätsname']);
  const mediaIndex = findColumnIndex(activityHeaders, ['Medien', 'Media']);
  const activities = idIndex < 0 || mediaIndex < 0 ? [] : activityRows.slice(1)
    .filter(row => row[idIndex])
    .map(row => ({
      id: row[idIndex],
      sport: sportIndex < 0 ? null : normalizeSportForFit(row[sportIndex]),
      date: dateIndex < 0 ? null : row[dateIndex],
      name: nameIndex < 0 ? '' : row[nameIndex] || '',
      mediaReferences: splitMediaReference(row[mediaIndex])
    }));

  const mediaPathPattern = /\.(?:jpe?g|png|gif|webp|heic|tiff?|mp4|mov|m4v|avi|webm)$/i;
  const archiveEntries = Object.entries(zip.files || {})
    .filter(([path, entry]) => entry && !entry.dir && mediaPathPattern.test(path))
    .map(([path, entry]) => ({
      path,
      readable: true,
      byteLength: entry._data && Number.isFinite(entry._data.uncompressedSize) ? entry._data.uncompressedSize : null,
      readContent: () => entry.async('uint8array')
    }));
  const reconciled = mediaUtils.reconcileMediaReferences({
    activities,
    manifestRows: normalizedManifest,
    archiveEntries
  });
  const linkedActivityIds = new Set(reconciled.references
    .filter(reference => reference.status === 'matched')
    .map(reference => String(reference.activityId)));
  const activitiesById = new Map(activities.map(activity => [String(activity.id), activity]));
  const objectUrls = new Map();
  const library = {
    ...reconciled,
    manifestAvailable: Boolean(manifestText),
    activityOptions: Array.from(linkedActivityIds, id => activitiesById.get(id))
      .filter(Boolean)
      .map(activity => ({ id: String(activity.id), name: activity.name, sport: activity.sport, date: activity.date })),
    getObjectUrl: async asset => {
      if (objectUrls.has(asset.key)) return objectUrls.get(asset.key);
      const bytes = await asset.readContent();
      if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        throw new Error('Local media preview is unavailable in this browser.');
      }
      if (objectUrls.size >= 48) {
        const [expiredKey, expiredUrl] = objectUrls.entries().next().value;
        URL.revokeObjectURL(expiredUrl);
        objectUrls.delete(expiredKey);
      }
      const mimeType = asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      objectUrls.set(asset.key, objectUrl);
      return objectUrl;
    },
    release: () => {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        objectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
      }
      objectUrls.clear();
      library.assets.forEach(asset => { asset.readContent = null; });
      library.hasReadableMedia = false;
    }
  };

  library.assets.forEach(asset => {
    if (typeof asset.readContent !== 'function') return;
    const readContent = asset.readContent;
    asset.readContent = async () => {
      try {
        return await readContent();
      } catch (error) {
        asset.status = 'corrupt';
        library.hasReadableMedia = library.assets.some(item => item.status === 'readable');
        library.counts.corrupt = library.assets.filter(item => item.status === 'corrupt').length;
        throw error;
      }
    };
  });
  return library;
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

function parseActivityTimestamp(value) {
  if (!value) return null;
  const text = String(value).trim();
  const germanMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (germanMatch) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = germanMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const isoWithoutOffset = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(text);
  const normalizedText = isoWithoutOffset
    ? `${text.replace(' ', 'T')}Z`
    : text.replace(' UTC', 'Z');
  const parsed = new Date(normalizedText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseGpsFileEntries(rawCsvText) {
  const rows = parseCsvBasic(rawCsvText);
  if (rows.length < 2) return new Map();

  const headers = rows[0];
  const activityIdIdx = headers.findIndex(h => h === 'Activity ID' || h === 'Aktivitäts-ID');
  const filenameIdx = headers.findIndex(h => h === 'Filename' || h === 'Dateiname');
  const dateIdx = headers.findIndex(h => h === 'Activity Date' || h === 'Aktivitätsdatum');
  const durationIdx = headers.findIndex(h => h === 'Moving Time' || h === 'Bewegungszeit');
  const sportIdx = headers.findIndex(h => h === 'Activity Type' || h === 'Aktivitätsart' || h === 'Sport Type');
  const result = new Map();

  if (activityIdIdx === -1 || filenameIdx === -1) return result;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const activityId = row[activityIdIdx] ? String(row[activityIdIdx]).trim() : '';
    const filename = row[filenameIdx] ? String(row[filenameIdx]).trim() : '';
    const match = filename.match(/^activities\/(.+)\.(gpx|fit)(?:\.gz)?$/i);
    if (!activityId || !match) continue;

    const startTime = dateIdx === -1 ? null : parseActivityTimestamp(row[dateIdx]);
    const durationSeconds = durationIdx === -1 ? 0 : Number.parseFloat(row[durationIdx]);
    const endTime = startTime && Number.isFinite(durationSeconds)
      ? new Date(startTime.getTime() + Math.max(0, durationSeconds) * 1000)
      : null;
    const entries = result.get(filename) || [];
    entries.push({
      activityId,
      ext: match[2].toLowerCase(),
      sport: sportIdx === -1 ? null : row[sportIdx] || null,
      startTime,
      endTime
    });
    result.set(filename, entries);
  }

  for (const entries of result.values()) {
    entries.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    entries.forEach((entry, index) => {
      if (!entry.endTime && entry.startTime && entries[index + 1] && entries[index + 1].startTime) {
        entry.endTime = entries[index + 1].startTime;
      }
    });
  }

  return result;
}

function segmentFitRecordsByActivity(records, sessions) {
  if (!Array.isArray(records) || !Array.isArray(sessions)) return {};
  const result = Object.fromEntries(sessions.filter(session => session && session.activityId).map(session => [session.activityId, []]));
  const windows = sessions.map(session => ({
    activityId: session && session.activityId,
    startMs: session && session.startTime instanceof Date ? session.startTime.getTime() : NaN,
    endMs: session && session.endTime instanceof Date ? session.endTime.getTime() : NaN
  }));
  if (windows.length !== Object.keys(result).length || windows.some(window =>
    !window.activityId || !Number.isFinite(window.startMs) || !Number.isFinite(window.endMs) || window.startMs >= window.endMs
  )) return result;

  for (const record of records) {
    const timestamp = record && record.timestamp instanceof Date ? record.timestamp.getTime() : NaN;
    if (!Number.isFinite(timestamp)) continue;
    let owner = null;
    for (const window of windows) {
      if (timestamp < window.startMs || timestamp > window.endMs) continue;
      if (owner !== null) {
        owner = null;
        break;
      }
      owner = window.activityId;
    }
    if (owner !== null) result[owner].push(record);
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
async function extractGpsTracksFromZip(zip, rawCsvText, activitySportById, reportProgress, fitDeps) {
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
        const records = await readAndParseFitFile(zip, filename, fitDeps);
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

async function extractFitPowerEffortsFromZip(zip, rawCsvText, activitySportById, reportProgress, fitDeps) {
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
      const records = await readAndParseFitFile(zip, filename, fitDeps);
      const powerEfforts = buildFitPowerEfforts(records);
      if (powerEfforts.length > 0) result[activityId] = { powerEfforts };
    } catch (err) {
      continue;
    }
  }

  return result;
}

/**
 * Extract GPS tracks AND bike power efforts in a single pass over the ZIP's activity files.
 * Unlike calling extractGpsTracksFromZip + extractFitPowerEffortsFromZip separately, each bike
 * activity's FIT file is read/decompressed/parsed at most once (spec 021 FR-001/FR-006).
 * @param {Object} zip - Loaded JSZip instance
 * @param {string} rawCsvText - Raw activities.csv text (with Filename column)
 * @param {Map<string, string>} activitySportById - activityId -> sport (Run/Bike/Swim)
 * @param {Function} [reportProgress] - Optional progress callback ({percent, stage})
 * @param {Object} [fitDeps] - Optional FIT dependency overrides (ensureFitParserLoaded, parseFitRecords, gunzipUint8Array), for testing
 * @returns {Promise<{gpsTracksByActivityId: Object, fitBestEffortsByActivityId: Object}>}
 */
async function extractGpsAndPowerFromZip(zip, rawCsvText, activitySportById, reportProgress, fitDeps) {
  const notify = typeof reportProgress === 'function' ? reportProgress : () => {};
  const deps = fitDeps || {};
  const now = typeof deps.now === 'function'
    ? deps.now
    : () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
  const reportTiming = typeof deps.onTiming === 'function'
    ? timing => {
        try {
          deps.onTiming(timing);
        } catch (err) {
          // Timing observers must not affect import results.
        }
      }
    : () => {};
  const fileEntries = parseGpsFileEntries(rawCsvText);
  const entries = Array.from(fileEntries.entries()).filter(([filename]) => zip.files[filename] && !zip.files[filename].dir);

  const gpsTracksByActivityId = {};
  const fitBestEffortsByActivityId = {};
  let processed = 0;

  for (const [filename, fileMetadata] of entries) {
    processed++;
    if (entries.length > 0) {
      const percent = 40 + Math.round((processed / entries.length) * 50);
      notify({ percent, stage: `Extracting GPS tracks and bike power (${processed}/${entries.length})...` });
    }

    try {
      const isGzipped = /\.gz$/i.test(filename);
      let points;
      let recordCount = 0;
      let parseMs = 0;
      let gpsMs = 0;
      let powerMs = 0;

      const ext = fileMetadata[0].ext;
      if (ext === 'gpx') {
        const activityId = fileMetadata[0].activityId;
        const parseStartedAt = now();
        const text = isGzipped
          ? new TextDecoder('utf-8').decode(await gunzipUint8Array(await zip.files[filename].async('uint8array')))
          : await zip.files[filename].async('string');
        parseMs = Math.max(0, now() - parseStartedAt);
        const gpsStartedAt = now();
        points = extractGpxTrackpoints(text);
        const simplified = simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 2000 });
        gpsMs = Math.max(0, now() - gpsStartedAt);
        if (simplified.length > 0) {
          gpsTracksByActivityId[activityId] = {
            sport: (activitySportById && activitySportById.get(activityId)) || null,
            points: simplified.map(p => [p.lat, p.lon])
          };
        }
      } else {
        const parseStartedAt = now();
        const records = await readAndParseFitFile(zip, filename, fitDeps);
        parseMs = Math.max(0, now() - parseStartedAt);
        recordCount = records.length;
        const activityRecords = fileMetadata.length > 1
          ? segmentFitRecordsByActivity(records, fileMetadata)
          : { [fileMetadata[0].activityId]: records };

        for (const metadata of fileMetadata) {
          const activityId = metadata.activityId;
          const selectedRecords = activityRecords[activityId] || [];
          const gpsStartedAt = now();
          points = extractFitTrackpoints(selectedRecords);
          const simplified = simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 2000 });
          gpsMs += Math.max(0, now() - gpsStartedAt);

          const sport = (activitySportById && activitySportById.get(activityId)) || null;
          if (sport === 'Bike') {
            const powerStartedAt = now();
            const powerEfforts = buildFitPowerEfforts(selectedRecords);
            powerMs += Math.max(0, now() - powerStartedAt);
            if (powerEfforts.length > 0) fitBestEffortsByActivityId[activityId] = { powerEfforts };
          }

          if (simplified.length > 0) {
            gpsTracksByActivityId[activityId] = {
              sport,
              points: simplified.map(p => [p.lat, p.lon])
            };
          }
        }
      }

      reportTiming({ activityId: fileMetadata[0].activityId, sourceType: ext, recordCount, parseMs, gpsMs, powerMs });
    } catch (err) {
      // Skip activities whose GPS/FIT file can't be read/parsed; the rest of the import should still succeed
      continue;
    }
  }

  return { gpsTracksByActivityId, fitBestEffortsByActivityId };
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

/**
 * Read a FIT ZIP entry's bytes (decompressing gzip if needed) and parse it exactly once.
 * Both GPS trackpoints and bike power efforts are derived from the returned records array,
 * instead of each caller re-reading/re-parsing the same file (spec 021 FR-001/FR-006).
 * @param {Object} zip - Loaded JSZip instance
 * @param {string} filename - ZIP entry path for the FIT file
 * @param {{ensureFitParserLoaded?: Function, parseFitRecords?: Function, gunzipUint8Array?: Function}} [fitDeps] - Overrides for testing
 * @returns {Promise<Array>} Parsed FIT records
 */
async function readAndParseFitFile(zip, filename, fitDeps) {
  const deps = fitDeps || {};
  const doGunzip = deps.gunzipUint8Array || gunzipUint8Array;
  const loadParser = deps.ensureFitParserLoaded || ensureFitParserLoaded;
  const doParse = deps.parseFitRecords || parseFitRecords;

  const isGzipped = /\.gz$/i.test(filename);
  const rawBytes = await zip.files[filename].async('uint8array');
  const bytes = isGzipped ? await doGunzip(rawBytes) : rawBytes;
  const FitParserCtor = await loadParser();
  return doParse(FitParserCtor, bytes);
}

async function readAndParseFitData(zip, filename, fitDeps) {
  const deps = fitDeps || {};
  const doGunzip = deps.gunzipUint8Array || gunzipUint8Array;
  const loadParser = deps.ensureFitParserLoaded || ensureFitParserLoaded;
  const doParse = deps.parseFitData || parseFitData;
  const isGzipped = /\.gz$/i.test(filename);
  const rawBytes = await zip.files[filename].async('uint8array');
  let bytes = rawBytes;
  if (isGzipped) {
    try {
      bytes = await doGunzip(rawBytes);
    } catch (error) {
      throw new Error(`Could not decompress GZIP data: ${error.message}`);
    }
  }
  const FitParserCtor = await loadParser();
  return doParse(FitParserCtor, bytes);
}

function toValidDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value.getTime());
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getMondayDate(date) {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function hashTrainingPeaksIdentity(value) {
  let first = 2166136261;
  let second = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeTrainingPeaksSession(session, sourceEntry, sessionIndex) {
  const startTime = toValidDate(session && (session.start_time || session.startTime));
  const sportRaw = session && session.sport ? String(session.sport) : '';
  const sport = normalizeSportForFit(sportRaw);
  if (!sport) return { skippedReason: 'unsupported-sport' };
  if (!startTime) return { skippedReason: 'invalid-start-time' };

  const rawDistance = session && Number.isFinite(session.total_distance) ? session.total_distance : null;
  const rawDuration = session && Number.isFinite(session.total_timer_time)
    ? session.total_timer_time
    : (session && Number.isFinite(session.total_elapsed_time) ? session.total_elapsed_time : null);
  const distanceAvailable = Number.isFinite(rawDistance) && rawDistance >= 0;
  const durationAvailable = Number.isFinite(rawDuration) && rawDuration >= 0;
  const distance = distanceAvailable ? rawDistance / 1000 : 0;
  const duration = durationAvailable ? rawDuration : 0;
  const date = new Date(startTime);
  date.setHours(0, 0, 0, 0);
  const endTime = toValidDate(session && session.timestamp) ||
    (durationAvailable ? new Date(startTime.getTime() + duration * 1000) : null);
  const completeFingerprint = distanceAvailable && durationAvailable
    ? `metadata|${startTime.toISOString()}|${sport}|${Math.round(duration)}|${Math.round(rawDistance)}`
    : null;
  const sourceIdentity = `source|${sourceEntry}|${sessionIndex}`;
  const identity = completeFingerprint || sourceIdentity;
  const activityId = `tp-${hashTrainingPeaksIdentity(identity)}`;
  const optionalNumber = value => Number.isFinite(value) && value >= 0 ? value : null;

  return {
    identity,
    startTime,
    endTime,
    activity: {
      id: activityId,
      date,
      startTime,
      monday: getMondayDate(date),
      sportRaw,
      sport,
      distance,
      distanceAvailable,
      equipment: '',
      duration,
      durationAvailable,
      avgHeartRate: optionalNumber(session.avg_heart_rate),
      avgWatts: sport === 'Bike' ? optionalNumber(session.avg_power) : null,
      avgCadence: optionalNumber(session.avg_cadence),
      totalSteps: null,
      elevationGain: optionalNumber(session.total_ascent),
      name: `TrainingPeaks ${sport}`
    }
  };
}

function getSessionRecords(records, sessions, sessionIndex) {
  const current = sessions[sessionIndex];
  const startMs = current.startTime.getTime();
  const nextStartMs = sessions[sessionIndex + 1]
    ? sessions[sessionIndex + 1].startTime.getTime()
    : null;
  const endMs = current.endTime ? current.endTime.getTime() : null;
  return records.filter(record => {
    const timestamp = toValidDate(record && record.timestamp);
    if (!timestamp || timestamp.getTime() < startMs) return false;
    if (endMs !== null && timestamp.getTime() > endMs) return false;
    return nextStartMs === null || timestamp.getTime() < nextStartMs;
  });
}

function extractGpxTrackpointsWithTimes(xmlText) {
  if (!xmlText) return [];
  const points = [];
  const pattern = /<(?:\w+:)?(?:trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?(?:trkpt|rtept)\s*>/gi;
  let match;
  while ((match = pattern.exec(xmlText)) !== null) {
    const latMatch = match[1].match(/\blat="(-?\d+(?:\.\d+)?)"/i);
    const lonMatch = match[1].match(/\blon="(-?\d+(?:\.\d+)?)"/i);
    const timeMatch = match[2].match(/<(?:\w+:)?time\b[^>]*>\s*([^<]+)\s*<\/(?:\w+:)?time\s*>/i);
    if (!latMatch || !lonMatch || !timeMatch) continue;
    const lat = Number.parseFloat(latMatch[1]);
    const lon = Number.parseFloat(lonMatch[1]);
    const time = toValidDate(timeMatch[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !time) continue;
    points.push({ lat, lon, time });
  }
  return points;
}

function uniquelyMatchGpxRouteToSession(points, sessions) {
  if (!Array.isArray(points) || points.length === 0) return null;
  let routeStart = Infinity;
  let routeEnd = -Infinity;
  for (const point of points) {
    if (!point || !point.time) continue;
    const time = point.time.getTime();
    if (!Number.isFinite(time)) continue;
    if (time < routeStart) routeStart = time;
    if (time > routeEnd) routeEnd = time;
  }
  if (!Number.isFinite(routeStart) || !Number.isFinite(routeEnd)) return null;
  const toleranceMs = 5 * 60 * 1000;
  const candidatesByActivityId = new Map();
  sessions.filter(session => {
    if (!session.startTime || !session.endTime) return false;
    return routeStart >= session.startTime.getTime() - toleranceMs &&
      routeEnd <= session.endTime.getTime() + toleranceMs;
  }).forEach(session => candidatesByActivityId.set(session.activityId, session));
  const candidates = Array.from(candidatesByActivityId.values());
  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Import one or more TrainingPeaks ZIP archives containing FIT.GZ workouts and optional GPX.GZ routes.
 * Archive and FIT parsing is transactional: any unreadable archive/FIT entry rejects the complete import.
 * @param {FileList|File[]} zipFiles selected archives
 * @param {Function} [reportProgress] receives aggregate progress metadata
 * @param {Object} [fitDeps] test overrides for ZIP, GZIP, and FIT parser dependencies
 */
async function importTrainingPeaksZips(zipFiles, reportProgress, fitDeps) {
  const files = Array.from(zipFiles || []);
  if (files.length === 0) throw new Error('Select at least one TrainingPeaks ZIP archive.');
  const notify = typeof reportProgress === 'function' ? reportProgress : () => {};
  const deps = fitDeps || {};
  const loadArchive = deps.loadZipArchive || loadZipArchive;
  const isFitEntry = name => /\.fit(?:\.gz)?$/i.test(name);
  const isGpxEntry = name => /\.gpx(?:\.gz)?$/i.test(name);
  let totalEntries = 0;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let zip;
    try {
      zip = await loadArchive(file);
    } catch (error) {
      throw new Error(`Could not read archive ${file.name}: ${error.message}`);
    }
    const entries = Object.entries(zip.files || {})
      .filter(([name, entry]) => entry && !entry.dir && (isFitEntry(name) || isGpxEntry(name)))
      .map(([name]) => name);
    const fitCount = entries.filter(isFitEntry).length;
    if (fitCount === 0) throw new Error(`Archive ${file.name} contains no supported FIT workout entries.`);
    totalEntries += entries.length;
    notify({
      percent: Math.floor(((index + 1) / files.length) * 5),
      stage: `Validating TrainingPeaks archive (${index + 1}/${files.length})...`,
      processed: 0,
      total: totalEntries
    });
  }

  const activities = [];
  const seenIdentities = new Set();
  const gpsTracksByActivityId = {};
  const fitBestEffortsByActivityId = {};
  let skippedUnsupportedSportCount = 0;
  let skippedInvalidSessionCount = 0;
  let skippedGpxRouteCount = 0;
  let processed = 0;
  const totalArchives = files.length;
  const sessionsAcrossArchives = [];
  const timestampedGpxRoutes = [];

  for (let archiveIndex = 0; archiveIndex < files.length; archiveIndex += 1) {
    const file = files[archiveIndex];
    let zip;
    try {
      zip = await loadArchive(file);
    } catch (error) {
      throw new Error(`Could not read archive ${file.name}: ${error.message}`);
    }
    const entryNames = Object.entries(zip.files || {})
      .filter(([name, entry]) => entry && !entry.dir && (isFitEntry(name) || isGpxEntry(name)))
      .map(([name]) => name);
    const sessionsInArchive = [];
    const reportEntryProgress = (entryName, phase) => {
      processed += 1;
      notify({
        percent: 5 + Math.floor((processed / totalEntries) * 90),
        stage: `${phase} ${entryName} (${processed}/${totalEntries})`,
        processed,
        total: totalEntries,
        archiveIndex: archiveIndex + 1,
        archiveTotal: totalArchives
      });
    };

    for (const entryName of entryNames.filter(isFitEntry)) {
      let fitData;
      try {
        fitData = await readAndParseFitData(zip, entryName, deps);
      } catch (error) {
        throw new Error(`Could not process ${file.name} entry ${entryName}: ${error.message}`);
      }
      const fitSessions = Array.isArray(fitData && fitData.sessions) ? fitData.sessions : [];
      if (fitSessions.length === 0) {
        throw new Error(`Could not process ${file.name} entry ${entryName}: no FIT sessions were found.`);
      }
      const normalized = fitSessions
        .map((session, sessionIndex) => normalizeTrainingPeaksSession(session, entryName, sessionIndex))
        .sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime - b.startTime;
        });
      const validSessions = normalized.filter(item => item.activity);
      skippedUnsupportedSportCount += normalized.filter(item => item.skippedReason === 'unsupported-sport').length;
      skippedInvalidSessionCount += normalized.filter(item => item.skippedReason === 'invalid-start-time').length;
      const records = Array.isArray(fitData.records) ? fitData.records : [];

      for (let sessionIndex = 0; sessionIndex < validSessions.length; sessionIndex += 1) {
        const item = validSessions[sessionIndex];
        const isDuplicate = seenIdentities.has(item.identity);
        seenIdentities.add(item.identity);
        sessionsInArchive.push({ ...item, activityId: item.activity.id });
        if (isDuplicate) continue;
        activities.push(item.activity);
        const selectedRecords = getSessionRecords(records, validSessions, sessionIndex);
        const track = simplifyTrackPoints(extractFitTrackpoints(selectedRecords), { toleranceMeters: 3, maxPoints: 2000 });
        if (track.length > 0) {
          gpsTracksByActivityId[item.activity.id] = {
            sport: item.activity.sport,
            points: track.map(point => [point.lat, point.lon])
          };
        }
        if (item.activity.sport === 'Bike') {
          const powerEfforts = buildFitPowerEfforts(selectedRecords);
          if (powerEfforts.length > 0) fitBestEffortsByActivityId[item.activity.id] = { powerEfforts };
        }
      }
      sessionsAcrossArchives.push(...sessionsInArchive);
      reportEntryProgress(entryName, 'Parsed FIT workout');
    }

    for (const entryName of entryNames.filter(isGpxEntry)) {
      try {
        const rawBytes = await zip.files[entryName].async('uint8array');
        const bytes = /\.gz$/i.test(entryName) ? await (deps.gunzipUint8Array || gunzipUint8Array)(rawBytes) : rawBytes;
        const xmlText = new TextDecoder('utf-8').decode(bytes);
        const points = extractGpxTrackpointsWithTimes(xmlText);
        if (points.length === 0) {
          skippedGpxRouteCount += 1;
        } else {
          timestampedGpxRoutes.push(points);
        }
      } catch (error) {
        skippedGpxRouteCount += 1;
      }
      reportEntryProgress(entryName, 'Processed GPX route');
    }
  }

  for (const points of timestampedGpxRoutes) {
    const matchedSession = uniquelyMatchGpxRouteToSession(points, sessionsAcrossArchives);
    if (!matchedSession) {
      skippedGpxRouteCount += 1;
      continue;
    }
    if (gpsTracksByActivityId[matchedSession.activityId]) continue;
    const routePoints = simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 2000 });
    if (routePoints.length === 0) {
      skippedGpxRouteCount += 1;
      continue;
    }
    gpsTracksByActivityId[matchedSession.activityId] = {
      sport: matchedSession.activity.sport,
      points: routePoints.map(point => [point.lat, point.lon])
    };
  }

  activities.sort((a, b) => a.startTime - b.startTime);
  notify({ percent: 100, stage: 'TrainingPeaks import complete', processed: totalEntries, total: totalEntries });
  return {
    activities,
    gpsTracksByActivityId,
    fitBestEffortsByActivityId,
    skippedUnsupportedSportCount,
    skippedInvalidSessionCount,
    skippedGpxRouteCount
  };
}

function parseFitRecords(FitParserCtor, fitBytes) {
  return parseFitData(FitParserCtor, fitBytes).then(data => Array.isArray(data && data.records) ? data.records : []);
}

function parseFitData(FitParserCtor, fitBytes) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new FitParserCtor({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        mode: 'list',
        elapsedRecordField: false
      });
      const bytes = fitBytes instanceof Uint8Array
        ? fitBytes.buffer.slice(fitBytes.byteOffset, fitBytes.byteOffset + fitBytes.byteLength)
        : fitBytes;
      parser.parse(bytes, (error, data) => {
        if (error) {
          reject(new Error(String(error)));
          return;
        }
        resolve(data || {});
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
  if (!powerPbUtils || typeof powerPbUtils.calculatePowerEffortsForDurations !== 'function') return [];
  const normalized = normalizeFitRecords(records);
  return powerPbUtils.calculatePowerEffortsForDurations(normalized, powerPbUtils.POWER_DURATIONS);
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
    extractMediaFromZip,
    parseCsvBasic,
    serializeCsvBasic,
    extractRelevantColumns,
    parseGpsFileIdToActivityId,
    parseGpsFileEntries,
    segmentFitRecordsByActivity,
    extractGpxTrackpoints,
    extractFitTrackpoints,
    downsampleTrack,
    simplifyTrackPoints,
    extractGpsTracksFromZip,
    normalizeFitRecords,
    buildFitPowerEfforts,
    extractFitPowerEffortsFromZip,
    extractGpsAndPowerFromZip,
    readAndParseFitFile,
    importTrainingPeaksZips,
    extractGpxTrackpointsWithTimes
  };
}