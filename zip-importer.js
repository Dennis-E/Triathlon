/**
 * ZIP Import Utility for Strava Data
 * Handles ZIP file extraction, CSV parsing, and relevant column extraction
 */

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
    { outputHeader: 'Aktivitäts-ID', type: 'exact', header: 'Aktivitäts-ID' },
    { outputHeader: 'Aktivitätsdatum', type: 'exact', header: 'Aktivitätsdatum' },
    { outputHeader: 'Name der Aktivität', type: 'exact', header: 'Name der Aktivität' },
    { outputHeader: 'Aktivitätsart', type: 'exact', header: 'Aktivitätsart' },
    {
      outputHeader: 'Aktivitätsausrüstung',
      type: 'oneOf',
      headers: ['Aktivitätsausrüstung', 'Ausrüstung', 'Fahrrad'],
    },
    { outputHeader: 'Bewegungszeit', type: 'exact', header: 'Bewegungszeit' },
    { outputHeader: 'Distanz', type: 'exact', header: 'Distanz' },
    {
      outputHeader: 'Durchschnittliche Herzfrequenz',
      type: 'predicate',
      predicate: (header) => {
        if (!header) return false;
        const normalized = String(header).toLowerCase();
        return (
          (normalized.includes('herz') || normalized.includes('heart')) &&
          (normalized.includes('durch') || normalized.includes('avg') || normalized.includes('durchschnitt'))
        );
      },
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
    } else if (colDef.type === 'predicate') {
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
  const requiredIndices = [0, 1, 2, 3, 6]; // ID, Date, Name, Sport, Distanz
  for (const idx of requiredIndices) {
    if (columnIndices[idx] === null) {
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
    // Stage 1: Extract ZIP
    if (progressCallback) progressCallback({ stage: 'Extracting ZIP file...', percent: 10 });
    const csvText = await extractActivitiesCsvFromZip(zipFile);

    // Stage 2: Extract relevant columns
    if (progressCallback) progressCallback({ stage: 'Extracting relevant columns...', percent: 30 });
    const relevantCsv = extractRelevantColumns(csvText);

    // Stage 3: Parse and process (this will be done by the main processData function)
    if (progressCallback) progressCallback({ stage: 'Parsing data...', percent: 60 });

    return relevantCsv;
  } catch (error) {
    console.error('Strava ZIP import error:', error);
    throw error;
  }
}
