const TAB_ORDER = ['totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests', 'heatmap', 'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics', 'mediaGallery'];

const TAB_BUTTON_IDS = {
  totalDistance: 'vizTabTotalDistance',
  paceMetrics: 'vizTabPaceMetrics',
  equipment: 'vizTabEquipment',
  equipmentTimeline: 'vizTabEquipmentTimeline',
  personalBests: 'vizTabPersonalBests',
  heatmap: 'vizTabHeatmap',
  distributions: 'vizTabDistributions',
  workoutTime: 'vizTabWorkoutTime',
  trainingCalendar: 'vizTabTrainingCalendar',
  wordcloud: 'vizTabWordcloud',
  pieCharts: 'vizTabPieCharts',
  lifetimeStatistics: 'vizTabLifetimeStatistics',
  mediaGallery: 'vizTabMediaGallery'
};

const TAB_PANEL_IDS = {
  totalDistance: 'vizPanelTotalDistance',
  paceMetrics: 'vizPanelPaceMetrics',
  equipment: 'vizPanelEquipment',
  equipmentTimeline: 'vizPanelEquipmentTimeline',
  personalBests: 'vizPanelPersonalBests',
  heatmap: 'vizPanelHeatmap',
  distributions: 'vizPanelDistributions',
  workoutTime: 'vizPanelWorkoutTime',
  trainingCalendar: 'vizPanelTrainingCalendar',
  wordcloud: 'vizPanelWordcloud',
  pieCharts: 'vizPanelPieCharts',
  lifetimeStatistics: 'vizPanelLifetimeStatistics',
  mediaGallery: 'vizPanelMediaGallery'
};

const TAB_ACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
const TAB_INACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';

function setVisualizationTabButtonClass(button, isActive) {
  const hiddenClass = button.classList.contains('hidden') ? ' hidden' : '';
  button.className = `${isActive ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}${hiddenClass}`;
}

function getAvailableVisualizationTabs(availabilityByTab = {}) {
  return TAB_ORDER.filter(tabName => availabilityByTab[tabName] === true);
}

function setAvailableVisualizationTabs(availableTabs, options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  const orderedAvailableTabs = TAB_ORDER.filter(tabName => Array.isArray(availableTabs) && availableTabs.includes(tabName));
  if (!doc) return orderedAvailableTabs;

  const availableSet = new Set(orderedAvailableTabs);
  TAB_ORDER.forEach(tabName => {
    const button = doc.getElementById(TAB_BUTTON_IDS[tabName]);
    const panel = doc.getElementById(TAB_PANEL_IDS[tabName]);
    const isAvailable = availableSet.has(tabName);
    if (button) {
      button.classList.toggle('hidden', !isAvailable);
      button.setAttribute('aria-hidden', isAvailable ? 'false' : 'true');
      if (!isAvailable) {
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabindex', '-1');
      }
    }
    if (panel && (!isAvailable || orderedAvailableTabs.length === 0)) {
      panel.classList.add ? panel.classList.add('hidden') : panel.classList.toggle('hidden', true);
    }
  });

  const emptyState = doc.getElementById('noVisualizationsAvailable');
  if (emptyState) emptyState.classList.toggle('hidden', orderedAvailableTabs.length > 0);
  return orderedAvailableTabs;
}

function getAvailableVisualizationTab(currentTab, availableTabs = TAB_ORDER) {
  const orderedAvailableTabs = TAB_ORDER.filter(tabName => Array.isArray(availableTabs) && availableTabs.includes(tabName));
  return orderedAvailableTabs.includes(currentTab) ? currentTab : (orderedAvailableTabs[0] || null);
}

function getNextVisualizationTab(currentTab, direction, availableTabs = TAB_ORDER) {
  const orderedAvailableTabs = TAB_ORDER.filter(tabName => Array.isArray(availableTabs) && availableTabs.includes(tabName));
  if (orderedAvailableTabs.length === 0) return null;

  const currentIndex = orderedAvailableTabs.indexOf(currentTab);
  if (currentIndex === -1) return orderedAvailableTabs[0];
  const nextIndex = (currentIndex + direction + orderedAvailableTabs.length) % orderedAvailableTabs.length;
  return orderedAvailableTabs[nextIndex];
}

