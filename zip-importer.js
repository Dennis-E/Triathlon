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
 * Extract activities.csv from Strava ZIP export
 * @param {File} zipFile - The ZIP file from Strava export
 * @returns {Promise<string>} CSV text content
 */
async function extractActivitiesCsvFromZip(zipFile) {
  await ensureJSZipLoaded();

  if (zipFile.size === 0) {
    throw new Error('ZIP file is empty');
  }

  let zip;
  try {
    zip = new JSZip();
    await zip.loadAsync(zipFile);
  } catch (err) {
    throw new Error(`Failed to read ZIP file: ${err.message}. Make sure this is a valid Strava export ZIP.`);
  }

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

function findFastestDistanceWindow(records, targetKm) {
  if (!Array.isArray(records) || records.length < 2 || !Number.isFinite(targetKm) || targetKm <= 0) return null;

  let best = null;
  let lowerIdx = 0;

  for (let endIdx = 0; endIdx < records.length; endIdx++) {
    const end = records[endIdx];
    const neededDist = end.distKm - targetKm;
    if (neededDist < records[0].distKm) continue;

    while (lowerIdx + 1 <= endIdx && records[lowerIdx + 1].distKm <= neededDist) {
      lowerIdx++;
    }

    let startTimeSec;
    if (records[lowerIdx].distKm === neededDist || lowerIdx === endIdx) {
      startTimeSec = records[lowerIdx].tSec;
    } else {
      const p0 = records[lowerIdx];
      const p1 = records[lowerIdx + 1];
      const spanDist = p1.distKm - p0.distKm;
      if (spanDist <= 0) continue;
      const frac = (neededDist - p0.distKm) / spanDist;
      startTimeSec = p0.tSec + frac * (p1.tSec - p0.tSec);
    }

    const durationSec = end.tSec - startTimeSec;
    if (!Number.isFinite(durationSec) || durationSec <= 0) continue;

    if (!best || durationSec < best.durationSec) {
      best = {
        durationSec,
        startKm: neededDist,
        endKm: end.distKm
      };
    }
  }

  return best;
}

function interpolateAtTime(records, valueKey, tSec) {
  if (!Array.isArray(records) || records.length === 0) return null;
  if (tSec <= records[0].tSec) return records[0][valueKey];
  const last = records[records.length - 1];
  if (tSec >= last.tSec) return last[valueKey];

  let lo = 0;
  let hi = records.length - 1;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (records[mid].tSec <= tSec) lo = mid;
    else hi = mid;
  }

  const a = records[lo];
  const b = records[hi];
  const span = b.tSec - a.tSec;
  if (span <= 0) return a[valueKey];
  const frac = (tSec - a.tSec) / span;
  return a[valueKey] + frac * (b[valueKey] - a[valueKey]);
}

function buildRollingPowerPrefix(records) {
  const cumulativeEnergy = [0];
  for (let i = 0; i < records.length - 1; i++) {
    const a = records[i];
    const b = records[i + 1];
    const dt = b.tSec - a.tSec;
    const power = Number.isFinite(a.power) ? a.power : 0;
    cumulativeEnergy.push(cumulativeEnergy[i] + power * dt);
  }
  return cumulativeEnergy;
}

function energyAtTime(records, cumulativeEnergy, tSec) {
  if (records.length < 2) return 0;
  if (tSec <= records[0].tSec) return 0;
  if (tSec >= records[records.length - 1].tSec) return cumulativeEnergy[cumulativeEnergy.length - 1];

  let lo = 0;
  let hi = records.length - 1;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (records[mid].tSec <= tSec) lo = mid;
    else hi = mid;
  }

  const base = cumulativeEnergy[lo];
  const power = Number.isFinite(records[lo].power) ? records[lo].power : 0;
  return base + power * (tSec - records[lo].tSec);
}

