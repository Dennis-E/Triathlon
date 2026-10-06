const {
  getNextVisualizationTab,
  getNextClippedTabScrollOffset,
  setVisualizationTab,
  handleVisualizationTabKeydown
} = require('../src/tab-navigation');

function createMockElement() {
  const attributes = {};
  const classes = new Set();

  return {
    className: '',
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
    vizPanelPieCharts: createMockElement()
  };

  return {
    elements,
    getElementById(id) {
      return elements[id] || null;
    }
  };
}

describe('tab navigation helpers', () => {
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
    expect(getNextVisualizationTab('pieCharts', 1)).toBe('totalDistance');
    expect(getNextVisualizationTab('totalDistance', -1)).toBe('pieCharts');
    expect(getNextVisualizationTab('workoutTime', -1)).toBe('distributions');
    expect(getNextVisualizationTab('unknown', 1)).toBe('totalDistance');
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

  it('allows Shift+Tab to leave the tablist through normal focus order', () => {
    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBeNull();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('allows Tab to reach the directional controls after the tablist', () => {
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: jest.fn()
    };
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

  it('reaches Pie Charts from Wordcloud and wraps to Total distance with ArrowRight', () => {
    const onTabChange = jest.fn();

    expect(handleVisualizationTabKeydown({ key: 'ArrowRight', preventDefault: jest.fn() }, 'wordcloud', { onTabChange })).toBe('pieCharts');
    expect(handleVisualizationTabKeydown({ key: 'ArrowRight', preventDefault: jest.fn() }, 'pieCharts', { onTabChange })).toBe('totalDistance');
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