function createFilterDomain(descriptor) {
  if (!descriptor || typeof descriptor.id !== 'string' || !descriptor.id) return null;
  const kind = descriptor.kind || 'single';
  if (!['single', 'boolean', 'stepped'].includes(kind)) return null;
  if (kind === 'stepped') {
    const { min, max, step } = descriptor;
    const intervals = (max - min) / step;
    if (![min, max, step].every(Number.isFinite) || step <= 0 || max < min ||
        !Number.isSafeInteger(intervals) || intervals >= Number.MAX_SAFE_INTEGER) return null;
    const count = intervals + 1;
    return {
      id: descriptor.id,
      count,
      at: index => Number.isInteger(index) && index >= 0 && index < count ? min + index * step : undefined,
      indexOf: value => {
        const index = (value - min) / step;
        return Number.isFinite(value) && Number.isInteger(index) && index >= 0 && index < count ? index : -1;
      }
    };
  }
  const values = kind === 'boolean' ? [false, true] : descriptor.values;
  if (!Array.isArray(values) || new Set(values).size !== values.length ||
      values.some(value => !['string', 'number', 'boolean'].includes(typeof value) ||
        (typeof value === 'number' && !Number.isFinite(value)))) return null;
  return {
    id: descriptor.id,
    count: values.length,
    at: index => Number.isInteger(index) && index >= 0 && index < values.length ? values[index] : undefined,
    indexOf: value => values.indexOf(value)
  };
}

function getFilterSelectionKey(selection) {
  return JSON.stringify(selection.map(choice => [choice.id, choice.value]));
}

function createDashboardFilterAdapter(readState, describeDimension, commit) {
  return {
    readSnapshot() {
      const state = readState();
      const selection = [];
      let descriptor = describeDimension(selection, state);
      while (descriptor !== null) {
        const domain = createFilterDomain(descriptor);
        if (!domain || domain.count === 0 || selection.some(choice => choice.id === domain.id)) throw new Error('Invalid dashboard filter domain');
        const value = state.values[domain.id];
        selection.push({ id: domain.id, value: domain.indexOf(value) >= 0 ? value : domain.at(0) });
        descriptor = describeDimension(selection, state);
      }
      return { ...state, selection };
    },
    getDomainProvider(snapshot) {
      return prefix => describeDimension(prefix, snapshot);
    },
    applySelection(candidate) {
      const snapshot = this.readSnapshot();
      const provider = this.getDomainProvider(snapshot);
      const prefix = [];
      if (!Array.isArray(candidate)) return false;
      for (const choice of candidate) {
        const domain = createFilterDomain(provider(prefix));
        if (!choice || !domain || domain.id !== choice.id || domain.indexOf(choice.value) < 0) return false;
        prefix.push(choice);
      }
      if (provider(prefix) !== null || getFilterSelectionKey(candidate) === getFilterSelectionKey(snapshot.selection)) return false;
      commit(Object.fromEntries(candidate.map(choice => [choice.id, choice.value])), snapshot);
      return true;
    }
  };
}

