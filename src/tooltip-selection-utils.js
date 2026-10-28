(function (root) {
  const TAB_IDS = ['totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests', 'heatmap', 'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics', 'mediaGallery'];
  const ANCHOR_KINDS = ['chart-item', 'svg-item', 'calendar-day', 'word', 'map-location', 'statistic', 'media-item'];

  function copyPlain(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return value.map(copyPlain);
    if (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
      const result = {};
      for (const key of Object.keys(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError('Invalid content key');
        result[key] = copyPlain(value[key]);
      }
      return result;
    }
    throw new TypeError('Tooltip content must contain only finite plain data');
  }

  function freezePlain(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freezePlain);
      Object.freeze(value);
    }
    return value;
  }

  function validContext(context) {
    return !!context && TAB_IDS.includes(context.tabId) &&
      ['datasetRevision', 'viewRevision', 'renderGeneration'].every(key => Number.isSafeInteger(context[key]) && context[key] >= 0);
  }

  function sameContext(first, second) {
    return validContext(first) && validContext(second) && first.tabId === second.tabId &&
      first.datasetRevision === second.datasetRevision && first.viewRevision === second.viewRevision &&
      JSON.stringify(first.settings || {}) === JSON.stringify(second.settings || {});
  }

  function validSelection(selection, context) {
    if (!selection || typeof selection.selectionKey !== 'string' || !selection.selectionKey || !sameContext(selection.context, context)) return false;
    const anchor = selection.anchor;
    if (!anchor || !ANCHOR_KINDS.includes(anchor.kind) || typeof anchor.itemId !== 'string' || !anchor.itemId) return false;
    if (!['visible', 'outside-view', 'not-in-export'].includes(anchor.visibility)) return false;
    if (anchor.normalizedPoint && !['x', 'y'].every(key => Number.isFinite(anchor.normalizedPoint[key]))) return false;
    if (anchor.geoPoint && !['lat', 'lng'].every(key => Number.isFinite(anchor.geoPoint[key]))) return false;
    return !!selection.content && typeof selection.content === 'object';
  }

  function transitionSelection(state, event) {
    if (!event) return state;
    if (['reset', 'dismiss', 'escape'].includes(event.type)) return null;
    if (['leave', 'blur'].includes(event.type)) return state?.mode === 'pinned' ? state : null;
    if (event.type === 'anchor' && state) {
      try {
        const next = { ...state, anchor: event.anchor };
        return validSelection(next, event.context || state.context) ? freezePlain(copyPlain(next)) : state;
      } catch (_) { return state; }
    }
    if (!['hover', 'focus', 'select'].includes(event.type)) return state;
    if (event.type !== 'select' && state?.mode === 'pinned') return state;
    if (!validSelection(event.selection, event.context)) return state;
    try {
      const next = copyPlain(event.selection);
      if (event.type === 'select' && state?.mode === 'pinned' && state.selectionKey === next.selectionKey && sameContext(state.context, next.context)) return null;
      next.mode = event.type === 'select' ? 'pinned' : 'transient';
      return freezePlain(next);
    } catch (_) { return state; }
  }

  function copyPinnedSelection(state, context) {
    return state?.mode === 'pinned' && sameContext(state.context, context) ? freezePlain(copyPlain(state)) : null;
  }

  function resolveTooltipPlacement(contentSize, bounds, anchor = {}) {
    const margin = 8;
    const width = Math.max(0, Math.min(Number(contentSize.width) || 0, Math.max(0, bounds.width - margin * 2)));
    const height = Math.max(0, Math.min(Number(contentSize.height) || 0, Math.max(0, bounds.height - margin * 2)));
    const point = anchor.normalizedPoint || { x: 0.5, y: 0.25 };
    const left = Math.max(margin, Math.min(bounds.width - width - margin, point.x * bounds.width + 12));
    const top = Math.max(margin, Math.min(bounds.height - height - margin, point.y * bounds.height + 12));
    return { left, top, width, height, visibility: anchor.visibility || 'visible' };
  }

  function contentLines(content, compact = false) {
    const title = String(content.title || content.itemLabel || 'Selected item');
    if (compact) return [title];
    return [title, ...(content.sections || []).flatMap(section => [section.heading || '', ...(section.rows || []).map(row => [row.label, row.value, row.unit].filter(Boolean).join(': '))]), ...(content.footerLines || []), ...(content.notes || [])].filter(Boolean).map(String);
  }

  const api = { TAB_IDS, copyPlain, freezePlain, validContext, sameContext, transitionSelection, copyPinnedSelection, resolveTooltipPlacement, contentLines };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.tooltipSelectionUtils = api;
})(typeof window !== 'undefined' ? window : null);