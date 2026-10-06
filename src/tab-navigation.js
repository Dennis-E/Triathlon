const TAB_ORDER = ['totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests', 'heatmap', 'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts'];

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
  pieCharts: 'vizTabPieCharts'
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
  pieCharts: 'vizPanelPieCharts'
};

const TAB_ACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
const TAB_INACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';

function getNextVisualizationTab(currentTab, direction) {
  const currentIndex = TAB_ORDER.indexOf(currentTab);
  if (currentIndex === -1) return TAB_ORDER[0];
  const nextIndex = (currentIndex + direction + TAB_ORDER.length) % TAB_ORDER.length;
  return TAB_ORDER[nextIndex];
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

  if (!totalDistanceBtn || !paceMetricsBtn || !equipmentBtn || !equipmentTimelineBtn || !personalBestsBtn || !heatmapBtn || !distributionsBtn || !workoutTimeBtn ||
      !trainingCalendarBtn || !wordcloudBtn || !pieChartsBtn || !totalDistancePanel || !paceMetricsPanel || !equipmentPanel || !equipmentTimelinePanel || !personalBestsPanel || !heatmapPanel || !distributionsPanel || !workoutTimePanel || !trainingCalendarPanel || !wordcloudPanel || !pieChartsPanel) {
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

  totalDistanceBtn.setAttribute('aria-selected', isTotalDistance ? 'true' : 'false');
  totalDistanceBtn.setAttribute('tabindex', isTotalDistance ? '0' : '-1');
  totalDistanceBtn.className = isTotalDistance ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  paceMetricsBtn.setAttribute('aria-selected', isPaceMetrics ? 'true' : 'false');
  paceMetricsBtn.setAttribute('tabindex', isPaceMetrics ? '0' : '-1');
  paceMetricsBtn.className = isPaceMetrics ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  equipmentBtn.setAttribute('aria-selected', isEquipment ? 'true' : 'false');
  equipmentBtn.setAttribute('tabindex', isEquipment ? '0' : '-1');
  equipmentBtn.className = isEquipment ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  equipmentTimelineBtn.setAttribute('aria-selected', isEquipmentTimeline ? 'true' : 'false');
  equipmentTimelineBtn.setAttribute('tabindex', isEquipmentTimeline ? '0' : '-1');
  equipmentTimelineBtn.className = isEquipmentTimeline ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  personalBestsBtn.setAttribute('aria-selected', isPersonalBests ? 'true' : 'false');
  personalBestsBtn.setAttribute('tabindex', isPersonalBests ? '0' : '-1');
  personalBestsBtn.className = isPersonalBests ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  heatmapBtn.setAttribute('aria-selected', isHeatmap ? 'true' : 'false');
  heatmapBtn.setAttribute('tabindex', isHeatmap ? '0' : '-1');
  heatmapBtn.className = isHeatmap ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  distributionsBtn.setAttribute('aria-selected', isDistributions ? 'true' : 'false');
  distributionsBtn.setAttribute('tabindex', isDistributions ? '0' : '-1');
  distributionsBtn.className = isDistributions ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  workoutTimeBtn.setAttribute('aria-selected', isWorkoutTime ? 'true' : 'false');
  workoutTimeBtn.setAttribute('tabindex', isWorkoutTime ? '0' : '-1');
  workoutTimeBtn.className = isWorkoutTime ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  trainingCalendarBtn.setAttribute('aria-selected', isTrainingCalendar ? 'true' : 'false');
  trainingCalendarBtn.setAttribute('tabindex', isTrainingCalendar ? '0' : '-1');
  trainingCalendarBtn.className = isTrainingCalendar ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;
  wordcloudBtn.setAttribute('aria-selected', isWordcloud ? 'true' : 'false');
  wordcloudBtn.setAttribute('tabindex', isWordcloud ? '0' : '-1');
  wordcloudBtn.className = isWordcloud ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;
  pieChartsBtn.setAttribute('aria-selected', isPieCharts ? 'true' : 'false');
  pieChartsBtn.setAttribute('tabindex', isPieCharts ? '0' : '-1');
  pieChartsBtn.className = isPieCharts ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

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
    pieChartsBtn).focus();
  }

  return tabName;
}

function handleVisualizationTabKeydown(event, currentTab, options = {}) {
  let direction = 0;
  if (event.key === 'ArrowRight') direction = 1;
  if (event.key === 'ArrowLeft') direction = -1;

  if (direction === 0) return null;

  event.preventDefault();
  const nextTab = getNextVisualizationTab(currentTab, direction);

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
    getNextVisualizationTab,
    getNextClippedTabScrollOffset,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}

if (typeof window !== 'undefined') {
  window.dashboardTabNavigation = {
    TAB_ORDER,
    TAB_BUTTON_IDS,
    getNextVisualizationTab,
    getNextClippedTabScrollOffset,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}
