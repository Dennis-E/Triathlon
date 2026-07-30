/**
 * Dashboard Utilities - Extracted from index.html for testing
 * Contains all pure functions for data parsing, processing, and aggregation
 */

// Standard Sport Categorization
const SPORT_MAP = {
  'lauf': 'Run', 'laufen': 'Run', 'run': 'Run', 'running': 'Run', 'virtueller lauf': 'Run',
  'trail run': 'Run', 'trailrun': 'Run', 'walk': 'Run', 'gehen': 'Run',
  'radfahrt': 'Bike', 'virtuelle radfahrt': 'Bike', 'radfahren': 'Bike', 'ride': 'Bike', 'virtual ride': 'Bike', 'virtualride': 'Bike', 'virtuelle fahrt': 'Bike', 'bike': 'Bike', 'biking': 'Bike', 'cycling': 'Bike', 'gravel ride': 'Bike', 'mountain bike ride': 'Bike', 'ebike ride': 'Bike', 'e-bike ride': 'Bike',
  'schwimmen': 'Swim', 'swim': 'Swim', 'swimming': 'Swim'
};

function findHeaderIndex(headers, matcher) {
  if (!Array.isArray(headers)) return -1;

  if (matcher.type === 'exact') {
    return headers.indexOf(matcher.header);
  }

  if (matcher.type === 'oneOf') {
    for (const header of matcher.headers) {
      const index = headers.indexOf(header);
      if (index !== -1) return index;
    }
    return -1;
  }

  if (matcher.type === 'includesOneOf') {
    return headers.findIndex(header => {
      if (!header) return false;
      const normalized = String(header).toLowerCase();
      return matcher.values.some(value => normalized.includes(value));
    });
  }

  return -1;
}

/**
 * Parse German date format (e.g., "19.07.2026, 14:52:02")
 * @param {string} dateStr - Date string in German format
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseGermanDate(dateStr) {
  if (!dateStr) return null;
  const directParse = new Date(dateStr);
  if (!Number.isNaN(directParse.getTime())) {
    return directParse;
  }

  const parts = dateStr.split(',');
  if (!parts[0]) return null;
  const dmy = parts[0].trim().split('.');
  if (dmy.length !== 3) return null;
  const day = parseInt(dmy[0], 10);
  const month = parseInt(dmy[1], 10) - 1; // 0-indexed
  const year = parseInt(dmy[2], 10);
  
  // Validate day and month
  if (day < 1 || day > 31 || month < 0 || month > 11) {
    return null;
  }
  
  const parsedDate = new Date(year, month, day);
  // Verify the date is valid (e.g., Feb 30 would auto-correct, so check it matches)
  if (isNaN(parsedDate.getTime()) || parsedDate.getDate() !== day || parsedDate.getMonth() !== month) {
    return null;
  }
  return parsedDate;
}

/**
 * Get Monday of a date's week
 * @param {Date} date - Input date
 * @returns {Date} Monday of that week
 */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format Date as 'YYYY-MM-DD'
 * @param {Date} date - Input date
 * @returns {string} ISO date string
 */