function getAdjacentFilterCombination(snapshot, direction, domainProvider) {
  if (!snapshot || !Array.isArray(snapshot.selection) || ![-1, 1].includes(direction) || typeof domainProvider !== 'function') return null;
  const current = snapshot.selection;
  const prefix = [];
  for (const choice of current) {
    const domain = createFilterDomain(domainProvider(prefix));
    if (!choice || !domain || domain.id !== choice.id || domain.indexOf(choice.value) < 0 || prefix.some(item => item.id === choice.id)) return null;
    prefix.push(choice);
  }
  if (domainProvider(prefix) !== null) return null;

  function complete(candidate) {
    const descriptor = domainProvider(candidate);
    if (descriptor === null) return candidate.slice();
    const domain = createFilterDomain(descriptor);
    if (!domain || candidate.some(choice => choice.id === domain.id)) return null;
    for (let index = direction > 0 ? 0 : domain.count - 1; index >= 0 && index < domain.count; index += direction) {
      candidate.push({ id: domain.id, value: domain.at(index) });
      const leaf = complete(candidate);
      candidate.pop();
      if (leaf) return leaf;
    }
    return null;
  }

  for (let depth = current.length - 1; depth >= 0; depth -= 1) {
    const candidate = current.slice(0, depth);
    const domain = createFilterDomain(domainProvider(candidate));
    for (let index = domain.indexOf(current[depth].value) + direction; index >= 0 && index < domain.count; index += direction) {
      candidate.push({ id: domain.id, value: domain.at(index) });
      const leaf = complete(candidate);
      candidate.pop();
      if (leaf) return leaf;
    }
  }
  const wrapped = complete([]);
  return wrapped && getFilterSelectionKey(wrapped) !== getFilterSelectionKey(current) ? wrapped : null;
}

function resolveDashboardArrowAction(key, context = {}) {
  const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
  const ignored = { outcome: 'ignored', preventDefault: false, target: null, cue: null };
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key) ||
      !context.workspaceOwnsInput || context.inputOwner !== 'workspace') return ignored;
  const action = { axis: horizontal ? 'dashboard' : 'view', direction, outcome: 'noop', preventDefault: true, target: null, cue: null };
  if (horizontal) {
    const next = getNextVisualizationTab(context.activeTabId, direction, context.availableTabs || []);
    if (next && next !== context.activeTabId) {
      action.target = next;
      action.outcome = 'changed';
      action.cue = direction > 0 ? 'right' : 'left';
    }
  } else {
    const next = getAdjacentFilterCombination(context.snapshot, direction, context.domainProvider);
    if (next) {
      action.target = next;
      action.outcome = 'changed';
      action.cue = direction > 0 ? 'down' : 'up';
    }
  }
  return action;
}

function getNextFilterChoiceIndex(choiceCount, currentIndex, direction, controlType = 'single-choice') {
  if (controlType !== 'single-choice' || !Number.isInteger(choiceCount) || choiceCount < 2 ||
      !Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= choiceCount ||
      (direction !== -1 && direction !== 1)) {
    return null;
  }

  return (currentIndex + direction + choiceCount) % choiceCount;
}

function getNextClippedTabScrollOffset(tabBounds, viewportBounds, currentScrollOffset, maxScrollOffset, direction) {
  const tolerance = 0.5;
  const numericValues = [
    viewportBounds && viewportBounds.left,
    viewportBounds && viewportBounds.right,
    currentScrollOffset,
    maxScrollOffset
  ];
  if (!Array.isArray(tabBounds) || !viewportBounds ||
      !numericValues.every(Number.isFinite) || (direction !== -1 && direction !== 1)) {
    return null;
  }

  const maxOffset = Math.max(0, maxScrollOffset);
  const scrollOffset = Math.min(maxOffset, Math.max(0, currentScrollOffset));
  let targetBounds = null;

  if (direction > 0) {
    targetBounds = tabBounds.find(bounds => bounds && Number.isFinite(bounds.right) && bounds.right > viewportBounds.right + tolerance);
    if (!targetBounds) return null;
    const movement = targetBounds.right - viewportBounds.right;
    const nextOffset = Math.min(maxOffset, scrollOffset + movement);
    return nextOffset > scrollOffset + tolerance ? nextOffset : null;
  }

  for (let index = tabBounds.length - 1; index >= 0; index -= 1) {
    const bounds = tabBounds[index];
    if (bounds && Number.isFinite(bounds.left) && bounds.left < viewportBounds.left - tolerance) {
      targetBounds = bounds;
      break;
    }
  }
  if (!targetBounds) return null;

  const movement = targetBounds.left - viewportBounds.left;
  const nextOffset = Math.max(0, scrollOffset + movement);
  return nextOffset < scrollOffset - tolerance ? nextOffset : null;
}

