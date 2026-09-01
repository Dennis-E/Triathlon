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
    parseCsvBasic,
    serializeCsvBasic,
    extractRelevantColumns
  };
}