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

function calculateRollingPowerEfforts(records, targetSeconds, coverageThreshold = 0.8) {
  if (!Array.isArray(records) || !Number.isFinite(targetSeconds) || targetSeconds <= 0) return [];
  const points = records
    .filter(record => record && Number.isFinite(record.tSec) && Number.isFinite(record.distKm))
    .map(record => ({ ...record, power: normalizePowerValue(record.power) }))
    .sort((a, b) => a.tSec - b.tSec);
  const efforts = [];

  for (let startIndex = 0; startIndex < points.length; startIndex++) {
    const start = points[startIndex];
    const window = points.filter(point => point.tSec >= start.tSec && point.tSec <= start.tSec + targetSeconds);
    if (window.length < 2) continue;
    const end = window[window.length - 1];
    const observedSpan = end.tSec - start.tSec;
    const validPoints = window.filter(point => point.power !== null);
    const coverage = Math.min(1, observedSpan / targetSeconds) * (validPoints.length / window.length);
    if (coverage < coverageThreshold || validPoints.length === 0) continue;

    efforts.push({
      targetSeconds,
      avgPower: validPoints.reduce((sum, point) => sum + point.power, 0) / validPoints.length,
      startSec: start.tSec,
      endSec: end.tSec,
      startKm: start.distKm,
      endKm: end.distKm
    });
  }

  if (efforts.length === 0) return [];
  const best = efforts.reduce((current, effort) => effort.avgPower > current.avgPower ? effort : current);
  return [best];
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
    buildAllTimePowerProfile,
    getPowerProfileWattRange,
    markPowerProfileLabelVisibility
  };
}
