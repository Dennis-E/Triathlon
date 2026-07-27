const TAB_ORDER = ['totalDistance', 'heartratePace', 'equipment'];

const TAB_BUTTON_IDS = {
  totalDistance: 'vizTabTotalDistance',
  heartratePace: 'vizTabHeartratePace',
  equipment: 'vizTabEquipment'
};

const TAB_PANEL_IDS = {
  totalDistance: 'vizPanelTotalDistance',
  heartratePace: 'vizPanelHeartratePace',
  equipment: 'vizPanelEquipment'
};

const TAB_ACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
const TAB_INACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';

function getNextVisualizationTab(currentTab, direction) {
  const currentIndex = TAB_ORDER.indexOf(currentTab);
  if (currentIndex === -1) return TAB_ORDER[0];
  const nextIndex = (currentIndex + direction + TAB_ORDER.length) % TAB_ORDER.length;
  return TAB_ORDER[nextIndex];
}

function setVisualizationTab(tabName, options = {}) {
  if (!TAB_ORDER.includes(tabName)) return null;

  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return tabName;

  const totalDistanceBtn = doc.getElementById(TAB_BUTTON_IDS.totalDistance);
  const heartratePaceBtn = doc.getElementById(TAB_BUTTON_IDS.heartratePace);
  const equipmentBtn = doc.getElementById(TAB_BUTTON_IDS.equipment);
  const totalDistancePanel = doc.getElementById(TAB_PANEL_IDS.totalDistance);
  const heartratePacePanel = doc.getElementById(TAB_PANEL_IDS.heartratePace);
  const equipmentPanel = doc.getElementById(TAB_PANEL_IDS.equipment);

  if (!totalDistanceBtn || !heartratePaceBtn || !equipmentBtn || !totalDistancePanel || !heartratePacePanel || !equipmentPanel) {
    return tabName;
  }

  const isTotalDistance = tabName === 'totalDistance';
  const isHeartratePace = tabName === 'heartratePace';
  const isEquipment = tabName === 'equipment';

  totalDistanceBtn.setAttribute('aria-selected', isTotalDistance ? 'true' : 'false');
  totalDistanceBtn.setAttribute('tabindex', isTotalDistance ? '0' : '-1');
  totalDistanceBtn.className = isTotalDistance ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  heartratePaceBtn.setAttribute('aria-selected', isHeartratePace ? 'true' : 'false');
  heartratePaceBtn.setAttribute('tabindex', isHeartratePace ? '0' : '-1');
  heartratePaceBtn.className = isHeartratePace ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  equipmentBtn.setAttribute('aria-selected', isEquipment ? 'true' : 'false');
  equipmentBtn.setAttribute('tabindex', isEquipment ? '0' : '-1');
  equipmentBtn.className = isEquipment ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;

  totalDistancePanel.classList.toggle('hidden', !isTotalDistance);
  heartratePacePanel.classList.toggle('hidden', !isHeartratePace);
  equipmentPanel.classList.toggle('hidden', !isEquipment);

  if (options.focusTab) {
    (isTotalDistance ? totalDistanceBtn : (isHeartratePace ? heartratePaceBtn : equipmentBtn)).focus();
  }

  return tabName;
}

function handleVisualizationTabKeydown(event, currentTab, options = {}) {
  let direction = 0;
  if (event.key === 'ArrowRight') direction = 1;
  if (event.key === 'ArrowLeft') direction = -1;
  if (event.key === 'Tab') direction = event.shiftKey ? -1 : 1;

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
    getNextVisualizationTab,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}

if (typeof window !== 'undefined') {
  window.dashboardTabNavigation = {
    TAB_ORDER,
    getNextVisualizationTab,
    setVisualizationTab,
    handleVisualizationTabKeydown
  };
}
