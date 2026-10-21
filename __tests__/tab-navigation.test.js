const {
  getAvailableVisualizationTabs,
  getAvailableVisualizationTab,
  getNextVisualizationTab,
  getNextFilterChoiceIndex,
  getNextClippedTabScrollOffset,
  createFilterDomain,
  getFilterSelectionKey,
  resolveDashboardArrowAction,
  getAdjacentFilterCombination,
  createDashboardFilterAdapter,
  setAvailableVisualizationTabs,
  setVisualizationTab,
  handleVisualizationTabKeydown
} = require('../src/tab-navigation');

function createMockElement() {
  const attributes = {};
  const classes = new Set();

  return {
    get className() {
      return Array.from(classes).join(' ');
    },
    set className(value) {
      classes.clear();
      String(value || '').split(/\s+/).filter(Boolean).forEach(className => classes.add(className));
    },
    focused: false,
    setAttribute(name, value) {
      attributes[name] = value;
    },
    getAttribute(name) {
      return attributes[name];
    },
    classList: {
      toggle(className, force) {
        if (force) {
          classes.add(className);
        } else {
          classes.delete(className);
        }
      },
      contains(className) {
        return classes.has(className);
      }
    },
    focus() {
      this.focused = true;
    }
  };
}

function createMockDocument() {
  const elements = {
    vizTabTotalDistance: createMockElement(),
    vizTabPaceMetrics: createMockElement(),
    vizTabEquipment: createMockElement(),
    vizTabEquipmentTimeline: createMockElement(),
    vizTabPersonalBests: createMockElement(),
    vizTabHeatmap: createMockElement(),
    vizTabDistributions: createMockElement(),
    vizTabWorkoutTime: createMockElement(),
    vizTabTrainingCalendar: createMockElement(),
    vizTabWordcloud: createMockElement(),
    vizTabPieCharts: createMockElement(),
    vizTabLifetimeStatistics: createMockElement(),
    vizPanelTotalDistance: createMockElement(),
    vizPanelPaceMetrics: createMockElement(),
    vizPanelEquipment: createMockElement(),
    vizPanelEquipmentTimeline: createMockElement(),
    vizPanelPersonalBests: createMockElement(),
    vizPanelHeatmap: createMockElement(),
    vizPanelDistributions: createMockElement(),
    vizPanelWorkoutTime: createMockElement(),
    vizPanelTrainingCalendar: createMockElement(),
    vizPanelWordcloud: createMockElement(),
    vizPanelPieCharts: createMockElement(),
    vizPanelLifetimeStatistics: createMockElement(),
    noVisualizationsAvailable: createMockElement()
  };

  return {
    elements,
    getElementById(id) {
      return elements[id] || null;
    }
  };
}

