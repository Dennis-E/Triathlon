const POWER_DURATIONS = [
  { label: '5s', seconds: 5 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '20m', seconds: 1200 },
  { label: '60m', seconds: 3600 }
];

function normalizePowerValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace(',', '.').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeFitPowerRecords(records) {
  if (!Array.isArray(records)) return [];

  const normalized = [];
  for (const record of records) {
    const timestamp = record && record.timestamp instanceof Date
      ? record.timestamp.getTime()
      : null;
    const distance = record && Number.isFinite(record.distance) ? record.distance : null;
    if (!Number.isFinite(timestamp) || !Number.isFinite(distance)) continue;

    const point = {
      tSec: timestamp / 1000,
      distKm: distance / 1000,
      power: normalizePowerValue(record.power)
    };

    if (normalized.length > 0) {
      const last = normalized[normalized.length - 1];
      if (point.tSec < last.tSec || point.distKm < last.distKm) continue;
      if (point.tSec === last.tSec) {
        if (point.distKm >= last.distKm) {
          last.distKm = point.distKm;
          last.power = point.power;
        }
        continue;
      }
    }

    normalized.push(point);
  }

  return normalized;
}

function preparePowerRecords(records) {
  if (!Array.isArray(records)) {
    return { points: [], usablePowerCount: 0, integerFastPath: false };
  }

  const points = records
    .filter(record => record && Number.isFinite(record.tSec) && Number.isFinite(record.distKm))
    .map((record, index) => ({
      tSec: record.tSec,
      distKm: record.distKm,
      power: normalizePowerValue(record.power),
      inputIndex: index
    }))
    .sort((a, b) => a.tSec - b.tSec || a.inputIndex - b.inputIndex)
    .map(({ inputIndex, ...point }) => point);

  let usablePowerCount = 0;
  let integerFastPath = true;
  let totalPower = 0;
  for (const point of points) {
    if (point.power === null) continue;
    usablePowerCount++;
    integerFastPath = integerFastPath && Number.isSafeInteger(point.power);
    totalPower += point.power;
    integerFastPath = integerFastPath && Number.isSafeInteger(totalPower);
  }

  return { points, usablePowerCount, integerFastPath };
}

function createEffort(start, end, targetSeconds, avgPower) {
  return {
    targetSeconds,
    avgPower,
    startSec: start.tSec,
    endSec: end.tSec,
    startKm: start.distKm,
    endKm: end.distKm
  };
}

function calculateIntegerPowerEffort(points, targetSeconds, coverageThreshold) {
  let leftIndex = 0;
  let endIndex = -1;
  let validCount = 0;
  let powerSum = 0;
  let best = null;

  for (let startIndex = 0; startIndex < points.length; startIndex++) {
    const start = points[startIndex];

    while (leftIndex < points.length && points[leftIndex].tSec < start.tSec) {
      if (leftIndex <= endIndex && points[leftIndex].power !== null) {
        powerSum -= points[leftIndex].power;
        validCount--;
      }
      leftIndex++;
    }

    while (endIndex + 1 < points.length && points[endIndex + 1].tSec <= start.tSec + targetSeconds) {
      endIndex++;
      if (points[endIndex].power !== null) {
        powerSum += points[endIndex].power;
        validCount++;
      }
    }

    const windowCount = endIndex - leftIndex + 1;
    if (windowCount < 2) continue;
    const end = points[endIndex];
    const observedSpan = end.tSec - start.tSec;
    const coverage = Math.min(1, observedSpan / targetSeconds) * (validCount / windowCount);
    if (coverage < coverageThreshold || validCount === 0) continue;

    const effort = createEffort(start, end, targetSeconds, powerSum / validCount);
    if (!best || effort.avgPower > best.avgPower) best = effort;
  }

  return best;
}

