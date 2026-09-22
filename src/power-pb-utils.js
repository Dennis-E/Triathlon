const POWER_DURATIONS = [
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

function createActivityAveragePowerRecords(activities) {
  if (!Array.isArray(activities)) return [];

  const sorted = activities
    .filter(activity => activity && activity.sport === 'Bike' && activity.date instanceof Date && !Number.isNaN(activity.date.getTime()))
    .map(activity => ({ activity, watts: normalizePowerValue(activity.avgWatts) }))
    .filter(item => item.watts !== null)
    .sort((a, b) => a.activity.date - b.activity.date);

  let bestWatts = -Infinity;
  const records = [];
  for (const { activity, watts } of sorted) {
    if (watts <= bestWatts) continue;
    bestWatts = watts;
    records.push({
      category: 'activity-average',
      source: 'activity-average',
      watts,
      date: activity.date,
      activityId: activity.id == null ? null : String(activity.id),
      activityName: activity.name || 'Activity',
      durationSeconds: null,
      targetSeconds: null
    });
  }
  return records;
}

function getPowerAvailabilityState(averageRecords, durationEfforts) {
  const hasAverage = Array.isArray(averageRecords) && averageRecords.length > 0;
  const hasDuration = Array.isArray(durationEfforts) && durationEfforts.length > 0;
  if (hasAverage && hasDuration) return 'average-and-duration';
  if (hasAverage) return 'average-only';
  if (hasDuration) return 'duration-only';
  return 'none';
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

function buildPowerProgression(records) {
  if (!Array.isArray(records)) return [];
  const sorted = records
    .filter(record => record && record.date instanceof Date && !Number.isNaN(record.date.getTime()) && normalizePowerValue(record.watts) !== null)
    .map(record => ({ ...record, watts: normalizePowerValue(record.watts) }))
    .sort((a, b) => a.date - b.date);
  const progression = [];
  const categoryOrder = [];
  const grouped = new Map();
  sorted.forEach(record => {
    if (!grouped.has(record.category)) {
      grouped.set(record.category, []);
      categoryOrder.push(record.category);
    }
    grouped.get(record.category).push(record);
  });

  categoryOrder.forEach(category => {
    let bestWatts = 0;
    grouped.get(category).forEach(record => {
      if (record.watts <= bestWatts) return;
      bestWatts = record.watts;
      progression.push(record);
    });
  });
  return progression;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POWER_DURATIONS,
    normalizePowerValue,
    normalizeFitPowerRecords,
    createActivityAveragePowerRecords,
    getPowerAvailabilityState,
    calculateRollingPowerEfforts,
    buildPowerProgression
  };
}

if (typeof window !== 'undefined') {
  window.powerPbUtils = {
    POWER_DURATIONS,
    normalizePowerValue,
    normalizeFitPowerRecords,
    createActivityAveragePowerRecords,
    getPowerAvailabilityState,
    calculateRollingPowerEfforts,
    buildPowerProgression
  };
}
