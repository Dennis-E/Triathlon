const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REQUIRED_ACTIVITY_COLUMNS = [
  { outputHeader: 'Aktivitäts-ID', type: 'oneOf', headers: ['Aktivitäts-ID', 'Activity ID'], required: true },
  { outputHeader: 'Aktivitätsdatum', type: 'oneOf', headers: ['Aktivitätsdatum', 'Activity Date'], required: true },
  { outputHeader: 'Name der Aktivität', type: 'oneOf', headers: ['Name der Aktivität', 'Activity Name'], required: true },
  { outputHeader: 'Aktivitätsart', type: 'oneOf', headers: ['Aktivitätsart', 'Activity Type', 'Sport Type'], required: true },
  { outputHeader: 'Aktivitätsausrüstung', type: 'oneOf', headers: ['Aktivitätsausrüstung', 'Activity Gear', 'Ausrüstung', 'Fahrrad', 'Gear', 'Bike'], required: false },
  { outputHeader: 'Bewegungszeit', type: 'oneOf', headers: ['Bewegungszeit', 'Moving Time'], required: false },
  { outputHeader: 'Distanz', type: 'occurrence', headers: ['Distanz', 'Distance'], occurrence: 1, required: true },
  { outputHeader: 'Durchschnittliche Herzfrequenz', type: 'predicate', required: false },
  { outputHeader: 'Durchschnittliche Wattzahl', type: 'predicatePower', required: false },
  { outputHeader: 'Distanz', type: 'occurrence', headers: ['Distanz', 'Distance'], occurrence: 2, required: true }
];