function calculateExactPowerEffort(points, targetSeconds, coverageThreshold) {
  let best = null;

  for (let startIndex = 0; startIndex < points.length; startIndex++) {
    const start = points[startIndex];
    const window = points.filter(point => point.tSec >= start.tSec && point.tSec <= start.tSec + targetSeconds);
    if (window.length < 2) continue;
    const end = window[window.length - 1];
    const observedSpan = end.tSec - start.tSec;
    const validPoints = window.filter(point => point.power !== null);
    const coverage = Math.min(1, observedSpan / targetSeconds) * (validPoints.length / window.length);
    if (coverage < coverageThreshold || validPoints.length === 0) continue;

    const avgPower = validPoints.reduce((sum, point) => sum + point.power, 0) / validPoints.length;
    const effort = createEffort(start, end, targetSeconds, avgPower);
    if (!best || effort.avgPower > best.avgPower) best = effort;
  }

  return best;
}

function calculatePreparedPowerEffort(prepared, targetSeconds, coverageThreshold) {
  if (!Number.isFinite(targetSeconds) || targetSeconds <= 0 || prepared.usablePowerCount === 0) return null;
  return prepared.integerFastPath
    ? calculateIntegerPowerEffort(prepared.points, targetSeconds, coverageThreshold)
    : calculateExactPowerEffort(prepared.points, targetSeconds, coverageThreshold);
}

function calculateRollingPowerEfforts(records, targetSeconds, coverageThreshold = 0.8) {
  if (!Array.isArray(records) || !Number.isFinite(targetSeconds) || targetSeconds <= 0) return [];
  const effort = calculatePreparedPowerEffort(preparePowerRecords(records), targetSeconds, coverageThreshold);
  return effort ? [effort] : [];
}

function calculatePowerEffortsForDurations(records, durations, coverageThreshold = 0.8) {
  if (!Array.isArray(records) || !Array.isArray(durations)) return [];
  const prepared = preparePowerRecords(records);
  if (prepared.usablePowerCount === 0) return [];

  const efforts = [];
  durations.forEach(duration => {
    const targetSeconds = Number.isFinite(duration) ? duration : duration && duration.seconds;
    const effort = calculatePreparedPowerEffort(prepared, targetSeconds, coverageThreshold);
    if (effort) efforts.push(effort);
  });
  return efforts;
}

function buildAllTimePowerProfile(records) {
  if (!Array.isArray(records)) return [];
  const highestByDuration = new Map();
  records.forEach(record => {
    const watts = normalizePowerValue(record && record.watts);
    if (!record || !Number.isFinite(record.durationSeconds) || watts === null) return;
    const existing = highestByDuration.get(record.durationSeconds);
    if (!existing || watts > existing.watts) {
      highestByDuration.set(record.durationSeconds, { ...record, watts });
    }
  });
  return Array.from(highestByDuration.values()).sort((a, b) => a.durationSeconds - b.durationSeconds);
}

function getPowerProfileWattRange(points) {
  if (!Array.isArray(points) || points.length === 0) return { min: null, max: null };
  const watts = points.map(point => point.watts).filter(value => Number.isFinite(value));
  if (watts.length === 0) return { min: null, max: null };
  return { min: Math.min(...watts), max: Math.max(...watts) };
}

function markPowerProfileLabelVisibility(points) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const shortestDuration = Math.min(...points.map(point => point.durationSeconds));
  return points.map(point => ({
    ...point,
    showLabel: point.durationSeconds === shortestDuration || point.durationSeconds >= 300
  }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POWER_DURATIONS,
    normalizePowerValue,
    normalizeFitPowerRecords,
    calculateRollingPowerEfforts,
    calculatePowerEffortsForDurations,
    buildAllTimePowerProfile,
    getPowerProfileWattRange,
    markPowerProfileLabelVisibility
  };
}

if (typeof window !== 'undefined') {
  window.powerPbUtils = {
    POWER_DURATIONS,
    normalizePowerValue,
    normalizeFitPowerRecords,
    calculateRollingPowerEfforts,
    calculatePowerEffortsForDurations,
    buildAllTimePowerProfile,
    getPowerProfileWattRange,
    markPowerProfileLabelVisibility
  };
}