function setVisualizationTab(tabName, options = {}) {
  if (!TAB_ORDER.includes(tabName)) return null;
  if (Array.isArray(options.availableTabs) && !options.availableTabs.includes(tabName)) return null;

  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return tabName;

  const totalDistanceBtn = doc.getElementById(TAB_BUTTON_IDS.totalDistance);
  const paceMetricsBtn = doc.getElementById(TAB_BUTTON_IDS.paceMetrics);
  const equipmentBtn = doc.getElementById(TAB_BUTTON_IDS.equipment);
  const equipmentTimelineBtn = doc.getElementById(TAB_BUTTON_IDS.equipmentTimeline);
  const personalBestsBtn = doc.getElementById(TAB_BUTTON_IDS.personalBests);
  const heatmapBtn = doc.getElementById(TAB_BUTTON_IDS.heatmap);
  const distributionsBtn = doc.getElementById(TAB_BUTTON_IDS.distributions);
  const workoutTimeBtn = doc.getElementById(TAB_BUTTON_IDS.workoutTime);
  const trainingCalendarBtn = doc.getElementById(TAB_BUTTON_IDS.trainingCalendar);
  const wordcloudBtn = doc.getElementById(TAB_BUTTON_IDS.wordcloud);
  const pieChartsBtn = doc.getElementById(TAB_BUTTON_IDS.pieCharts);
  const lifetimeStatisticsBtn = doc.getElementById(TAB_BUTTON_IDS.lifetimeStatistics);
  const mediaGalleryBtn = doc.getElementById(TAB_BUTTON_IDS.mediaGallery);
  const totalDistancePanel = doc.getElementById(TAB_PANEL_IDS.totalDistance);
  const paceMetricsPanel = doc.getElementById(TAB_PANEL_IDS.paceMetrics);
  const equipmentPanel = doc.getElementById(TAB_PANEL_IDS.equipment);
  const equipmentTimelinePanel = doc.getElementById(TAB_PANEL_IDS.equipmentTimeline);
  const personalBestsPanel = doc.getElementById(TAB_PANEL_IDS.personalBests);
  const heatmapPanel = doc.getElementById(TAB_PANEL_IDS.heatmap);
  const distributionsPanel = doc.getElementById(TAB_PANEL_IDS.distributions);
    const workoutTimePanel = doc.getElementById(TAB_PANEL_IDS.workoutTime);
  const trainingCalendarPanel = doc.getElementById(TAB_PANEL_IDS.trainingCalendar);
  const wordcloudPanel = doc.getElementById(TAB_PANEL_IDS.wordcloud);
  const pieChartsPanel = doc.getElementById(TAB_PANEL_IDS.pieCharts);
  const lifetimeStatisticsPanel = doc.getElementById(TAB_PANEL_IDS.lifetimeStatistics);
  const mediaGalleryPanel = doc.getElementById(TAB_PANEL_IDS.mediaGallery);

  if (!totalDistanceBtn || !paceMetricsBtn || !equipmentBtn || !equipmentTimelineBtn || !personalBestsBtn || !heatmapBtn || !distributionsBtn || !workoutTimeBtn ||
      !trainingCalendarBtn || !wordcloudBtn || !pieChartsBtn || !lifetimeStatisticsBtn || !mediaGalleryBtn || !totalDistancePanel || !paceMetricsPanel || !equipmentPanel || !equipmentTimelinePanel || !personalBestsPanel || !heatmapPanel || !distributionsPanel || !workoutTimePanel || !trainingCalendarPanel || !wordcloudPanel || !pieChartsPanel || !lifetimeStatisticsPanel || !mediaGalleryPanel) {
    return tabName;
  }

  const isTotalDistance = tabName === 'totalDistance';
  const isPaceMetrics = tabName === 'paceMetrics';
  const isEquipment = tabName === 'equipment';
  const isEquipmentTimeline = tabName === 'equipmentTimeline';
  const isPersonalBests = tabName === 'personalBests';
  const isHeatmap = tabName === 'heatmap';
  const isDistributions = tabName === 'distributions';
  const isWorkoutTime = tabName === 'workoutTime';
  const isTrainingCalendar = tabName === 'trainingCalendar';
  const isWordcloud = tabName === 'wordcloud';
  const isPieCharts = tabName === 'pieCharts';
  const isLifetimeStatistics = tabName === 'lifetimeStatistics';
  const isMediaGallery = tabName === 'mediaGallery';

  totalDistanceBtn.setAttribute('aria-selected', isTotalDistance ? 'true' : 'false');
  totalDistanceBtn.setAttribute('tabindex', isTotalDistance ? '0' : '-1');
  setVisualizationTabButtonClass(totalDistanceBtn, isTotalDistance);

  paceMetricsBtn.setAttribute('aria-selected', isPaceMetrics ? 'true' : 'false');
  paceMetricsBtn.setAttribute('tabindex', isPaceMetrics ? '0' : '-1');
  setVisualizationTabButtonClass(paceMetricsBtn, isPaceMetrics);

  equipmentBtn.setAttribute('aria-selected', isEquipment ? 'true' : 'false');
  equipmentBtn.setAttribute('tabindex', isEquipment ? '0' : '-1');
  setVisualizationTabButtonClass(equipmentBtn, isEquipment);

  equipmentTimelineBtn.setAttribute('aria-selected', isEquipmentTimeline ? 'true' : 'false');
  equipmentTimelineBtn.setAttribute('tabindex', isEquipmentTimeline ? '0' : '-1');
  setVisualizationTabButtonClass(equipmentTimelineBtn, isEquipmentTimeline);

  personalBestsBtn.setAttribute('aria-selected', isPersonalBests ? 'true' : 'false');
  personalBestsBtn.setAttribute('tabindex', isPersonalBests ? '0' : '-1');
  setVisualizationTabButtonClass(personalBestsBtn, isPersonalBests);

  heatmapBtn.setAttribute('aria-selected', isHeatmap ? 'true' : 'false');
  heatmapBtn.setAttribute('tabindex', isHeatmap ? '0' : '-1');
  setVisualizationTabButtonClass(heatmapBtn, isHeatmap);

  distributionsBtn.setAttribute('aria-selected', isDistributions ? 'true' : 'false');
  distributionsBtn.setAttribute('tabindex', isDistributions ? '0' : '-1');
  setVisualizationTabButtonClass(distributionsBtn, isDistributions);

  workoutTimeBtn.setAttribute('aria-selected', isWorkoutTime ? 'true' : 'false');
  workoutTimeBtn.setAttribute('tabindex', isWorkoutTime ? '0' : '-1');
  setVisualizationTabButtonClass(workoutTimeBtn, isWorkoutTime);

  trainingCalendarBtn.setAttribute('aria-selected', isTrainingCalendar ? 'true' : 'false');
  trainingCalendarBtn.setAttribute('tabindex', isTrainingCalendar ? '0' : '-1');
  setVisualizationTabButtonClass(trainingCalendarBtn, isTrainingCalendar);
  wordcloudBtn.setAttribute('aria-selected', isWordcloud ? 'true' : 'false');
  wordcloudBtn.setAttribute('tabindex', isWordcloud ? '0' : '-1');
  setVisualizationTabButtonClass(wordcloudBtn, isWordcloud);
  pieChartsBtn.setAttribute('aria-selected', isPieCharts ? 'true' : 'false');
  pieChartsBtn.setAttribute('tabindex', isPieCharts ? '0' : '-1');
  setVisualizationTabButtonClass(pieChartsBtn, isPieCharts);
  lifetimeStatisticsBtn.setAttribute('aria-selected', isLifetimeStatistics ? 'true' : 'false');
  lifetimeStatisticsBtn.setAttribute('tabindex', isLifetimeStatistics ? '0' : '-1');
  setVisualizationTabButtonClass(lifetimeStatisticsBtn, isLifetimeStatistics);
  mediaGalleryBtn.setAttribute('aria-selected', isMediaGallery ? 'true' : 'false');
  mediaGalleryBtn.setAttribute('tabindex', isMediaGallery ? '0' : '-1');
  setVisualizationTabButtonClass(mediaGalleryBtn, isMediaGallery);

  totalDistancePanel.classList.toggle('hidden', !isTotalDistance);
  paceMetricsPanel.classList.toggle('hidden', !isPaceMetrics);
  equipmentPanel.classList.toggle('hidden', !isEquipment);
  equipmentTimelinePanel.classList.toggle('hidden', !isEquipmentTimeline);
  personalBestsPanel.classList.toggle('hidden', !isPersonalBests);
  heatmapPanel.classList.toggle('hidden', !isHeatmap);
  distributionsPanel.classList.toggle('hidden', !isDistributions);
  workoutTimePanel.classList.toggle('hidden', !isWorkoutTime);
  trainingCalendarPanel.classList.toggle('hidden', !isTrainingCalendar);
  wordcloudPanel.classList.toggle('hidden', !isWordcloud);
  pieChartsPanel.classList.toggle('hidden', !isPieCharts);
  lifetimeStatisticsPanel.classList.toggle('hidden', !isLifetimeStatistics);
  mediaGalleryPanel.classList.toggle('hidden', !isMediaGallery);

  if (options.focusTab) {
    (isTotalDistance ? totalDistanceBtn :
    isPaceMetrics ? paceMetricsBtn :
     isEquipment ? equipmentBtn :
     isEquipmentTimeline ? equipmentTimelineBtn :
     isPersonalBests ? personalBestsBtn :
    isHeatmap ? heatmapBtn :
    isDistributions ? distributionsBtn :
    isWorkoutTime ? workoutTimeBtn :
    isTrainingCalendar ? trainingCalendarBtn :
    isWordcloud ? wordcloudBtn :
    isPieCharts ? pieChartsBtn : isLifetimeStatistics ? lifetimeStatisticsBtn : mediaGalleryBtn).focus();
  }

  return tabName;
}

