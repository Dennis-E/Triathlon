const EXPORT_NEUTRAL_PUNCHLINES = Object.freeze({
  totalDistance: 'One session at a time.',
  paceMetrics: 'Dots, not destiny.',
  heartRate: 'My heart rate, over time.',
  equipment: 'My training toolkit.',
  equipmentTimeline: 'My gear, through time.',
  personalBests: 'A personal training story.',
  heatmap: 'My training, mapped.',
  distributions: 'Training takes many shapes.',
  workoutTime: 'My training, on the clock.',
  trainingCalendar: 'My training calendar.',
  wordcloud: 'Training, in my own words.',
  pieCharts: 'A slice of my training.',
  lifetimeStatistics: 'My training in perspective.',
  mediaGallery: 'My training, in pictures.'
});

function projectExportPunchlineEvidence(snapshot) {
  const data = snapshot?.familyData || {};
  const evidence = [];
  const qualifiers = data.incompleteYear ? ['Selected period includes an incomplete year'] : [];
  const addTotal = (factKey, value, metric, unit, extra = {}) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
    evidence.push({ factKey, kind: 'selected-total', value, metric, unit, qualifiers: qualifiers.slice(), ...extra });
  };
  const addLeader = (factKey, entries, metric, unit, extra = {}) => {
    if (!entries.length || entries.some(entry => typeof entry.value !== 'number' || !Number.isFinite(entry.value) || entry.value < 0)) return;
    const maximum = Math.max(...entries.map(entry => entry.value));
    if (maximum <= 0) return;
    const leaders = entries.filter(entry => entry.value === maximum);
    evidence.push({ factKey, kind: 'leading-category', value: maximum, metric, unit,
      labels: leaders.map(entry => String(entry.label || '')).filter(Boolean), isTie: leaders.length > 1,
      qualifiers: qualifiers.slice(), ...extra });
  };
  switch (snapshot?.targetKey) {
    case 'paceMetrics':
      if (Array.isArray(data.points) && data.points.length && data.points.every(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))) {
        addTotal('selected-observations', data.points.length, 'Displayed observations', 'observations',
          { qualifiers: ['Selected plotted observations; no causal or trend claim'] });
      }
      break;
    case 'equipmentTimeline':
      if (Array.isArray(data.items) && data.items.every(item => item && typeof item === 'object')) {
        addTotal('selected-equipment', data.items.length, 'Displayed equipment', 'equipment items',
          { qualifiers: ['Selected equipment only; dates do not imply continuous usage'] });
      }
      break;
    case 'heatmap':
      addTotal('selected-map-activities', data.activityCount, 'Selected mapped activities', 'activities',
        { qualifiers: ['Selected mapped activities; no additional distance or geographic coverage claim'] });
      break;
    case 'trainingCalendar':
      if (Number.isFinite(data.activityCount)) addTotal('calendar-activities', data.activityCount, 'Selected calendar activities', 'activities');
      else if (data.years?.length && data.years.every(year => Number.isFinite(year.activityCount))) {
        addTotal('calendar-activities', data.years.reduce((sum, year) => sum + year.activityCount, 0), 'Selected calendar activities', 'activities');
      }
      break;
    case 'mediaGallery':
      if (Number.isInteger(data.displayedCount) && data.displayedCount >= 0
          && (!Number.isInteger(data.eligibleCount) || data.eligibleCount >= data.displayedCount)) {
        addTotal('selected-media', data.displayedCount, 'Selected readable media', 'media items',
          { ...(data.eligibleCount > 0 ? { denominator: data.eligibleCount } : {}),
            qualifiers: ['Selected readable media only; no training-performance inference'] });
      }
      break;
    case 'totalDistance': {
      const periods = data.periodLabels || [];
      const series = data.series || [];
      if (periods.length && series.length) {
        addLeader('leading-period', periods.map((label, index) => ({ label,
          value: series.every(item => Number.isFinite(item.values?.[index]))
            ? series.reduce((sum, item) => sum + item.values[index], 0) : null })), data.metricLabel || data.metric || 'Distance', data.unit || 'km');
      }
      break;
    }
    case 'equipment':
      addLeader('leading-equipment', (data.items || []).map(item => ({ label: item.name, value: item.value })),
        data.metric === 'pace' ? 'Relative pace/speed ranking' : data.metricLabel || data.metric || 'Selected measure',
        data.metric === 'pace' ? 'relative score' : data.unit || null,
        data.metric === 'pace' ? { qualifiers: [...qualifiers,
          'Normalized relative performance within each equipment type; not an absolute cross-sport comparison'] } : {});
      break;
    case 'distributions':
      addLeader('leading-bin', (data.bins || []).map(bin => ({ label: bin.label, value: bin.count })),
        `${data.metricLabel || data.metric || 'Training'} interval frequency`, 'activities');
      break;
    case 'wordcloud':
      addLeader('leading-word', (data.words || []).map(word => ({ label: word.text, value: word.count })), 'Word frequency', 'mentions');
      break;
    case 'pieCharts':
      addLeader('leading-slice', (data.slices || []).map(slice => ({ label: slice.label, value: slice.value })),
        ({ count: 'Activities', time: 'Moving time', distance: 'Distance' })[data.metric] || data.metricLabel || data.metric || 'Activities', data.unit || null,
        { qualifiers: [...qualifiers, `Grouped by ${data.groupBy || 'selected category'}`] });
      break;
    case 'personalBests': {
      if (Number.isFinite(data.best?.value)) {
        evidence.push({ factKey: 'selected-record', kind: 'record-value', value: data.best.value,
          metric: data.metricLabel || 'Selected record', unit: data.unit || null,
          labels: [data.definitionKey || data.title || 'Selected record'],
          qualifiers: [...qualifiers, ...(data.best.source?.estimated || data.best.source?.kind === 'modeled'
            ? ['Estimated from activity average'] : [])] });
      } else if (data.groups?.length) addTotal('record-groups', data.groups.length, 'Record definitions', 'record groups');
      else if (data.xAxisMode === 'duration' && data.records?.length) addTotal('duration-records', data.records.length, 'Available effort durations', 'duration records');
      break;
    }
    case 'lifetimeStatistics':
      addTotal('workout-total', data.summary?.workoutCount, 'Workouts', 'activities');
      if (Number.isFinite(data.summary?.distance?.value)) addTotal('distance-total', data.summary.distance.value, 'Recorded distance', 'km',
        { qualifiers: data.summary.distance.status === 'partial' ? ['Recorded measurements; incomplete distance coverage'] : qualifiers.slice() });
      break;
  }
  const neutralReasons = {
    heatmap: 'The selected map has no explicit activity count; route pixels do not establish another achievement.',
    paceMetrics: 'No complete set of plotted observations is available for a numerical statement.',
    equipmentTimeline: 'No explicit selected equipment set is available; first and last dates do not imply continuous usage.',
    trainingCalendar: 'No complete selected calendar activity count is available.',
    mediaGallery: 'No reliable readable-selection count is available.',
    workoutTime: 'No reliable dominant local start-time pattern is available; see start-time coverage.'
  };
  return { evidence, neutralReason: evidence.length ? null : neutralReasons[snapshot?.targetKey]
    || 'No complete comparable export values support a stronger statement.' };
}

