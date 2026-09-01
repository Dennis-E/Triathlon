const {
  getNextVisualizationTab,
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
    vizTabHeartratePace: createMockElement(),
    vizTabEquipment: createMockElement(),
    vizTabEquipmentTimeline: createMockElement(),
    vizTabPersonalBests: createMockElement(),
    vizPanelTotalDistance: createMockElement(),
    vizPanelHeartratePace: createMockElement(),
    vizPanelEquipment: createMockElement(),
    vizPanelEquipmentTimeline: createMockElement(),
    vizPanelPersonalBests: createMockElement()
  };

  return {
    elements,
    getElementById(id) {
      return elements[id] || null;
    }
  };
}

describe('tab navigation helpers', () => {
  it('cycles to next and previous tabs', () => {
    expect(getNextVisualizationTab('totalDistance', 1)).toBe('heartratePace');
    expect(getNextVisualizationTab('heartratePace', 1)).toBe('equipment');
    expect(getNextVisualizationTab('equipment', 1)).toBe('equipmentTimeline');
    expect(getNextVisualizationTab('equipmentTimeline', 1)).toBe('personalBests');
    expect(getNextVisualizationTab('personalBests', 1)).toBe('totalDistance');
    expect(getNextVisualizationTab('totalDistance', -1)).toBe('personalBests');
    expect(getNextVisualizationTab('unknown', 1)).toBe('totalDistance');
  });

  it('sets active tab classes, aria state, and panel visibility', () => {
    const mockDocument = createMockDocument();
    const selected = setVisualizationTab('heartratePace', { document: mockDocument, focusTab: true });

    expect(selected).toBe('heartratePace');
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('aria-selected')).toBe('false');
    expect(mockDocument.elements.vizTabHeartratePace.getAttribute('aria-selected')).toBe('true');
    expect(mockDocument.elements.vizTabTotalDistance.getAttribute('tabindex')).toBe('-1');
    expect(mockDocument.elements.vizTabHeartratePace.getAttribute('tabindex')).toBe('0');
    expect(mockDocument.elements.vizPanelTotalDistance.classList.contains('hidden')).toBe(true);
    expect(mockDocument.elements.vizPanelHeartratePace.classList.contains('hidden')).toBe(false);
    expect(mockDocument.elements.vizTabHeartratePace.focused).toBe(true);
  });

  it('handles ArrowRight and requests next tab', () => {
    const event = {
      key: 'ArrowRight',
      shiftKey: false,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBe('heartratePace');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('heartratePace', { focusTab: true });
  });

  it('handles Shift+Tab and requests previous tab', () => {
    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: jest.fn()
    };
    const onTabChange = jest.fn();

    const nextTab = handleVisualizationTabKeydown(event, 'totalDistance', { onTabChange });

    expect(nextTab).toBe('personalBests');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('personalBests', { focusTab: true });
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