function handleVisualizationTabKeydown(event, currentTab, options = {}) {
  let direction = 0;
  if (event.key === 'ArrowRight' || (event.key === 'Tab' && !event.shiftKey)) direction = 1;
  if (event.key === 'ArrowLeft' || (event.key === 'Tab' && event.shiftKey)) direction = -1;

  if (direction === 0) return null;

  const nextTab = getNextVisualizationTab(currentTab, direction, options.availableTabs);
  if (!nextTab) return null;

  event.preventDefault();

  if (typeof options.onTabChange === 'function') {
    options.onTabChange(nextTab, { focusTab: true });
  } else {
    setVisualizationTab(nextTab, { focusTab: true, document: options.document });
  }

  return nextTab;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TAB_ORDER,
    TAB_BUTTON_IDS,
    TAB_PANEL_IDS,
    getAvailableVisualizationTabs,
    setAvailableVisualizationTabs,
    getAvailableVisualizationTab,
    getNextVisualizationTab,
    createFilterDomain,
    getFilterSelectionKey,
    getAdjacentFilterCombination,
    createDashboardFilterAdapter,
    resolveDashboardArrowAction,
    getNextFilterChoiceIndex,
    getNextClippedTabScrollOffset,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}

if (typeof window !== 'undefined') {
  window.dashboardTabNavigation = {
    TAB_ORDER,
    TAB_BUTTON_IDS,
    TAB_PANEL_IDS,
    getAvailableVisualizationTabs,
    setAvailableVisualizationTabs,
    getAvailableVisualizationTab,
    getNextVisualizationTab,
    createFilterDomain,
    getFilterSelectionKey,
    getAdjacentFilterCombination,
    createDashboardFilterAdapter,
    resolveDashboardArrowAction,
    getNextFilterChoiceIndex,
    getNextClippedTabScrollOffset,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}
