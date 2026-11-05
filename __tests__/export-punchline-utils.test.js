const fs = require('fs');
const path = require('path');
const vm = require('vm');
const punchlines = require('../src/export-punchline-utils');

const exportFamilies = [
  'totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests',
  'heatmap', 'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud',
  'pieCharts', 'lifetimeStatistics', 'mediaGallery'
];

function selection(targetKey, familyData = {}) {
  return Object.freeze({ selectionId: 'selection-1', targetKey, variantKey: targetKey,
    familyData: Object.freeze(familyData) });
}

describe('F080 T004 neutral suggestion contract', () => {
  test.each(exportFamilies)('provides a deterministic neutral fallback for %s', targetKey => {
    const snapshot = selection(targetKey);
    const first = punchlines.buildPunchlineSuggestions(snapshot);
    expect(first).toEqual(punchlines.buildPunchlineSuggestions(snapshot));
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ kind: 'neutral', selectionId: snapshot.selectionId });
    expect(first[0].id).toBeTruthy();
    expect(first[0].text.trim()).toBe(first[0].text);
    expect(Array.from(first[0].text).length).toBeGreaterThan(0);
    expect(Array.from(first[0].text).length).toBeLessThanOrEqual(120);
    expect(first[0].basis).toBeUndefined();
  });

  test('binds identities to the captured selection without mutating its data', () => {
    const snapshot = selection('equipment', { metric: 'duration', items: Object.freeze([]) });
    const before = JSON.stringify(snapshot);
    const first = punchlines.buildPunchlineSuggestions(snapshot);
    const second = punchlines.buildPunchlineSuggestions({ ...snapshot, selectionId: 'selection-2' });
    expect(first[0].id).not.toBe(second[0].id);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  test.each([null, {}, { targetKey: 'workoutTime' }, { selectionId: '', targetKey: 'heatmap' }])(
    'rejects invalid selection metadata: %j', snapshot => {
      expect(() => punchlines.buildPunchlineSuggestions(snapshot)).toThrow(TypeError);
    }
  );

  test('rejects unknown export families instead of assigning a different family', () => {
    expect(() => punchlines.buildPunchlineSuggestions(selection('unknown'))).toThrow(RangeError);
  });

  test('loads without DOM or network globals and exposes the same browser and CommonJS API', () => {
    const context = { module: { exports: {} }, window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/export-punchline-utils.js'), 'utf8'), context);
    expect(context.window.exportPunchlineUtils).toBe(context.module.exports);
    expect(typeof context.module.exports.buildPunchlineSuggestions).toBe('function');
  });
});

describe('F080 T018 custom text and confirmed selection', () => {
  test.each(['', '   ', null, undefined, 12, {}])('rejects empty or non-string text: %j', input => {
    expect(punchlines.validateCustomPunchline(input).valid).toBe(false);
  });

  test.each(['a', 'x'.repeat(120), '\u{1f3c3}'.repeat(120)])('accepts 1 through 120 codepoints', text => {
    expect(punchlines.validateCustomPunchline(` ${text} `)).toMatchObject({ valid: true, text, length: Array.from(text).length });
  });

  test('rejects 121 codepoints without silently shortening them', () => {
    const text = '\u{1f3c3}'.repeat(121);
    expect(punchlines.validateCustomPunchline(text)).toMatchObject({ valid: false, text, length: 121 });
  });

  test('retains internal whitespace, HTML-looking text and captions longer than ten words', () => {
    const text = 'One  two <b>three</b> four five six seven eight nine ten eleven twelve';
    expect(punchlines.validateCustomPunchline(` ${text} `)).toMatchObject({ valid: true, text });
    expect(punchlines.resolvePunchline({ enabled: true, source: 'custom', confirmedText: text }, [])).toMatchObject({ valid: true, text });
  });

  test('resolves exactly one selection-bound default or chosen suggestion', () => {
    const suggestions = punchlines.buildPunchlineSuggestions(selection('equipment'));
    expect(punchlines.resolvePunchline({ enabled: true, source: 'default', selectionId: 'selection-1' }, suggestions))
      .toMatchObject({ valid: true, text: suggestions[0].text });
    expect(punchlines.resolvePunchline({ enabled: true, source: 'suggestion', selectionId: 'selection-1',
      suggestionId: suggestions[0].id }, suggestions)).toMatchObject({ valid: true, text: suggestions[0].text });
  });

  test('does not silently replace a stale or foreign suggestion', () => {
    const suggestions = punchlines.buildPunchlineSuggestions(selection('equipment'));
    for (const [selectionId, suggestionId] of [['other-selection', suggestions[0].id], ['selection-1', 'missing']]) {
      expect(punchlines.resolvePunchline({ enabled: true, source: 'suggestion', selectionId, suggestionId }, suggestions).valid).toBe(false);
    }
  });

  test('allows a disabled caption while retaining an invalid draft independently', () => {
    expect(punchlines.resolvePunchline({ enabled: false, source: 'custom', confirmedText: '' }, []))
      .toMatchObject({ enabled: false, valid: true, text: null });
  });
});

describe('F080 T041 evidence-bound suggestion contract', () => {
  it('uses singular selection wording without changing the original numerical basis', () => {
    const result = punchlines.buildPunchlineSuggestions(selection('mediaGallery', { displayedCount: 1, eligibleCount: 1 }));
    expect(result[0].text).toBe('1 media item in this selection.');
    expect(result[0].basis).toMatchObject({ value: 1, unit: 'media items', denominator: 1 });
  });

  it('keeps independently reusable family projections in the DOM-free dual-target utility', () => {
    expect(typeof punchlines.projectExportPunchlineEvidence).toBe('function');
    expect(punchlines.projectExportPunchlineEvidence(selection('equipment', {
      metricLabel: 'Distance', unit: 'km', items: [{ name: 'Shoes', value: 12 }]
    })).evidence[0]).toMatchObject({ kind: 'leading-category', value: 12, unit: 'km' });
  });

  test.each(exportFamilies)('offers a supported fact or a neutral alternative for %s', targetKey => {
    const snapshot = selection(targetKey, { period: '2025', metricLabel: 'Activities', unit: 'activities',
      punchlineEvidence: [{ factKey: 'count', kind: 'selected-total', metric: 'Activities', unit: 'activities', value: 12, qualifiers: [] }] });
    const result = punchlines.buildPunchlineSuggestions(snapshot);
    const supported = result.find(item => item.kind === 'data');
    expect(supported).toBeDefined();
    expect(supported.basis).toMatchObject({ selectionId: 'selection-1', metric: 'Activities', value: 12, unit: 'activities' });
    expect(result.some(item => item.kind === 'neutral')).toBe(true);
    expect(result).toEqual(punchlines.buildPunchlineSuggestions(snapshot));
  });

  test.each([['morning', 'Morning bird'], ['afternoon', 'Afternoon athlete'],
    ['evening', 'Evening energy'], ['night', 'Night owl']])('supports %s only from a valid dominant start window', (key, text) => {
    const windows = ['morning', 'afternoon', 'evening', 'night'].map(window => ({ key: window,
      count: window === key ? 6 : window === (key === 'morning' ? 'night' : 'morning') ? 4 : 0 }));
    const snapshot = selection('workoutTime', { metric: 'distance', period: '2025 YTD', startTimeAnalysis: {
      basis: 'activity-start-count', selectedCount: 12, validStartCount: 10, excludedStartCount: 2,
      windows, dominantWindow: key, status: 'supported' } });
    const supported = punchlines.buildPunchlineSuggestions(snapshot).find(item => item.text === text);
    expect(supported?.basis).toMatchObject({ selectionId: 'selection-1', metric: 'Activity starts', value: 6,
      denominator: 10, excludedCount: 2, period: '2025 YTD' });
  });

  it('does not trust an unsupported supplied dominance label or incomplete evidence', () => {
    for (const validStartCount of [9, 100]) {
      const count = validStartCount === 9 ? 9 : 59;
      const result = punchlines.buildPunchlineSuggestions(selection('workoutTime', { startTimeAnalysis: {
        basis: 'activity-start-count', validStartCount, excludedStartCount: 0, selectedCount: validStartCount,
        dominantWindow: 'morning', windows: [{ key: 'morning', count }, { key: 'afternoon', count: 0 },
          { key: 'evening', count: validStartCount - count }, { key: 'night', count: 0 }] } }));
      expect(result.some(item => item.text === 'Morning bird')).toBe(false);
    }
    const result = punchlines.buildPunchlineSuggestions(selection('equipment', { punchlineEvidence: [
      { factKey: 'missing', kind: 'selected-total', metric: 'Activities', value: null },
      { factKey: 'bad', kind: 'selected-total', metric: 'Activities', value: NaN },
      { factKey: 'foreign', kind: 'selected-total', metric: 'Activities', value: 42, selectionId: 'other' }
    ] }));
    expect(result.every(item => item.kind === 'neutral')).toBe(true);
  });

  it('describes a tied lead as shared and never substitutes another metric or fabricates a sole winner', () => {
    const result = punchlines.buildPunchlineSuggestions(selection('equipment', { metricLabel: 'Duration', unit: 'h',
      punchlineEvidence: [{ factKey: 'lead', kind: 'leading-category', metric: 'Duration', unit: 'h', value: 12,
        labels: ['Shoes A', 'Shoes B'], isTie: true, qualifiers: ['Selected partial period'] }] }));
    const supported = result.find(item => item.kind === 'data');
    expect(supported.text).toMatch(/shared|joint/i);
    expect(supported.basis).toMatchObject({ metric: 'Duration', unit: 'h', value: 12,
      isTie: true, qualifiers: ['Selected partial period'] });
    expect(supported.text).not.toMatch(/km|fastest|health|personality/i);
  });
});