describe('tab navigation helpers', () => {
  describe('complete filter combination traversal', () => {
    const dimensions = [{ id: 'sport', values: ['All', 'Run'] }, { id: 'period', values: ['Year', 'Month', 'Week'] }];
    const provider = prefix => dimensions[prefix.length] || null;
    const selection = (sport, period) => [{ id: 'sport', value: sport }, { id: 'period', value: period }];
    const cycle = [selection('All', 'Year'), selection('All', 'Month'), selection('All', 'Week'), selection('Run', 'Year'), selection('Run', 'Month'), selection('Run', 'Week')];

    it.each([0, 1, 2, 3, 4, 5])('visits all six views exactly once in both directions from %i', start => {
      [1, -1].forEach(direction => {
        let current = cycle[start];
        for (let offset = 1; offset <= cycle.length; offset += 1) {
          const next = getAdjacentFilterCombination({ selection: current }, direction, provider);
          expect(next).toEqual(cycle[(start + offset * direction + 12) % cycle.length]);
          expect(getAdjacentFilterCombination({ selection: next }, -direction, provider)).toEqual(current);
          current = next;
        }
      });
    });

    it('completes dependent suffixes canonically rather than retaining old values', () => {
      const dependent = prefix => prefix.length === 0 ? { id: 'mode', values: ['daily', 'yearly'] }
        : prefix.length === 1 ? { id: 'period', values: prefix[0].value === 'daily' ? ['7d', '1m', 'all'] : ['3y', 'all'] } : null;
      const current = [{ id: 'mode', value: 'daily' }, { id: 'period', value: 'all' }];
      const next = getAdjacentFilterCombination({ selection: current }, 1, dependent);
      expect(next).toEqual([{ id: 'mode', value: 'yearly' }, { id: 'period', value: '3y' }]);
      expect(getAdjacentFilterCombination({ selection: next }, -1, dependent)).toEqual(current);
    });

    it('supports changing dimension counts and valid empty-result selections', () => {
      const dependent = prefix => prefix.length === 0 ? { id: 'count', values: [1, 2] }
        : prefix.length <= prefix[0].value ? { id: `word:${prefix.length}`, kind: 'boolean' } : null;
      const current = [{ id: 'count', value: 1 }, { id: 'word:1', value: true }];
      const next = getAdjacentFilterCombination({ selection: current }, 1, dependent);
      expect(next).toEqual([{ id: 'count', value: 2 }, { id: 'word:1', value: false }, { id: 'word:2', value: false }]);
      expect(getAdjacentFilterCombination({ selection: next }, -1, dependent)).toEqual(current);
    });

    it('uses constrained stepped domains to keep date start no later than end', () => {
      const dates = prefix => prefix.length === 0 ? { id: 'start', kind: 'stepped', min: 0, max: 2, step: 1 }
        : prefix.length === 1 ? { id: 'end', kind: 'stepped', min: prefix[0].value, max: 2, step: 1 } : null;
      const current = [{ id: 'start', value: 1 }, { id: 'end', value: 2 }];
      expect(getAdjacentFilterCombination({ selection: current }, 1, dates)).toEqual([{ id: 'start', value: 2 }, { id: 'end', value: 2 }]);
    });

    it('carries over 100 Boolean choices without bit masks or product allocation', () => {
      const large = jest.fn(prefix => prefix.length < 100 ? { id: `word:${prefix.length}`, kind: 'boolean' } : null);
      const current = Array.from({ length: 100 }, (_, index) => ({ id: `word:${index}`, value: true }));
      const next = getAdjacentFilterCombination({ selection: current }, 1, large);
      expect(next).toHaveLength(100);
      expect(next.every(choice => choice.value === false)).toBe(true);
      expect(large.mock.calls.length).toBeLessThan(1000);
      expect(getAdjacentFilterCombination({ selection: next }, -1, large)).toEqual(current);
    });

    it('returns no alternative for fixed/no dimensions and invalid inputs', () => {
      expect(getAdjacentFilterCombination({ selection: [] }, 1, () => null)).toBeNull();
      expect(getAdjacentFilterCombination({ selection: [{ id: 'fixed', value: 'only' }] }, 1, prefix => prefix.length ? null : { id: 'fixed', values: ['only'] })).toBeNull();
      expect(getAdjacentFilterCombination({ selection: cycle[0] }, 0, provider)).toBeNull();
      expect(getAdjacentFilterCombination({ selection: selection('missing', 'Year') }, 1, provider)).toBeNull();
    });

    it('resolves a complete vertical action without changing the active dashboard', () => {
      const action = resolveDashboardArrowAction('ArrowDown', { workspaceOwnsInput: true, inputOwner: 'workspace', activeTabId: 'totalDistance', snapshot: { selection: cycle[0] }, domainProvider: provider });
      expect(action).toMatchObject({ axis: 'view', outcome: 'changed', cue: 'down', target: cycle[1] });
    });
  });

  describe('workspace arrow actions', () => {
    const context = { workspaceOwnsInput: true, inputOwner: 'workspace', activeTabId: 'totalDistance', availableTabs: ['totalDistance', 'equipment'] };

    it('switches horizontally without any tab-focus condition', () => {
      expect(resolveDashboardArrowAction('ArrowRight', context)).toMatchObject({ axis: 'dashboard', direction: 1, outcome: 'changed', target: 'equipment', preventDefault: true, cue: 'right' });
      expect(resolveDashboardArrowAction('ArrowLeft', context).target).toBe('equipment');
    });

    it.each(['text', 'dialog', 'nativePopup', 'continuousNumeric', 'outside'])('preserves %s input ownership', inputOwner => {
      expect(resolveDashboardArrowAction('ArrowRight', { ...context, inputOwner })).toMatchObject({ outcome: 'ignored', preventDefault: false });
    });

    it('does not report success for one or zero dashboards', () => {
      expect(resolveDashboardArrowAction('ArrowRight', { ...context, availableTabs: ['totalDistance'] })).toMatchObject({ outcome: 'noop', cue: null });
      expect(resolveDashboardArrowAction('ArrowLeft', { ...context, availableTabs: [] }).outcome).toBe('noop');
    });

    it('ignores shortcuts outside the workspace and leaves Tab alone', () => {
      expect(resolveDashboardArrowAction('ArrowRight', { ...context, workspaceOwnsInput: false }).preventDefault).toBe(false);
      expect(resolveDashboardArrowAction('Tab', context).outcome).toBe('ignored');
    });
  });

  describe('finite filter contracts', () => {
    it('reads live owner selections and commits one complete candidate', () => {
      let values = { sport: 'Run' };
      const commit = jest.fn(next => { values = next; });
      const adapter = createDashboardFilterAdapter(() => ({ values }), prefix => prefix.length ? null : { id: 'sport', values: ['All', 'Run'] }, commit);
      expect(adapter.readSnapshot().selection).toEqual([{ id: 'sport', value: 'Run' }]);
      expect(adapter.applySelection([{ id: 'sport', value: 'All' }])).toBe(true);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(adapter.readSnapshot().selection).toEqual([{ id: 'sport', value: 'All' }]);
    });

    it('keeps displayed single-choice order and Boolean order', () => {
      const choices = createFilterDomain({ id: 'sport', kind: 'single', values: ['Run', 'All'] });
      expect(choices.count).toBe(2);
      expect(choices.at(0)).toBe('Run');
      expect(choices.indexOf('All')).toBe(1);
      const binary = createFilterDomain({ id: 'year:2026', kind: 'boolean' });
      expect([binary.at(0), binary.at(1)]).toEqual([false, true]);
    });

    it('represents finite stepped domains without materializing their values', () => {
      const domain = createFilterDomain({ id: 'date', kind: 'stepped', min: 2, max: 1000002, step: 2 });
      expect(domain.count).toBe(500001);
      expect(domain.at(2)).toBe(6);
      expect(domain.indexOf(8)).toBe(3);
      expect(domain.indexOf(7)).toBe(-1);
      expect(domain.at(-1)).toBeUndefined();
    });

    it.each([
      { id: 'date', kind: 'stepped', min: 0, max: Infinity, step: 1 },
      { id: 'date', kind: 'stepped', min: 0, max: 2, step: 0 },
      { id: 'date', kind: 'stepped', min: 0, max: 2.5, step: 1 },
      { id: '', kind: 'boolean' },
      { id: 'date', kind: 'continuous' }
    ])('rejects invalid finite dimensions: %j', descriptor => {
      expect(createFilterDomain(descriptor)).toBeNull();
    });

    it('uses typed ordered dimension identities rather than a numeric mask', () => {
      const selection = [{ id: 'sport', value: 'All' }, { id: 'year:2026', value: false }];
      expect(getFilterSelectionKey(selection)).toBe(JSON.stringify(selection.map(choice => [choice.id, choice.value])));
      expect(getFilterSelectionKey(selection)).not.toBe(getFilterSelectionKey([{ id: 'sport', value: 'All' }, { id: 'year:2026', value: 'false' }]));
    });
  });

  describe('getNextClippedTabScrollOffset', () => {
    it('reveals the nearest partially clipped tab on the right without skipping', () => {
      const nextOffset = getNextClippedTabScrollOffset(
        [{ left: 0, right: 60 }, { left: 64, right: 160 }, { left: 164, right: 240 }],
        { left: 0, right: 150 },
        0,
        90,
        1
      );

      expect(nextOffset).toBe(10);
    });

    it('reveals the nearest clipped tab on the left using the minimum movement', () => {
      const nextOffset = getNextClippedTabScrollOffset(
        [{ left: -12, right: 48 }, { left: 52, right: 112 }, { left: 116, right: 176 }],
        { left: 0, right: 150 },
        52,
        100,
        -1
      );

      expect(nextOffset).toBe(40);
    });

    it('clamps movement to the available scroll boundaries', () => {
      expect(getNextClippedTabScrollOffset(
        [{ left: 130, right: 180 }], { left: 0, right: 150 }, 45, 50, 1
      )).toBe(50);
      expect(getNextClippedTabScrollOffset(
        [{ left: -20, right: 30 }], { left: 0, right: 150 }, 10, 50, -1
      )).toBe(0);
    });

    it('returns null when no tab is clipped in the requested direction', () => {
      const tabs = [{ left: 0, right: 60 }, { left: 64, right: 140 }];
      const viewport = { left: 0, right: 150 };

      expect(getNextClippedTabScrollOffset(tabs, viewport, 0, 0, 1)).toBeNull();
      expect(getNextClippedTabScrollOffset(tabs, viewport, 0, 0, -1)).toBeNull();
    });
  });

  it('cycles to next and previous tabs', () => {
    expect(getNextVisualizationTab('totalDistance', 1)).toBe('paceMetrics');
    expect(getNextVisualizationTab('paceMetrics', 1)).toBe('equipment');
    expect(getNextVisualizationTab('equipment', 1)).toBe('equipmentTimeline');
    expect(getNextVisualizationTab('equipmentTimeline', 1)).toBe('personalBests');
    expect(getNextVisualizationTab('personalBests', 1)).toBe('heatmap');
    expect(getNextVisualizationTab('heatmap', 1)).toBe('distributions');
    expect(getNextVisualizationTab('distributions', 1)).toBe('workoutTime');
    expect(getNextVisualizationTab('workoutTime', 1)).toBe('trainingCalendar');
    expect(getNextVisualizationTab('trainingCalendar', 1)).toBe('wordcloud');
    expect(getNextVisualizationTab('wordcloud', 1)).toBe('pieCharts');
    expect(getNextVisualizationTab('pieCharts', 1)).toBe('lifetimeStatistics');
    expect(getNextVisualizationTab('lifetimeStatistics', 1)).toBe('totalDistance');
    expect(getNextVisualizationTab('totalDistance', -1)).toBe('lifetimeStatistics');
    expect(getNextVisualizationTab('workoutTime', -1)).toBe('distributions');
    expect(getNextVisualizationTab('unknown', 1)).toBe('totalDistance');
  });

  it('filters available tabs in the canonical order', () => {
    expect(getAvailableVisualizationTabs({
      equipment: true,
      pieCharts: true,
      totalDistance: false
    })).toEqual(['equipment', 'pieCharts']);
    expect(getAvailableVisualizationTabs({})).toEqual([]);
  });

  it('preserves an available selection or falls back to the first available tab', () => {
    expect(getAvailableVisualizationTab('equipment', ['totalDistance', 'equipment'])).toBe('equipment');
    expect(getAvailableVisualizationTab('equipment', ['totalDistance', 'paceMetrics'])).toBe('totalDistance');
    expect(getAvailableVisualizationTab('equipment', [])).toBeNull();
  });

  it('cycles only through available tabs and wraps in that subset', () => {
    const availableTabs = ['totalDistance', 'equipment', 'lifetimeStatistics'];

    expect(getNextVisualizationTab('totalDistance', 1, availableTabs)).toBe('equipment');
    expect(getNextVisualizationTab('equipment', -1, availableTabs)).toBe('totalDistance');
    expect(getNextVisualizationTab('lifetimeStatistics', 1, availableTabs)).toBe('totalDistance');
    expect(getNextVisualizationTab('unavailable', 1, availableTabs)).toBe('totalDistance');
    expect(getNextVisualizationTab('totalDistance', 1, [])).toBeNull();
  });

  it('does not activate a tab outside the available set', () => {
    const mockDocument = createMockDocument();

    expect(setVisualizationTab('equipment', {
      availableTabs: ['totalDistance'],
      document: mockDocument
    })).toBeNull();
    expect(setVisualizationTab('totalDistance', {
      availableTabs: [],
      document: mockDocument
    })).toBeNull();
    expect(mockDocument.elements.vizTabEquipment.getAttribute('aria-selected')).toBeUndefined();
  });

  it('hides unavailable tabs and shows a stable message when no views are available', () => {
    const mockDocument = createMockDocument();

    setAvailableVisualizationTabs(['equipment'], { document: mockDocument });
    expect(mockDocument.elements.vizTabEquipment.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabTotalDistance.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.noVisualizationsAvailable.classList.contains('hidden')).toBe(true);

    setAvailableVisualizationTabs([], { document: mockDocument });
    expect(mockDocument.elements.vizTabEquipment.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizPanelEquipment.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.noVisualizationsAvailable.classList.contains('hidden')).toBe(false);
  });

  it('preserves hidden tabs when active-tab classes are updated', () => {
    const mockDocument = createMockDocument();
    const availableTabs = ['totalDistance'];

    setAvailableVisualizationTabs(availableTabs, { document: mockDocument });
    setVisualizationTab('totalDistance', { availableTabs, document: mockDocument });

    expect(mockDocument.elements.vizTabTotalDistance.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabEquipment.classList.contains('hidden')).toBe(true);
  });

  describe('getNextFilterChoiceIndex', () => {
    it('moves through choices and wraps in either direction', () => {
      expect(getNextFilterChoiceIndex(4, 0, 1)).toBe(1);
      expect(getNextFilterChoiceIndex(4, 3, 1)).toBe(0);
      expect(getNextFilterChoiceIndex(4, 0, -1)).toBe(3);
      expect(getNextFilterChoiceIndex(4, 2, -1)).toBe(1);
    });

    it('does not move when fewer than two choices or an invalid index is supplied', () => {
      expect(getNextFilterChoiceIndex(1, 0, 1)).toBeNull();
      expect(getNextFilterChoiceIndex(0, 0, 1)).toBeNull();
      expect(getNextFilterChoiceIndex(3, -1, 1)).toBeNull();
      expect(getNextFilterChoiceIndex(3, 3, 1)).toBeNull();
      expect(getNextFilterChoiceIndex(3, 1, 0)).toBeNull();
    });

    it('leaves native and multi-select controls to their established keyboard behavior', () => {
      expect(getNextFilterChoiceIndex(4, 1, 1, 'checkbox')).toBeNull();
      expect(getNextFilterChoiceIndex(4, 1, 1, 'select')).toBeNull();
      expect(getNextFilterChoiceIndex(4, 1, 1, 'range')).toBeNull();
    });
  });

  it('sets active tab classes, aria state, and panel visibility', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('paceMetrics', { document: mockDocument, focusTab: true });

    expect(selected).toBe('paceMetrics');
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizTabPaceMetrics.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('tabindex')).toBe('-1');
    expect(mockDocument.elements.vizTabPaceMetrics.getAttribute('tabindex')).toBe('0');
    expect(mockDocument.elements.vizPanelTotalDistance.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizPanelPaceMetrics.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabPaceMetrics.focused).toBe(true);
  });

  it('handles ArrowRight and requests next tab', () => {
    const event = {
      key: 'ArrowRight',
      shiftKey: false,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBe('paceMetrics');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('paceMetrics', { focusTab: true });
  });

  it('reaches Wordcloud from Training Calendar with ArrowRight', () => {
    const event = { key: 'ArrowRight', preventDefault: jest.fn() };
    const onTabChange = jest.fn();

    expect(handleVisualizationTabKeydown(event, 'trainingCalendar', { onTabChange })).toBe('wordcloud');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('wordcloud', { focusTab: true });
  });

  it('handles Tab by activating and focusing the next visualization', () => {
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBe('paceMetrics');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('paceMetrics', { focusTab: true });
  });

  it('handles Shift+Tab by activating and focusing the previous visualization with wraparound', () => {
    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const previousTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(previousTab).toBe('lifetimeStatistics');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('lifetimeStatistics', { focusTab: true });
  });

  it('leaves unrelated keys unhandled', () => {
    const event = { key: 'Escape', preventDefault: jest.fn() };
    const onTabChange = jest.fn();

    expect(handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange })).toBeNull();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('cycles from distributions to Workout Time', () => {
    expect(getNextVisualizationTab('distributions', 1)).toBe('workoutTime');
  });

  it('activates equipmentTimeline tab correctly', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('equipmentTimeline', { document: mockDocument });

    expect(selected).toBe('equipmentTimeline');
    expect(mockDocument.elements.vizTabEquipmentTimeline.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizTabEquipment.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelEquipmentTimeline.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizPanelEquipment.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizPanelTotalDistance.classList.contains('hidden')).toBe(true);
  });

  it('activates heatmap tab correctly', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('heatmap', { document: mockDocument, focusTab: true });

    expect(selected).toBe('heatmap');
    expect(mockDocument.elements.vizTabHeatmap.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabPersonalBests.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelHeatmap.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizPanelPersonalBests.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabHeatmap.focused).toBe(true);
  });

  it('activates distributions tab correctly and deactivates the previous tab', () => {
    const mockDocument = createMockDocument();
    setVisualizationTab('heatmap', { document: mockDocument });
    const selected = setVisualizationTab('distributions', { document: mockDocument, focusTab: true });

    expect(selected).toBe('distributions');
    expect(mockDocument.elements.vizTabDistributions.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabHeatmap.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelDistributions.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizPanelHeatmap.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabDistributions.focused).toBe(true);
  });

  it('activates Workout Time tab correctly', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('workoutTime', { document: mockDocument, focusTab: true });

    expect(selected).toBe('workoutTime');
    expect(mockDocument.elements.vizTabWorkoutTime.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabDistributions.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelWorkoutTime.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizPanelDistributions.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabWorkoutTime.focused).toBe(true);
  });

  it('activates Training Calendar tab correctly', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('trainingCalendar', { document: mockDocument, focusTab: true });

    expect(selected).toBe('trainingCalendar');
    expect(mockDocument.elements.vizTabTrainingCalendar.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabWorkoutTime.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelTrainingCalendar.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizPanelWorkoutTime.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabTrainingCalendar.focused).toBe(true);
  });

  it('activates the Wordcloud tab, hides other panels, and focuses its button', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('wordcloud', { document: mockDocument, focusTab: true });

    expect(selected).toBe('wordcloud');
    expect(mockDocument.elements.vizTabWordcloud.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabWordcloud.getAttribute('tabindex')).toBe('0');
    expect(mockDocument.elements.vizPanelWordcloud.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelTotalDistance.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabWordcloud.focused).toBe(true);
  });

  it('activates the Pie Charts tab, hides other panels, and focuses its button', () => {
    const mockDocument = createMockDocument();
    setVisualizationTab('wordcloud', { document: mockDocument });
    const selected = setVisualizationTab('pieCharts', { document: mockDocument, focusTab: true });

    expect(selected).toBe('pieCharts');
    expect(mockDocument.elements.vizTabPieCharts.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabPieCharts.getAttribute('tabindex')).toBe('0');
    expect(mockDocument.elements.vizPanelPieCharts.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabWordcloud.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelWordcloud.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabPieCharts.focused).toBe(true);
  });

  it('activates the Lifetime Statistics tab, hides other panels, and focuses its button', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('lifetimeStatistics', { document: mockDocument, focusTab: true });

    expect(selected).toBe('lifetimeStatistics');
    expect(mockDocument.elements.vizTabLifetimeStatistics.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabLifetimeStatistics.getAttribute('tabindex')).toBe('0');
    expect(mockDocument.elements.vizPanelLifetimeStatistics.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabPieCharts.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizPanelPieCharts.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizTabLifetimeStatistics.focused).toBe(true);
  });

  it('reaches Pie Charts and Lifetime Statistics in order and wraps with ArrowRight', () => {
    const onTabChange = jest.fn();

    expect(handleVisualizationTabKeydown({ key: 'ArrowRight', preventDefault: jest.fn() }, 'wordcloud', { onTabChange })).toBe('pieCharts');
    expect(handleVisualizationTabKeydown({ key: 'ArrowRight', preventDefault: jest.fn() }, 'pieCharts', { onTabChange })).toBe('lifetimeStatistics');
    expect(handleVisualizationTabKeydown({ key: 'ArrowRight', preventDefault: jest.fn() }, 'lifetimeStatistics', { onTabChange })).toBe('totalDistance');
    expect(onTabChange).toHaveBeenCalledWith('pieCharts', { focusTab: true });
  });

  it('ignores unrelated keys', () => {
    const event = {
      key: 'Enter',
      shiftKey: false,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBeNull();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onTabChange).not.toHaveBeenCalled();
  });
});