function findBestPowerWindow(records, targetSec) {
  if (!Array.isArray(records) || records.length < 2 || !Number.isFinite(targetSec) || targetSec <= 0) return null;
  const firstT = records[0].tSec;
  const lastT = records[records.length - 1].tSec;
  if (lastT - firstT < targetSec) return null;

  const cumulativeEnergy = buildRollingPowerPrefix(records);
  let best = null;

  for (let i = 0; i < records.length; i++) {
    const endT = records[i].tSec;
    const startT = endT - targetSec;
    if (startT < firstT) continue;

    const eStart = energyAtTime(records, cumulativeEnergy, startT);
    const eEnd = energyAtTime(records, cumulativeEnergy, endT);
    const avgPower = (eEnd - eStart) / targetSec;
    if (!Number.isFinite(avgPower) || avgPower <= 0) continue;

    const startKm = interpolateAtTime(records, 'distKm', startT);
    const endKm = interpolateAtTime(records, 'distKm', endT);

    if (!best || avgPower > best.avgPower) {
      best = {
        avgPower,
        startSec: startT - firstT,
        endSec: endT - firstT,
        startKm: Number.isFinite(startKm) ? startKm : null,
        endKm: Number.isFinite(endKm) ? endKm : null
      };
    }
  }

  return best;
}

function summarizeFitBestEfforts(records, sport) {
  const normalized = normalizeFitRecords(records);
  if (normalized.length < 2) return null;

  const distanceTargets = FIT_TARGET_DISTANCES_KM[sport] || [];
  const distanceEfforts = [];
  for (const targetKm of distanceTargets) {
    const best = findFastestDistanceWindow(normalized, targetKm);
    if (best) {
      distanceEfforts.push({
        targetKm,
        durationSec: best.durationSec,
        startKm: best.startKm,
        endKm: best.endKm
      });
    }
  }

  const powerEfforts = [];
  if (sport === 'Bike') {
    for (const targetSeconds of FIT_BIKE_POWER_DURATIONS_SECONDS) {
      const best = findBestPowerWindow(normalized, targetSeconds);
      if (best) {
        powerEfforts.push({
          targetSeconds,
          avgPower: best.avgPower,
          startSec: best.startSec,
          endSec: best.endSec,
          startKm: best.startKm,
          endKm: best.endKm
        });
      }
    }
  }

  if (distanceEfforts.length === 0 && powerEfforts.length === 0) return null;
  return {
    distanceEfforts,
    powerEfforts,
    source: 'fit-rolling'
  };
}