function formatDateIso(date) {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format Date for Chart Label (e.g., "13 Jul '26")
 * @param {Date} date - Input date
 * @returns {string} Formatted label
 */
function formatDateLabel(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = months[date.getMonth()];
  const y = String(date.getFullYear()).slice(-2);
  return `${date.getDate()} ${m} '${y}`;
}

/**
 * Format seconds to human readable (e.g., "1h 45m")
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

/**
 * Categorize sport name to standard category
 * @param {string} rawSport - Raw sport name from CSV
 * @returns {string|null} Standardized sport name ('Run', 'Bike', 'Swim') or null
 */
function categorizeSport(rawSport) {
  if (!rawSport) return null;
  return SPORT_MAP[rawSport.toLowerCase().trim()] || null;
}

/**
 * Process raw CSV data into normalized activity objects
 * @param {Array<Array>} rawCsvData - Raw CSV rows from Papa Parse
 * @returns {Array} Processed activities array
 * @throws {Error} If required columns are missing
 */
function processData(rawCsvData) {
  if (!rawCsvData || rawCsvData.length < 1) {
    return [];
  }

  if (rawCsvData.length < 2) {
    return []; // Only headers, no data
  }

  const headers = rawCsvData[0];
  
  // Dynamic column resolution - try exact match first, then partial
  let dateIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Aktivitätsdatum', 'Activity Date'] });
  if (dateIdx === -1) {
    dateIdx = headers.findIndex(h => h && h.includes('Aktivitätsdatum'));
  }
  
  let sportIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Aktivitätsart', 'Activity Type', 'Sport Type'] });
  if (sportIdx === -1) {
    sportIdx = headers.findIndex(h => h && h.includes('Aktivitätsart'));
  }
  
  const nameIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Name der Aktivität', 'Activity Name'] });
  const durationIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Bewegungszeit', 'Moving Time'] });

  // Find 'Distanz' columns
  const distIndices = [];
  headers.forEach((h, i) => {
    if (h === 'Distanz' || h === 'Distance') distIndices.push(i);
  });
  const distIdx = distIndices.length > 1 ? distIndices[1] : (distIndices[0] || -1);

  if (dateIdx === -1 || sportIdx === -1) {
    throw new Error('Could not locate core columns (Aktivitätsdatum, Aktivitätsart)');
  }

  const processedActivities = [];

  for (let i = 1; i < rawCsvData.length; i++) {
    const row = rawCsvData[i];
    if (row.length <= Math.max(dateIdx, sportIdx)) continue;

    const rawDate = row[dateIdx];
    const date = parseGermanDate(rawDate);
    if (!date) continue;

    const rawSport = row[sportIdx] || '';
    const sportCategory = categorizeSport(rawSport);

    let distKm = 0;
    if (distIdx !== -1) {
      let rawDist = row[distIdx];
      if (rawDist) {
        if (typeof rawDist === 'string') {
          rawDist = rawDist.replace(',', '.');
        }
        const numericDist = parseFloat(rawDist);
        if (!isNaN(numericDist)) {
          // If we have 2 Distanz columns, the 2nd is in meters; if only 1, assume it's in meters
          // (matching Strava export format)
          if (distIndices.length > 1 && distIdx === distIndices[1]) {
            distKm = numericDist / 1000; // 2nd column is meters
          } else if (distIndices.length === 1) {
            distKm = numericDist / 1000; // Only 1 column, assume meters
          } else {
            distKm = numericDist; // 1st column is km
          }
        }
      }
    }

    let durationSeconds = 0;
    if (durationIdx !== -1) {
      const rawDuration = parseFloat(row[durationIdx]);
      if (!isNaN(rawDuration)) {
        durationSeconds = rawDuration;
      }
    }

    const name = row[nameIdx] || 'Activity';

    processedActivities.push({
      id: row[0],
      date: date,
      monday: getMonday(date),
      sportRaw: rawSport,
      sport: sportCategory,
      distance: distKm,
      duration: durationSeconds,
      name: name
    });
  }

  // Sort chronologically ascending
  processedActivities.sort((a, b) => a.date - b.date);

  return processedActivities;
}

/**
 * Parse CSV text using simple split (compatible with test environment)
 * NOTE: This is a simplified parser. For production use Papa Parse in the browser.
 * This handles CSV where quoted fields contain commas.
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Array>} Parsed CSV data
 */
function parseCsvSimple(csvText) {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    // Simple CSV parser that handles quoted fields
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Aggregate activities by week and sport
 * @param {Array} activities - Processed activities
 * @param {number} numberOfWeeks - Number of weeks to include
 * @returns {Array} Weekly aggregation with Run/Bike/Swim totals
 */
function aggregateByWeek(activities, numberOfWeeks = 52) {
  // If no activities, return empty array
  if (!activities || activities.length === 0) {
    return [];
  }

  const maxDate = new Date(Math.max(...activities.map(a => a.date)));
  const lastMonday = getMonday(maxDate);

  const weeksList = [];
  for (let i = numberOfWeeks - 1; i >= 0; i--) {
    const monday = new Date(lastMonday);
    monday.setDate(lastMonday.getDate() - (i * 7));
    weeksList.push({
      date: monday,
      formattedLabel: formatDateLabel(monday),
      isoKey: formatDateIso(monday),
      Run: 0,
      Bike: 0,
      Swim: 0
    });
  }

  const activeWeeksKeys = new Set(weeksList.map(w => w.isoKey));

  // Filter and aggregate
  activities.forEach(act => {
    if (!act.sport) return;
    const weekKey = formatDateIso(act.monday);
    const weekObj = weeksList.find(w => w.isoKey === weekKey);
    if (weekObj) {
      weekObj[act.sport] += act.distance;
    }
  });

  return weeksList;
}

/**
 * Calculate total distance by sport
 * @param {Array} activities - Processed activities
 * @returns {Object} Object with total distances by sport
 */
function calculateTotalsByCategory(activities) {
  const totals = {
    Run: 0,
    Bike: 0,
    Swim: 0,
    All: 0
  };

  activities.forEach(act => {
    if (act.sport === 'Run') totals.Run += act.distance;
    else if (act.sport === 'Bike') totals.Bike += act.distance;
    else if (act.sport === 'Swim') totals.Swim += act.distance;
  });

  totals.All = totals.Run + totals.Bike + totals.Swim;
  return totals;
}

/**
 * Calculate training metrics for dashboard cards
 * @param {Array} activities - Filtered activities
 * @param {number} numberOfWeeks - Number of weeks in timeframe
 * @returns {Object} Metrics object
 */
function calculateMetrics(activities, numberOfWeeks = 52) {
  if (activities.length === 0) {
    return {
      totalKm: 0,
      avgKmPerWeek: 0,
      peakWeekKm: 0,
      uniqueDays: 0
    };
  }

  let totalKm = 0;
  let peakKm = 0;
  const uniqueDays = new Set();

  activities.forEach(act => {
    totalKm += act.distance;
    uniqueDays.add(formatDateIso(act.date));
  });

  // Calculate peak from weekly aggregation
  const weekly = aggregateByWeek(activities, numberOfWeeks);
  weekly.forEach(w => {
    const weeklyTotal = w.Run + w.Bike + w.Swim;
    if (weeklyTotal > peakKm) {
      peakKm = weeklyTotal;
    }
  });

  return {
    totalKm,
    avgKmPerWeek: numberOfWeeks > 0 ? (totalKm / numberOfWeeks) : 0,
    peakWeekKm: peakKm,
    uniqueDays: uniqueDays.size
  };
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseGermanDate,
    getMonday,
    formatDateIso,
    formatDateLabel,
    formatDuration,
    categorizeSport,
    processData,
    parseCsvSimple,
    aggregateByWeek,
    calculateTotalsByCategory,
    calculateMetrics,
    SPORT_MAP
  };
}
