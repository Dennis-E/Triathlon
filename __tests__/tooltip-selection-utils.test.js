const utils = require('../src/tooltip-selection-utils');

const context = { tabId: 'totalDistance', datasetRevision: 1, viewRevision: 2, renderGeneration: 3, settings: { sport: 'All' } };
function selection(overrides = {}) {
  return {
    selectionKey: 'totalDistance:month:2026-10', context,
    content: { title: '<October>', itemLabel: 'October', sections: [{ heading: 'Sports', rows: [{ label: 'Run', value: '12 km' }, { label: 'Swim', value: 'n/a' }] }], footerLines: ['Total 12 km'], notes: ['Sampled activities'] },
    anchor: { kind: 'chart-item', itemId: '2026-10', normalizedPoint: { x: 0.5, y: 0.5 }, visibility: 'visible', associationLabel: 'October' }, ...overrides
  };
}
function select(state, item = selection()) { return utils.transitionSelection(state, { type: 'select', selection: item, context }); }

test('pin copies complete plain content and freezes nested data without changing caller data', () => {
  const source = selection();
  const pinned = select(null, source);
  expect(pinned.mode).toBe('pinned');
  source.content.sections[0].rows[0].value = 'changed';
  expect(pinned.content.sections[0].rows[0].value).toBe('12 km');
  expect(pinned.content.notes).toEqual(['Sampled activities']);
  expect(Object.isFrozen(pinned.content.sections[0].rows)).toBe(true);
  expect(Object.isFrozen(source.content)).toBe(false);
});

test('hover/leave never replace pins; select replaces and same item toggles off', () => {
  const pinned = select(null);
  for (const type of ['hover', 'leave', 'blur']) expect(utils.transitionSelection(pinned, { type, selection: selection({ selectionKey: 'other' }), context })).toBe(pinned);
  const replaced = select(pinned, selection({ selectionKey: 'other' }));
  expect(replaced.selectionKey).toBe('other');
  expect(select(replaced, selection({ selectionKey: 'other' }))).toBeNull();
  expect(utils.transitionSelection(pinned, { type: 'dismiss' })).toBeNull();
});

test('transient detail leaves normally and context reset clears pins', () => {
  const transient = utils.transitionSelection(null, { type: 'hover', selection: selection(), context });
  expect(transient.mode).toBe('transient');
  expect(utils.transitionSelection(transient, { type: 'leave' })).toBeNull();
  expect(utils.transitionSelection(select(null), { type: 'reset' })).toBeNull();
});

test('reject stale-context events, invalid item identities and non-finite geometry', () => {
  const pinned = select(null);
  const invalid = [selection({ selectionKey: '' }), selection({ context: { ...context, datasetRevision: 0 } }), selection({ context: { ...context, tabId: 'unknown' } }), selection({ anchor: { kind: 'chart-item', itemId: 'id', normalizedPoint: { x: NaN, y: 0 } } }), selection({ content: { title: () => 'unsafe' } })];
  invalid.forEach(item => expect(select(pinned, item)).toBe(pinned));
  expect(utils.copyPinnedSelection(pinned, { ...context, viewRevision: 100 })).toBeNull();
});

test('export copies only matching pinned state and remains independent', () => {
  const pinned = select(null);
  const copy = utils.copyPinnedSelection(pinned, context);
  expect(copy).toEqual(pinned);
  expect(copy).not.toBe(pinned);
  expect(utils.copyPinnedSelection({ ...pinned, mode: 'transient' }, context)).toBeNull();
});

test('placement stays in bounds and retains explicit outside-view association', () => {
  const result = utils.resolveTooltipPlacement({ width: 200, height: 100 }, { width: 360, height: 240 }, { normalizedPoint: { x: 1, y: 1 }, visibility: 'visible' });
  expect(result.left).toBeGreaterThanOrEqual(8);
  expect(result.left + result.width).toBeLessThanOrEqual(352);
  expect(result.top + result.height).toBeLessThanOrEqual(232);
  expect(utils.resolveTooltipPlacement({ width: 600, height: 800 }, { width: 360, height: 240 }, { visibility: 'outside-view' })).toMatchObject({ visibility: 'outside-view', width: 344, height: 224 });
});