async function extractFitBestEffortsFromZip(zip, reducedCsvText, rawCsvText, progressCallback = null) {
  const activitySports = parseActivitySportsById(reducedCsvText);
  const fitFileIdToActivityId = parseFitFileIdToActivityId(rawCsvText);
  if (activitySports.size === 0) return {};

  let FitParserCtor;
  try {
    FitParserCtor = await ensureFitParserLoaded();
  } catch (error) {
    console.warn('FIT parser could not be loaded; continuing without rolling efforts.', error);
    return {};
  }

  const fitEntries = Object.values(zip.files)
    .filter(file => !file.dir && /^activities\/\d+\.fit(\.gz)?$/i.test(file.name));

  if (fitEntries.length === 0) return {};

  const byActivityId = {};
  let processed = 0;

  for (const entry of fitEntries) {
    const match = entry.name.match(/^activities\/(\d+)\.fit(\.gz)?$/i);
    if (!match) continue;
    const fitFileId = match[1];
    const activityId = fitFileIdToActivityId.get(fitFileId) || fitFileId;
    const sport = activitySports.get(activityId);
    if (!sport || !FIT_TARGET_DISTANCES_KM[sport]) continue;

    try {
      let bytes = await entry.async('uint8array');
      if (/\.gz$/i.test(entry.name)) {
        bytes = await gunzipUint8Array(bytes);
      }
      const records = await parseFitRecords(FitParserCtor, bytes);
      const summary = summarizeFitBestEfforts(records, sport);
      if (summary) {
        const existing = byActivityId[activityId];
        if (!existing) {
          byActivityId[activityId] = summary;
        } else {
          const existingScore = (existing.distanceEfforts ? existing.distanceEfforts.length : 0) + (existing.powerEfforts ? existing.powerEfforts.length : 0);
          const nextScore = (summary.distanceEfforts ? summary.distanceEfforts.length : 0) + (summary.powerEfforts ? summary.powerEfforts.length : 0);
          if (nextScore > existingScore) {
            byActivityId[activityId] = summary;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to parse FIT activity file: ${entry.name}`, error);
    }

    processed++;
    if (progressCallback && processed % 10 === 0) {
      const ratio = processed / fitEntries.length;
      progressCallback({
        stage: `Analyzing FIT files (${processed}/${fitEntries.length})...`,
        percent: 35 + Math.round(ratio * 30)
      });
    }
  }

  return byActivityId;
}

/**
 * Extract only relevant columns from Strava CSV
 * Based on the column mapping from relevant-export-extractor.js
 */
function extractRelevantColumns(csvText) {
  // Parse CSV
  let rows;
  try {
    rows = parseCsvBasic(csvText);
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err.message}`);
  }

  if (rows.length < 2) {
    throw new Error('CSV is empty or invalid. Make sure you selected the correct Strava export file.');
  }

  const headers = rows[0];
  
  // Validate that we have some recognizable headers
  if (headers.length === 0 || !headers.some(h => h && typeof h === 'string')) {
    throw new Error('CSV headers are empty or invalid');
  }

  // Define required columns (matching relevant-export-extractor.js)
  const columnDefinitions = [
    {
      outputHeader: 'Aktivitäts-ID',
      type: 'oneOf',
      headers: ['Aktivitäts-ID', 'Activity ID'],
      required: true,
    },
    {
      outputHeader: 'Aktivitätsdatum',
      type: 'oneOf',
      headers: ['Aktivitätsdatum', 'Activity Date'],
      required: true,
    },
    {
      outputHeader: 'Name der Aktivität',
      type: 'oneOf',
      headers: ['Name der Aktivität', 'Activity Name'],
      required: true,
    },
    {
      outputHeader: 'Aktivitätsart',
      type: 'oneOf',
      headers: ['Aktivitätsart', 'Activity Type', 'Sport Type'],
      required: true,
    },
    {
      outputHeader: 'Aktivitätsausrüstung',
      type: 'oneOf',
      headers: ['Aktivitätsausrüstung', 'Activity Gear', 'Ausrüstung', 'Fahrrad', 'Gear', 'Bike'],
      required: false,
    },
    {
      outputHeader: 'Bewegungszeit',
      type: 'oneOf',
      headers: ['Bewegungszeit', 'Moving Time'],
      required: false,
    },
    {
      outputHeader: 'Distanz',
      type: 'occurrence',
      headers: ['Distanz', 'Distance'],
      occurrence: 1,
      required: false,
    },
    {
      outputHeader: 'Durchschnittliche Herzfrequenz',
      type: 'predicate',
      required: false,
      predicate: (header) => {
        if (!header) return false;
        const normalized = String(header).toLowerCase();
        return (
          (normalized.includes('herz') || normalized.includes('heart')) &&
          (normalized.includes('durch') || normalized.includes('durchschnitt') || normalized.includes('avg') || normalized.includes('average'))
        );
      },
    },
    {
      outputHeader: 'Durchschnittliche Wattzahl',
      type: 'predicatePower',
      required: false,
      predicate: (header) => {
        if (!header) return false;
        const normalized = String(header).toLowerCase();
        return (
          (normalized.includes('watt') || normalized.includes('power')) &&
          (normalized.includes('durch') || normalized.includes('durchschnitt') || normalized.includes('avg') || normalized.includes('average'))
        );
      },
    },
    {
      outputHeader: 'Distanz',
      type: 'occurrence',
      headers: ['Distanz', 'Distance'],
      occurrence: 2,
      required: true,
    },
  ];

  // Find column indices
  const columnIndices = [];
  const missingColumns = [];
  
  for (let colIdx = 0; colIdx < columnDefinitions.length; colIdx++) {
    const colDef = columnDefinitions[colIdx];
    let index = null;

    if (colDef.type === 'exact') {
      index = headers.indexOf(colDef.header);
    } else if (colDef.type === 'oneOf') {
      for (const header of colDef.headers) {
        index = headers.indexOf(header);
        if (index !== -1) break;
      }
    } else if (colDef.type === 'occurrence') {
      let matches = 0;
      for (let i = 0; i < headers.length; i++) {
        if (!colDef.headers.includes(headers[i])) continue;
        matches++;
        if (matches === colDef.occurrence) {
          index = i;
          break;
        }
      }
    } else if (colDef.type === 'predicate' || colDef.type === 'predicatePower') {
      for (let i = 0; i < headers.length; i++) {
        if (colDef.predicate(headers[i])) {
          index = i;
          break;
        }
      }
    }

    columnIndices.push(index);
  }

  // Check that all required columns are found
  for (let idx = 0; idx < columnDefinitions.length; idx++) {
    if (columnDefinitions[idx].required && columnIndices[idx] === null) {
      missingColumns.push(columnDefinitions[idx].outputHeader);
    }
  }
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}. This might not be a valid Strava export.`);
  }

  // Build output rows with relevant columns
  const outputRows = [columnDefinitions.map((c) => c.outputHeader)];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const outputRow = columnIndices.map((idx) => (idx !== null && idx < row.length ? row[idx] : ''));
    outputRows.push(outputRow);
  }

  // Validate we have data rows
  if (outputRows.length < 2) {
    throw new Error('No activity data found in CSV. The export might be empty.');
  }

  // Serialize back to CSV
  return serializeCsvBasic(outputRows);
}

/**
 * Basic CSV parser (handles quotes and escaped values)
 * Async version to avoid blocking the main thread for large files
 */
function parseCsvBasic(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index++;
      }

      row.push(cell);
      cell = '';

      if (row.some((value) => value !== '')) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Basic CSV serializer
 */
function serializeCsvBasic(rows) {
  return rows.map((row) => row.map(serializeCsvValue).join(',')).join('\n') + '\n';
}

/**
 * Serialize a single CSV value (with proper quoting)
 */
function serializeCsvValue(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replace(/"/g, '""')}"`;
}

/**
 * Main import function: handles ZIP file, extracts activities.csv, reduces columns, and parses
 * @param {File} zipFile - The ZIP file from Strava export
 * @param {Function} progressCallback - Called with progress info {stage, percent}
 * @returns {Promise<Array>} Array of processed activities
 */
async function importStravaZip(zipFile, progressCallback = null) {
  try {
    await ensureJSZipLoaded();
    const zip = new JSZip();

    // Stage 1: Extract ZIP
    if (progressCallback) progressCallback({ stage: 'Extracting ZIP file...', percent: 10 });
    await zip.loadAsync(zipFile);

    let csvText = null;
    const csvEntries = Object.values(zip.files)
      .filter(file => !file.dir && file.name.toLowerCase().endsWith('activities.csv'));
    if (csvEntries.length > 0) {
      csvText = await csvEntries[0].async('string');
    }
    if (!csvText) {
      throw new Error('Could not find activities.csv in ZIP file. Make sure you exported data from Strava.');
    }

    // Stage 2: Extract relevant columns
    if (progressCallback) progressCallback({ stage: 'Extracting relevant columns...', percent: 30 });
    const relevantCsv = extractRelevantColumns(csvText);

    // Stage 3: Parse detailed FIT activity files for rolling best efforts
    if (progressCallback) progressCallback({ stage: 'Analyzing FIT activity files...', percent: 35 });
    const fitBestEffortsByActivityId = await extractFitBestEffortsFromZip(zip, relevantCsv, csvText, progressCallback);

    // Stage 4: Parse and process (this will be done by the main processData function)
    if (progressCallback) progressCallback({ stage: 'Parsing data...', percent: 70 });

    return {
      csvText: relevantCsv,
      fitBestEffortsByActivityId
    };
  } catch (error) {
    console.error('Strava ZIP import error:', error);
    throw error;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractRelevantColumns,
    parseCsvBasic,
    serializeCsvBasic,
    importStravaZip
  };
}