function parseCsv(text) {
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

      if (row.some(value => value !== '')) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some(value => value !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function serializeCsv(rows) {
  return `${rows.map(serializeCsvRow).join('\n')}\n`;
}

function serializeCsvRow(row) {
  return row.map(serializeCsvValue).join(',');
}

function serializeCsvValue(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function findHeaderIndex(headers, column) {
  if (column.type === 'exact') {
    const index = headers.indexOf(column.header);
    return index === -1 ? null : index;
  }

  if (column.type === 'oneOf') {
    for (const header of column.headers) {
      const index = headers.indexOf(header);
      if (index !== -1) return index;
    }
    return null;
  }

  if (column.type === 'occurrence') {
    let matchCount = 0;
    for (let index = 0; index < headers.length; index++) {
      if (!column.headers.includes(headers[index])) continue;
      matchCount++;
      if (matchCount === column.occurrence) {
        return index;
      }
    }
    return null;
  }

  if (column.type === 'predicate') {
    const index = headers.findIndex(header => {
      if (!header) return false;
      const normalized = String(header).toLowerCase();
      return (normalized.includes('herz') || normalized.includes('heart')) &&
        (normalized.includes('durch') || normalized.includes('durchschnitt') || normalized.includes('avg') || normalized.includes('average'));
    });
    return index === -1 ? null : index;
  }

  if (column.type === 'predicatePower') {
    const index = headers.findIndex(header => {
      if (!header) return false;
      const normalized = String(header).toLowerCase();
      return (normalized.includes('watt') || normalized.includes('power')) &&
        (normalized.includes('durch') || normalized.includes('durchschnitt') || normalized.includes('avg') || normalized.includes('average'));
    });
    return index === -1 ? null : index;
  }

  if (column.type === 'predicateElevation') {
    const index = headers.findIndex(header => {
      if (!header) return false;
      const normalized = String(header).replace(/^\uFEFF/, '').trim().toLowerCase()
        .replace(/[()\[\]_-]+/g, ' ').replace(/\s+/g, ' ');
      return normalized.includes('höhenmeter') || normalized.includes('elevation gain') ||
        normalized.includes('höhenzunahme') || normalized.includes('höhenunterschied') ||
        normalized.includes('total elevation') || normalized.includes('elevation ascent') ||
        normalized === 'ascent' || normalized.includes('ascent m');
    });
    return index === -1 ? null : index;
  }

  return null;
}

function reduceActivitiesRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('activities.csv is empty or invalid');
  }

  const headers = rows[0];
  const selectedColumns = REQUIRED_ACTIVITY_COLUMNS.map(column => {
    const index = findHeaderIndex(headers, column);
    if (index === null && column.required) {
        const descriptor = column.type === 'occurrence'
          ? `${column.outputHeader} (#${column.occurrence})`
          : column.outputHeader;
        throw new Error(`Missing required activities.csv column: ${descriptor}`);
      }

    return {
      outputHeader: column.outputHeader,
      index
    };
  });

  const elevationIndex = findHeaderIndex(headers, { type: 'predicateElevation' });

  const reducedRows = [selectedColumns.map(column => column.outputHeader)];
  if (elevationIndex !== null) reducedRows[0].push('Höhenmeter');

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const reducedRow = selectedColumns.map(column => {
      if (column.index === null || column.index >= row.length) return '';
      return row[column.index];
    });
    if (elevationIndex !== null) reducedRow.push(elevationIndex >= row.length ? '' : row[elevationIndex]);
    reducedRows.push(reducedRow);
  }

  return reducedRows;
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function findExportRoot(inputPath) {
  const directActivitiesPath = path.join(inputPath, 'activities.csv');
  if (fs.existsSync(directActivitiesPath)) {
    return inputPath;
  }

  const entries = fs.readdirSync(inputPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(inputPath, entry.name);
    if (fs.existsSync(path.join(candidate, 'activities.csv'))) {
      return candidate;
    }
  }

  throw new Error(`Could not locate activities.csv under ${inputPath}`);
}

function extractZipToTemp(zipPath) {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tri-relevant-export-'));
  const command = [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${tempDirectory.replace(/'/g, "''")}' -Force`
  ];

  const result = spawnSync('powershell.exe', command, {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    const stderr = (result.stderr || '').trim();
    throw new Error(`Failed to extract ZIP archive: ${stderr || 'unknown error'}`);
  }

  return tempDirectory;
}

function extractRelevantExport(inputPath, outputDirectory) {
  if (!inputPath) {
    throw new Error('An input path is required');
  }

  if (!outputDirectory) {
    throw new Error('An output directory is required');
  }

  const resolvedInputPath = path.resolve(inputPath);
  const resolvedOutputDirectory = path.resolve(outputDirectory);

  if (!fs.existsSync(resolvedInputPath)) {
    throw new Error(`Input path does not exist: ${resolvedInputPath}`);
  }

  let extractedTempDirectory = null;
  let exportRoot = resolvedInputPath;
  const stat = fs.statSync(resolvedInputPath);

  if (stat.isFile()) {
    if (path.extname(resolvedInputPath).toLowerCase() !== '.zip') {
      throw new Error(`Unsupported input file: ${resolvedInputPath}`);
    }

    extractedTempDirectory = extractZipToTemp(resolvedInputPath);
    exportRoot = findExportRoot(extractedTempDirectory);
  } else if (stat.isDirectory()) {
    exportRoot = findExportRoot(resolvedInputPath);
  } else {
    throw new Error(`Unsupported input path: ${resolvedInputPath}`);
  }

  try {
    const activitiesPath = path.join(exportRoot, 'activities.csv');
    const activitiesText = fs.readFileSync(activitiesPath, 'utf8');
    const reducedActivitiesRows = reduceActivitiesRows(parseCsv(activitiesText));

    ensureDirectory(resolvedOutputDirectory);
    fs.writeFileSync(
      path.join(resolvedOutputDirectory, 'activities.csv'),
      serializeCsv(reducedActivitiesRows),
      'utf8'
    );

    return {
      exportRoot,
      outputDirectory: resolvedOutputDirectory,
      files: ['activities.csv'],
      activityCount: Math.max(reducedActivitiesRows.length - 1, 0)
    };
  } finally {
    if (extractedTempDirectory) {
      fs.rmSync(extractedTempDirectory, { recursive: true, force: true });
    }
  }
}

function formatCliSummary(result) {
  return [
    `Wrote relevant export data to ${result.outputDirectory}`,
    `Included files: ${result.files.join(', ')}`,
    `Activity rows: ${result.activityCount}`
  ].join('\n');
}

if (require.main === module) {
  const [, , inputPath, outputDirectory] = process.argv;

  if (!inputPath || !outputDirectory) {
    console.error('Usage: node relevant-export-extractor.js <input-zip-or-folder> <output-folder>');
    process.exit(1);
  }

  try {
    const result = extractRelevantExport(inputPath, outputDirectory);
    console.log(formatCliSummary(result));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  REQUIRED_ACTIVITY_COLUMNS,
  parseCsv,
  serializeCsv,
  reduceActivitiesRows,
  extractRelevantExport,
  findExportRoot,
  formatCliSummary
};