function buildPunchlineSuggestions(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)
      || typeof snapshot.selectionId !== 'string' || !snapshot.selectionId.trim()
      || typeof snapshot.targetKey !== 'string') {
    throw new TypeError('A captured export selection is required');
  }
  if (!Object.prototype.hasOwnProperty.call(EXPORT_NEUTRAL_PUNCHLINES, snapshot.targetKey)) {
    throw new RangeError('Unknown export family');
  }
  const identity = [snapshot.selectionId, snapshot.targetKey, snapshot.variantKey || snapshot.targetKey]
    .map(value => encodeURIComponent(value)).join(':');
  const data = snapshot.familyData || {};
  const suggestions = [];
  const seen = new Set();
  const addFact = (fact, text) => {
    if (!fact || typeof fact.factKey !== 'string' || typeof fact.metric !== 'string' || !fact.metric.trim()
        || !['selected-total', 'leading-category', 'record-value', 'start-window'].includes(fact.kind)
        || (fact.selectionId && fact.selectionId !== snapshot.selectionId)
        || typeof fact.value !== 'number' || !Number.isFinite(fact.value) || fact.value < 0
        || (fact.denominator !== undefined && fact.denominator !== null && (!Number.isFinite(fact.denominator) || fact.denominator <= 0))
        || !validateCustomPunchline(text).valid) return;
    const id = `${identity}:${encodeURIComponent(fact.factKey)}`;
    if (seen.has(id)) return;
    seen.add(id);
    const basis = Object.freeze({ selectionId: snapshot.selectionId, kind: fact.kind, metric: fact.metric,
      unit: typeof fact.unit === 'string' ? fact.unit : null, value: fact.value,
      denominator: fact.denominator ?? null, period: data.period ?? snapshot.period ?? null,
      sport: data.sport ?? null, labels: Object.freeze((Array.isArray(fact.labels) ? fact.labels : []).filter(label => typeof label === 'string').slice()),
      isTie: fact.isTie === true, qualifiers: Object.freeze((Array.isArray(fact.qualifiers) ? fact.qualifiers : []).filter(value => typeof value === 'string').slice()),
      ...(Number.isInteger(fact.excludedCount) ? { excludedCount: fact.excludedCount } : {}) });
    suggestions.push(Object.freeze({ id, selectionId: snapshot.selectionId, kind: 'data', text, basis }));
  };
  if (snapshot.targetKey === 'workoutTime') {
    const analysis = data.startTimeAnalysis;
    const keys = ['morning', 'afternoon', 'evening', 'night'];
    if (analysis?.basis === 'activity-start-count' && Number.isInteger(analysis.validStartCount) && analysis.validStartCount >= 10
        && Number.isInteger(analysis.excludedStartCount) && analysis.excludedStartCount >= 0
        && analysis.selectedCount === analysis.validStartCount + analysis.excludedStartCount
        && Array.isArray(analysis.windows) && analysis.windows.length === 4
        && keys.every(key => analysis.windows.filter(window => window.key === key).length === 1)
        && analysis.windows.every(window => Number.isInteger(window.count) && window.count >= 0)
        && analysis.windows.reduce((sum, window) => sum + window.count, 0) === analysis.validStartCount) {
      const dominant = analysis.windows.find(window => window.count * 100 >= analysis.validStartCount * 60);
      if (dominant) {
        const text = { morning: 'Morning bird', afternoon: 'Afternoon athlete', evening: 'Evening energy', night: 'Night owl' }[dominant.key];
        addFact({ factKey: `start-window-${dominant.key}`, kind: 'start-window', metric: 'Activity starts', unit: 'activities',
          value: dominant.count, denominator: analysis.validStartCount, excludedCount: analysis.excludedStartCount,
          labels: [dominant.key], qualifiers: ['Based on activity starts, not duration or distance'] }, text);
      }
    }
  }
  for (const fact of Array.isArray(data.punchlineEvidence) ? data.punchlineEvidence : projectExportPunchlineEvidence(snapshot).evidence) {
    const metric = typeof fact?.metric === 'string' ? fact.metric.trim() : '';
    const value = typeof fact?.value === 'number' && Number.isFinite(fact.value)
      ? fact.value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
    const rawUnit = fact?.unit || metric.toLowerCase();
    const displayUnit = fact?.value === 1 ? ({ activities: 'activity', observations: 'observation',
      'equipment items': 'equipment item', 'media items': 'media item', 'record groups': 'record group',
      'duration records': 'duration record', mentions: 'mention' })[rawUnit] || rawUnit : rawUnit;
    const measured = [value, displayUnit].filter(Boolean).join(' ');
    const estimated = Array.isArray(fact?.qualifiers) && fact.qualifiers.some(value => /estimated/i.test(value));
    const text = fact?.kind === 'leading-category' ? `${fact.isTie ? 'A shared lead' : 'Leading the way'} in ${metric.toLowerCase()}.`
      : fact?.kind === 'record-value' ? `${estimated ? 'Estimated record' : 'A personal best'}: ${measured}.`
        : `${measured} in this selection.`;
    if (fact?.kind === 'start-window') continue;
    addFact(fact, text);
  }
  suggestions.push(Object.freeze({
    id: `${identity}:neutral`,
    selectionId: snapshot.selectionId,
    kind: 'neutral',
    text: EXPORT_NEUTRAL_PUNCHLINES[snapshot.targetKey]
  }));
  return Object.freeze(suggestions);
}

