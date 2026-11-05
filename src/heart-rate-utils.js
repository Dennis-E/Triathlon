(function attachHeartRateUtils(root) {
  function getValidExtrema(activity) {
    if (!activity || !['Run', 'Bike', 'Swim'].includes(activity.sport) ||
        activity.date === null || activity.date === undefined || activity.date === '' ||
        !Number.isFinite(new Date(activity.date).getTime())) return null;
    const minimum = Number.isFinite(activity.minHeartRate) && activity.minHeartRate > 0 ? activity.minHeartRate : null;
    const maximum = Number.isFinite(activity.maxHeartRate) && activity.maxHeartRate > 0 ? activity.maxHeartRate : null;
    if (minimum !== null && maximum !== null && minimum > maximum) return null;
    return minimum !== null || maximum !== null ? { minimum, maximum } : null;
  }

  function hasHeartRateData(activities) {
    return Array.isArray(activities) && activities.some(activity => getValidExtrema(activity) !== null);
  }

  function buildHeartRateTimeline(activities, options = {}) {
    const model = { minimumPoints: [], maximumPoints: [], activityCount: 0 };
    if (!Array.isArray(activities)) return model;
    const qualified = activities.map((activity, index) => {
      const extrema = getValidExtrema(activity);
      if (!extrema) return null;
      const identity = typeof options.getActivityKey === 'function' ? options.getActivityKey(activity) : null;
      const sourceOrdinal = identity && Number.isInteger(identity.sourceOrdinal) ? identity.sourceOrdinal : index;
      const date = new Date(activity.date);
      const start = activity.startTime === null || activity.startTime === undefined || activity.startTime === '' ? null : new Date(activity.startTime);
      const startTimeEpoch = start && Number.isFinite(start.getTime()) ? start.getTime() : null;
      const sourceLocal = activity.sourceLocalStart;
      const startTimeLabel = sourceLocal && Number.isFinite(sourceLocal.hour) && Number.isFinite(sourceLocal.minute)
        ? `${String(sourceLocal.hour).padStart(2, '0')}:${String(sourceLocal.minute).padStart(2, '0')}`
        : startTimeEpoch !== null ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` : '';
      return {
        extrema,
        evidence: activity.heartRateProvenance,
        point: {
          x: date.getTime(), dateEpoch: date.getTime(), startTimeEpoch,
          activityKey: identity && identity.activityKey ? String(identity.activityKey) : `${activity.id ?? 'training'}:${sourceOrdinal}`,
          sourceOrdinal, sport: activity.sport, name: String(activity.name || ''),
          displayName: `${activity.name ? `${activity.name} - ` : ''}Training ${sourceOrdinal + 1}`,
          dateLabel: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          startTimeLabel
        }
      };
    }).filter(Boolean);
    if (!options.preserveInputOrder) qualified.sort((first, second) => first.point.dateEpoch - second.point.dateEpoch ||
      (first.point.startTimeEpoch ?? Infinity) - (second.point.startTimeEpoch ?? Infinity) || first.point.sourceOrdinal - second.point.sourceOrdinal);
    for (const { extrema, point, evidence } of qualified) {
      for (const kind of ['minimum', 'maximum']) {
        if (extrema[kind] !== null) model[`${kind}Points`].push({ ...point, kind, y: extrema[kind],
          provenance: evidence && evidence[kind] ? { ...evidence[kind] } : null });
      }
    }
    model.activityCount = new Set(qualified.map(record => record.point.activityKey)).size;
    return model;
  }

  function buildHeartRatePeriodModel(activities, options = {}) {
    const aggregation = ['daily', 'weekly', 'monthly', 'yearly'].includes(options.aggregation) ? options.aggregation : 'daily';
    const timeline = buildHeartRateTimeline(activities, { ...options, preserveInputOrder: true });
    const periods = new Map();
    const contributorsByPeriod = new Map();
    const dateLabel = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    for (const point of [...timeline.minimumPoints, ...timeline.maximumPoints]) {
      const start = new Date(point.dateEpoch);
      start.setHours(0, 0, 0, 0);
      if (aggregation === 'weekly') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
      if (aggregation === 'monthly') start.setDate(1);
      if (aggregation === 'yearly') start.setMonth(0, 1);
      const end = new Date(start);
      if (aggregation === 'daily') end.setDate(end.getDate() + 1);
      if (aggregation === 'weekly') end.setDate(end.getDate() + 7);
      if (aggregation === 'monthly') end.setMonth(end.getMonth() + 1);
      if (aggregation === 'yearly') end.setFullYear(end.getFullYear() + 1);
      const key = aggregation === 'monthly' ? dateLabel(start).slice(0, 7) : aggregation === 'yearly' ? String(start.getFullYear()) : dateLabel(start);
      const visibleStartMs = Math.max(start.getTime(), Number.isFinite(options.rangeStart) ? options.rangeStart : -Infinity);
      const visibleEndMs = Math.min(end.getTime() - 1, Number.isFinite(options.rangeEnd) ? options.rangeEnd : Infinity);
      if (visibleStartMs > visibleEndMs) continue;
      if (!periods.has(key)) {
        const lastDay = new Date(end);
        lastDay.setDate(lastDay.getDate() - 1);
        periods.set(key, { periodKey: key, label: aggregation === 'weekly' ? `${key} - ${dateLabel(lastDay)}` : key,
          startMs: start.getTime(), endExclusiveMs: end.getTime(), visibleStartMs, visibleEndMs,
          contributors: [], minimum: { value: null, sources: [] }, maximum: { value: null, sources: [] } });
        contributorsByPeriod.set(key, new Map());
      }
      const period = periods.get(key);
      const contributors = contributorsByPeriod.get(key);
      let contributor = contributors.get(point.activityKey);
      if (!contributor) {
        const { kind, y, provenance, ...details } = point;
        contributor = { ...details, minimum: null, maximum: null };
        period.contributors.push(contributor);
        contributors.set(point.activityKey, contributor);
      }
      const source = { ...point, provenance: point.provenance ? { ...point.provenance } : null };
      contributor[point.kind] = source;
      const extreme = period[point.kind];
      const better = extreme.value === null || (point.kind === 'minimum' ? point.y < extreme.value : point.y > extreme.value);
      if (better) { extreme.value = point.y; extreme.sources = [source]; }
      else if (point.y === extreme.value) extreme.sources.push(source);
    }
    const model = { aggregation, periods: [...periods.values()].sort((first, second) => first.startMs - second.startMs),
      minimumPoints: [], maximumPoints: [], activityCount: 0, periodCount: periods.size };
    const keys = new Set();
    for (const period of model.periods) {
      period.contributors.forEach(contributor => keys.add(contributor.activityKey));
      for (const kind of ['minimum', 'maximum']) {
        const extreme = period[kind];
        if (extreme.value !== null) model[`${kind}Points`].push({
          x: period.visibleStartMs + (period.visibleEndMs - period.visibleStartMs) / 2, y: extreme.value, kind,
          periodKey: period.periodKey, label: period.label, dateLabel: period.label,
          activityKey: period.periodKey, sourceOrdinal: extreme.sources[0].sourceOrdinal,
          sources: extreme.sources, contributors: period.contributors, periodCount: period.contributors.length
        });
      }
    }
    model.activityCount = keys.size;
    return model;
  }

  function getCsvHeartRateKind(header) {
    const normalized = String(header || '').trim().toLowerCase();
    if (['min heart rate', 'minimum heart rate', 'minimale herzfrequenz'].includes(normalized)) return 'minHeartRate';
    if (['max heart rate', 'maximum heart rate', 'maximale herzfrequenz', 'max. herzfrequenz'].includes(normalized)) return 'maxHeartRate';
    return null;
  }

  function fieldEvidence(value, status, source, reason, sampleCount = null, readComplete = null) {
    return { value, status, source, reason, sampleCount, readComplete };
  }

  function inspectCsvHeartRateExtrema(headers, row) {
    const result = {};
    for (const [kind, field] of [['minimum', 'minHeartRate'], ['maximum', 'maxHeartRate']]) {
      const values = (Array.isArray(headers) ? headers : []).reduce((found, header, index) => {
        if (getCsvHeartRateKind(header) !== field) return found;
        const text = String((row || [])[index] ?? '').trim();
        if (!text) return found;
        const value = /^[+]?\d+(?:[.,]\d+)?$/.test(text) ? Number(text.replace(',', '.')) : NaN;
        found.push(Number.isFinite(value) && value > 0 ? value : null);
        return found;
      }, []);
      if (!values.length) result[kind] = fieldEvidence(null, 'missing', null, 'missing');
      else if (values.includes(null)) result[kind] = fieldEvidence(null, 'invalid', 'summary', 'invalid_value');
      else if (!values.every(value => value === values[0])) result[kind] = fieldEvidence(null, 'conflict', 'summary', 'conflict');
      else result[kind] = fieldEvidence(values[0], 'valid', 'summary', null);
    }
    return result;
  }

  function parseCsvHeartRateExtrema(headers, row) {
    const evidence = inspectCsvHeartRateExtrema(headers, row);
    return { minHeartRate: evidence.minimum.value, maxHeartRate: evidence.maximum.value };
  }

  function deriveTimedHeartRateExtrema(records, qualification = {}) {
    const read = qualification.readEvidence || {};
    let reason = null;
    if (read.resourceLimited) reason = 'resource_limit';
    else if (!read.readStatus || read.readStatus === 'unknown') reason = 'read_unknown';
    else if (read.readStatus !== 'complete' || !read.lengthValidated || !read.integrityValidated ||
      !read.strictParseCompleted || !read.recordsComplete) reason = 'read_incomplete';
    else if (read.unit !== 'bpm') reason = 'unknown_unit';
    else if (qualification.qualified !== true) {
      const ownershipReasons = ['invalid_boundary', 'overlapping_sessions', 'ambiguous_boundary_record', 'invalid_timestamp'];
      reason = ownershipReasons.includes(qualification.reason) ? qualification.reason : 'read_unknown';
    }
    const unavailable = (failure, readComplete = false) => ({
      minimum: fieldEvidence(null, 'unqualified', 'records', failure, 0, readComplete),
      maximum: fieldEvidence(null, 'unqualified', 'records', failure, 0, readComplete)
    });
    if (reason) return unavailable(reason);
    const samples = [];
    for (const record of Array.isArray(records) ? records : []) {
      if (!record || !Number.isInteger(record.heart_rate) || record.heart_rate < 1 || record.heart_rate > 254) continue;
      if (!(record.timestamp instanceof Date) || !Number.isFinite(record.timestamp.getTime())) return unavailable('invalid_timestamp');
      samples.push(record.heart_rate);
    }
    if (!samples.length) return unavailable('no_samples', true);
    let minimum = Infinity;
    let maximum = -Infinity;
    for (const sample of samples) {
      minimum = Math.min(minimum, sample);
      maximum = Math.max(maximum, sample);
    }
    return {
      minimum: fieldEvidence(minimum, 'valid', 'records', null, samples.length, true),
      maximum: fieldEvidence(maximum, 'valid', 'records', null, samples.length, true)
    };
  }

  function resolveHeartRateExtrema(directEvidence, observedEvidence) {
    const direct = directEvidence || inspectCsvHeartRateExtrema([], []);
    const provenance = {};
    for (const kind of ['minimum', 'maximum']) {
      const summary = direct[kind] || fieldEvidence(null, 'missing', null, 'missing');
      const observed = observedEvidence && observedEvidence[kind];
      provenance[kind] = { ...(summary.status === 'missing' && observed ? observed : summary) };
    }
    if (provenance.minimum.value !== null && provenance.maximum.value !== null && provenance.minimum.value > provenance.maximum.value) {
      for (const kind of ['minimum', 'maximum']) {
        if (provenance[kind].source === 'records') {
          provenance[kind] = { ...provenance[kind], value: null, status: 'unqualified', reason: 'inconsistent_with_summary' };
        }
      }
    }
    return { minHeartRate: provenance.minimum.value, maxHeartRate: provenance.maximum.value, heartRateProvenance: provenance };
  }

  function summarizeHeartRateCoverage(activities) {
    const empty = () => ({ summary: 0, records: 0, missing: 0, invalid: 0, conflict: 0, unqualified: 0 });
    const coverage = { minimum: empty(), maximum: empty(), average: 0 };
    for (const activity of Array.isArray(activities) ? activities : []) {
      if (!activity) continue;
      if (Number.isFinite(activity.avgHeartRate) && activity.avgHeartRate > 0) coverage.average += 1;
      const reversed = Number.isFinite(activity.minHeartRate) && Number.isFinite(activity.maxHeartRate) && activity.minHeartRate > activity.maxHeartRate;
      for (const kind of ['minimum', 'maximum']) {
        const evidence = activity.heartRateProvenance && activity.heartRateProvenance[kind];
        let category = evidence ? evidence.status : 'missing';
        if (reversed) category = 'invalid';
        else if (category === 'valid') category = ['summary', 'records'].includes(evidence.source) ? evidence.source : 'unqualified';
        if (!Object.prototype.hasOwnProperty.call(coverage[kind], category)) category = 'unqualified';
        coverage[kind][category] += 1;
      }
    }
    return coverage;
  }

  const api = { hasHeartRateData, buildHeartRateTimeline, buildHeartRatePeriodModel, getCsvHeartRateKind, parseCsvHeartRateExtrema,
    inspectCsvHeartRateExtrema, deriveTimedHeartRateExtrema, resolveHeartRateExtrema, summarizeHeartRateCoverage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.heartRateUtils = api;
})(typeof window !== 'undefined' ? window : null);