function validateCustomPunchline(input) {
  if (typeof input !== 'string') return { valid: false, text: '', length: 0, error: 'Enter a text punchline.' };
  const text = input.trim();
  const length = Array.from(text).length;
  const error = length === 0 ? 'Enter a punchline.'
    : length > 120 ? 'Keep the punchline to 120 characters or fewer.' : null;
  return { valid: error === null, text, length, error };
}

function resolvePunchline(selection = {}, suggestions = []) {
  if (selection.enabled === false) return { enabled: false, valid: true, text: null, error: null };
  if (selection.source === 'custom') {
    return { ...validateCustomPunchline(selection.confirmedText), enabled: true, source: 'custom' };
  }
  const available = Array.isArray(suggestions) ? suggestions : [];
  const suggestion = available.find(item => item.selectionId === selection.selectionId
    && (selection.suggestionId ? item.id === selection.suggestionId : selection.source === 'default'));
  if (!suggestion || !['default', 'suggestion'].includes(selection.source)) {
    return { enabled: true, valid: false, text: null, error: 'Choose a suggestion from this export.' };
  }
  return { ...validateCustomPunchline(suggestion.text), enabled: true, source: selection.source,
    suggestionId: suggestion.id, basis: suggestion.basis || null };
}

const exportPunchlineUtils = { buildPunchlineSuggestions, projectExportPunchlineEvidence, validateCustomPunchline, resolvePunchline };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportPunchlineUtils;
}

if (typeof window !== 'undefined') {
  window.exportPunchlineUtils = exportPunchlineUtils;
}