    // Lucide Icons init
    lucide.createIcons();
    // Deferred so all `let` state declarations below (e.g. leafletLoadPromise) have run first
    setTimeout(renderHeatmapPreviewMap, 0);

    function updateVisualizationTabScrollControls() {
      const viewport = document.getElementById('visualizationTabsViewport');
      const tablist = viewport && viewport.querySelector('[role="tablist"]');
      const leftButton = document.getElementById('visualizationTabsScrollLeft');
      const rightButton = document.getElementById('visualizationTabsScrollRight');
      if (!viewport || !tablist || !leftButton || !rightButton) return;

      const hasOverflow = viewport.scrollWidth > viewport.clientWidth + 1;
      if (!hasOverflow && viewport.scrollLeft !== 0) viewport.scrollLeft = 0;

      const tabs = Array.from(tablist.children);
      const viewportBounds = viewport.getBoundingClientRect();
      const firstTabBounds = tabs[0] && tabs[0].getBoundingClientRect();
      const lastTabBounds = tabs[tabs.length - 1] && tabs[tabs.length - 1].getBoundingClientRect();
      const canScrollLeft = hasOverflow && firstTabBounds && firstTabBounds.left < viewportBounds.left - 1;
      const canScrollRight = hasOverflow && lastTabBounds && lastTabBounds.right > viewportBounds.right + 1;
      leftButton.classList.toggle('invisible', !canScrollLeft);
      leftButton.classList.toggle('pointer-events-none', !canScrollLeft);
      rightButton.classList.toggle('invisible', !canScrollRight);
      rightButton.classList.toggle('pointer-events-none', !canScrollRight);
      leftButton.disabled = !canScrollLeft;
      rightButton.disabled = !canScrollRight;
    }

    function scrollVisualizationTabs(direction) {
      const viewport = document.getElementById('visualizationTabsViewport');
      const tablist = viewport && viewport.querySelector('[role="tablist"]');
      if (!viewport || !tablist) return;

      const viewportBounds = viewport.getBoundingClientRect();
      const tabBounds = Array.from(tablist.children, tab => {
        const bounds = tab.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right };
      });
      const maxScrollOffset = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const nextOffset = window.dashboardTabNavigation.getNextClippedTabScrollOffset(
        tabBounds,
        { left: viewportBounds.left, right: viewportBounds.right },
        viewport.scrollLeft,
        maxScrollOffset,
        direction
      );

      if (nextOffset !== null) viewport.scrollTo({ left: nextOffset, behavior: 'auto' });
      updateVisualizationTabScrollControls();
    }

    function ensureVisualizationTabVisible(tabName) {
      const viewport = document.getElementById('visualizationTabsViewport');
      const tabId = window.dashboardTabNavigation.TAB_BUTTON_IDS[tabName];
      const tab = tabId && document.getElementById(tabId);
      if (!viewport || !tab) return;

      const viewportBounds = viewport.getBoundingClientRect();
      const tabBounds = tab.getBoundingClientRect();
      if (tabBounds.left < viewportBounds.left) {
        viewport.scrollLeft = Math.max(0, viewport.scrollLeft + tabBounds.left - viewportBounds.left);
      } else if (tabBounds.right > viewportBounds.right) {
        viewport.scrollLeft += tabBounds.right - viewportBounds.right;
      }
      updateVisualizationTabScrollControls();
    }

    const NAVIGATION_CUE_DURATION_MS = 900;
    const navigationCueTimeouts = new Map();
    let pendingNativeFilterKey = null;

    function flashNavigationCue(direction) {
      const cue = document.querySelector(`[data-navigation-cue="${direction}"]`);
      if (!cue) return;

      const existingTimeout = navigationCueTimeouts.get(direction);
      if (existingTimeout) window.clearTimeout(existingTimeout);
      cue.classList.remove('is-active');
      void cue.offsetWidth;
      cue.classList.add('is-active');
      navigationCueTimeouts.set(direction, window.setTimeout(() => {
        cue.classList.remove('is-active');
        navigationCueTimeouts.delete(direction);
      }, NAVIGATION_CUE_DURATION_MS));
    }

    function updateNavigationCueAvailability(target = document.activeElement) {
      const focusedTab = target && target.closest && target.closest('[role="tab"]');
      const activePanelId = window.dashboardTabNavigation.TAB_PANEL_IDS[selectedVisualizationTab];
      const activePanel = activePanelId && document.getElementById(activePanelId);
      const dashboardMain = document.getElementById('dashboardMain');
      const dashboardVisible = dashboardMain && !dashboardMain.classList.contains('hidden');
      const activePanelVisible = dashboardVisible && activePanel && !activePanel.closest('.hidden');
      const modalOwnsFocus = target && target.closest && target.closest('[role="dialog"][aria-modal="true"]');
      const nativeControl = target && target.closest && target.closest('select, input[type="range"], input[type="checkbox"]');
      const focusedNativeFilter = target && target.matches && target.matches('select, input[type="range"]') &&
        activePanelVisible && activePanel.contains(target) && !target.disabled;
      const navigationFilterGroup = activePanelVisible && !modalOwnsFocus && !nativeControl
        ? getKeyboardFilterGroup(target, activePanel)
        : null;
      document.querySelectorAll('[data-navigation-cue]').forEach(cue => {
        const direction = cue.dataset.navigationCue;
        let available = dashboardVisible && (direction === 'left' || direction === 'right') ? !!focusedTab : false;
        if ((direction === 'up' || direction === 'down') && navigationFilterGroup) {
          available = navigationFilterGroup.querySelectorAll('button:not(:disabled)').length > 1;
        } else if ((direction === 'up' || direction === 'down') && focusedNativeFilter) {
          if (target.tagName === 'SELECT') {
            available = target.options.length > 1 &&
              (direction === 'down' ? target.selectedIndex < target.options.length - 1 : target.selectedIndex > 0);
          } else {
            const value = Number(target.value);
            const bound = Number(direction === 'down' ? target.max : target.min);
            available = Number.isFinite(value) && Number.isFinite(bound) &&
              (direction === 'down' ? value < bound : value > bound);
          }
        }
        cue.classList.toggle('is-available', available);
      });
    }

    function isActiveFilterChoice(button) {
      return button.getAttribute('aria-pressed') === 'true' || button.getAttribute('aria-selected') === 'true' ||
        button.getAttribute('aria-checked') === 'true' || button.classList.contains('bg-indigo-600');
    }

    function getKeyboardFilterGroup(target, activePanel) {
      if (!activePanel) return null;

      const button = target && target.closest && target.closest('button');
      const targetGroup = button && button.closest('[data-keyboard-filter-group]');
      const eligibleGroups = Array.from(activePanel.querySelectorAll('[data-keyboard-filter-group]'))
        .filter(group => !group.closest('.hidden') && group.querySelectorAll('button:not(:disabled)').length > 1);
      const focusedGroup = targetGroup && activePanel.contains(button) && eligibleGroups.includes(targetGroup)
        ? targetGroup : null;

      if (focusedGroup) return focusedGroup;
      if (targetGroup && activePanel.contains(button)) return null;
      return eligibleGroups[0] || null;
    }

    function handleDashboardFilterKeydown(event) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const target = event.target;
      if (target && target.closest && (
        target.closest('select, input[type="range"], input[type="checkbox"]') ||
        target.closest('[role="dialog"][aria-modal="true"]')
      )) return;

      const dashboardMain = document.getElementById('dashboardMain');
      if (!dashboardMain || dashboardMain.classList.contains('hidden')) return;

      const activePanelId = window.dashboardTabNavigation.TAB_PANEL_IDS[selectedVisualizationTab];
      const activePanel = activePanelId && document.getElementById(activePanelId);
      if (!activePanel || activePanel.closest('.hidden')) return;

      event.preventDefault();
      const filterGroup = getKeyboardFilterGroup(event.target, activePanel);
      if (!filterGroup) return;

      const button = event.target.closest && event.target.closest('button');
      const choices = Array.from(filterGroup.querySelectorAll('button:not(:disabled)'));
      const currentIndex = choices.findIndex(choice => isActiveFilterChoice(choice));
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = window.dashboardTabNavigation.getNextFilterChoiceIndex(
        choices.length,
        currentIndex,
        direction
      );
      if (nextIndex === null || choices[nextIndex] === button) return;

      const nextChoice = choices[nextIndex];
      nextChoice.click();
      const refreshedChoices = Array.from(filterGroup.querySelectorAll('button:not(:disabled)'));
      const focusedChoice = refreshedChoices.includes(nextChoice) ? nextChoice : refreshedChoices[nextIndex];
      refreshedChoices.forEach(choice => choice.setAttribute('aria-pressed', choice === focusedChoice ? 'true' : 'false'));
      if (focusedChoice) focusedChoice.focus({ preventScroll: true });
      flashNavigationCue(direction > 0 ? 'down' : 'up');
    }

    function readNativeFilterValue(control) {
      if (control.type === 'checkbox' || control.type === 'radio') return `${control.checked}:${control.value}`;
      return control.value;
    }

    function trackNativeFilterKeydown(event) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const control = event.target;
      if (!control || !control.matches || !control.matches('select, input[type="range"]')) return;
      const activePanelId = window.dashboardTabNavigation.TAB_PANEL_IDS[selectedVisualizationTab];
      const activePanel = activePanelId && document.getElementById(activePanelId);
      if (!activePanel || !activePanel.contains(control)) return;
      pendingNativeFilterKey = { control, value: readNativeFilterValue(control), key: event.key };
    }

    function finishNativeFilterKey(event) {
      if (!pendingNativeFilterKey || event.target !== pendingNativeFilterKey.control) return;
      const { control, value, key } = pendingNativeFilterKey;
      pendingNativeFilterKey = null;
      if (readNativeFilterValue(control) !== value) {
        flashNavigationCue(key === 'ArrowDown' ? 'down' : 'up');
      }
    }

    document.addEventListener('keydown', trackNativeFilterKeydown, true);
    document.addEventListener('keyup', finishNativeFilterKey, true);
    document.addEventListener('keydown', handleDashboardFilterKeydown);
    document.addEventListener('focusin', event => updateNavigationCueAvailability(event.target));
    document.addEventListener('focusout', () => window.setTimeout(() => updateNavigationCueAvailability(), 0));
    document.addEventListener('click', event => {
      const target = event.target;
      const group = target && target.closest && target.closest('[data-filter-summary]');
      const clickedChoice = target && target.closest && target.closest('button');
      if (group) {
        const choices = group.querySelectorAll('button');
        if (choices.length > 0) {
          if (clickedChoice && group.contains(clickedChoice) && group.hasAttribute('data-keyboard-filter-group')) {
            choices.forEach(choice => choice.setAttribute('aria-pressed', choice === clickedChoice ? 'true' : 'false'));
          } else {
            choices.forEach(choice => choice.setAttribute('aria-pressed', isActiveFilterChoice(choice) ? 'true' : 'false'));
          }
        }
      }
    });

    function initializeVisualizationTabScroller() {
      const viewport = document.getElementById('visualizationTabsViewport');
      const tablist = viewport && viewport.querySelector('[role="tablist"]');
      const leftButton = document.getElementById('visualizationTabsScrollLeft');
      const rightButton = document.getElementById('visualizationTabsScrollRight');
      if (!viewport || !tablist || !leftButton || !rightButton) return;

      leftButton.addEventListener('click', () => scrollVisualizationTabs(-1));
      rightButton.addEventListener('click', () => scrollVisualizationTabs(1));
      viewport.addEventListener('scroll', updateVisualizationTabScrollControls, { passive: true });
      window.addEventListener('resize', updateVisualizationTabScrollControls);
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateVisualizationTabScrollControls);
        resizeObserver.observe(viewport);
        resizeObserver.observe(tablist);
      }
      updateVisualizationTabScrollControls();
    }

    function refreshVisualizationTabs() {
      visualizationAvailabilityByTab = window.visualizationAvailability.getVisualizationAvailability(processedActivities, {
        fitBestEffortsByActivityId,
        gpsTracksByActivityId
      });
      availableVisualizationTabs = window.dashboardTabNavigation.getAvailableVisualizationTabs(visualizationAvailabilityByTab);
      window.dashboardTabNavigation.setAvailableVisualizationTabs(availableVisualizationTabs);

      if (availableVisualizationTabs.length === 0) {
        selectedVisualizationTab = null;
        return null;
      }

      selectedVisualizationTab = window.dashboardTabNavigation.getAvailableVisualizationTab(
        selectedVisualizationTab,
        availableVisualizationTabs
      );
      window.dashboardTabNavigation.setVisualizationTab(selectedVisualizationTab, {
        availableTabs: availableVisualizationTabs
      });
      return selectedVisualizationTab;
    }

    function setVisualizationTab(tabName, options = {}) {
      const nextTab = window.dashboardTabNavigation.setVisualizationTab(tabName, {
        ...options,
        availableTabs: availableVisualizationTabs
      });
      if (nextTab) {
        selectedVisualizationTab = nextTab;
        if (nextTab === 'paceMetrics') {
          renderPaceMetricsChart();
        } else if (nextTab === 'equipment') {
          renderEquipmentChart();
        } else if (nextTab === 'equipmentTimeline') {
          renderEquipmentTimeline();
        } else if (nextTab === 'personalBests') {
          renderPbChart();
        } else if (nextTab === 'heatmap') {
          renderHeatmap();
        } else if (nextTab === 'distributions') {
          renderDistributionsChart();
        } else if (nextTab === 'workoutTime') {
          renderWorkoutTimeChart();
        } else if (nextTab === 'trainingCalendar') {
          renderTrainingCalendar();
        } else if (nextTab === 'wordcloud') {
          renderWordcloud();
        } else if (nextTab === 'pieCharts') {
          window.pieChartsDashboard.render();
        } else if (nextTab === 'lifetimeStatistics') {
          window.lifetimeStatisticsDashboard.render();
        }
        ensureVisualizationTabVisible(nextTab);
      }
    }

    function handleVisualizationTabKeydown(event, currentTab) {
      const nextTab = window.dashboardTabNavigation.handleVisualizationTabKeydown(event, currentTab, {
        onTabChange: setVisualizationTab,
        availableTabs: availableVisualizationTabs
      });

      if (nextTab) {
        selectedVisualizationTab = nextTab;
        const nextTabButtonId = window.dashboardTabNavigation.TAB_BUTTON_IDS[nextTab];
        const nextTabButton = nextTabButtonId && document.getElementById(nextTabButtonId);
        if (nextTabButton && nextTabButton.getAttribute('aria-selected') === 'true') {
          const cueDirection = event.key === 'ArrowRight' || (event.key === 'Tab' && !event.shiftKey) ? 'right' : 'left';
          flashNavigationCue(cueDirection);
        }
      }
    }

    // Window size listener to adapt chart autoSkip nicely
    window.addEventListener('resize', () => {
      if (chartInstance) {
        chartInstance.options.scales.x.ticks.maxTicksLimit = window.innerWidth < 640 ? 8 : 16;
        chartInstance.update();
      }
    });

    // Landing page navigation
    function goToLanding() {
      document.getElementById('landingPage').classList.remove('hidden');
      document.getElementById('dashboardMain').classList.add('hidden');
    }

    function openDashboardTab(tabName) {
      if (!hasImportedActivities()) {
        showPreviewGateModal();
        return;
      }
      document.getElementById('landingPage').classList.add('hidden');
      document.getElementById('dashboardMain').classList.remove('hidden');
      const selectedTab = availableVisualizationTabs.includes(tabName) ? tabName : availableVisualizationTabs[0];
      if (!selectedTab) return;
      setVisualizationTab(selectedTab);
      const tabButtonId = window.dashboardTabNavigation.TAB_BUTTON_IDS[selectedTab];
      const tabButton = tabButtonId && document.getElementById(tabButtonId);
      if (tabButton) tabButton.focus();
    }

    const ANALYSIS_COUNTER_API_BASE_URL = 'https://trianalytics-api-520098173492.europe-west1.run.app';
    const ANALYSIS_COUNTER_CLIENT_KEY = 'k2026-09.nEWXDOuN_5rur45Xqt4h07BqeisjKNij';
    const analysisCounterClient = AnalysisCounter.createAnalysisCounter({
      apiBaseUrl: ANALYSIS_COUNTER_API_BASE_URL,
      clientKey: ANALYSIS_COUNTER_CLIENT_KEY
    });

    function setAnalysisCounter(count) {
      const counter = document.getElementById('analysisCounter');
      if (!counter || !Number.isSafeInteger(count) || count < 0) return;
      counter.textContent = `${count.toLocaleString()} analyses completed`;
      counter.classList.remove('hidden');
    }

    async function loadAnalysisCounter() {
      if (!analysisCounterClient.isConfigured()) return;
      try {
        setAnalysisCounter(await analysisCounterClient.getCount());
      } catch (error) {
        console.warn('Could not load analysis counter', error);
      }
    }

    async function recordCompletedAnalysis() {
      if (!analysisCounterClient.isConfigured()) return;
      try {
        setAnalysisCounter(await analysisCounterClient.recordAnalysis());
      } catch (error) {
        console.warn('Could not record completed analysis', error);
      }
    }

    loadAnalysisCounter();

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closePbDetail();
        closePreviewGateModal();
      }
    });

    document.getElementById('pbDetailClose').addEventListener('click', closePbDetail);

    document.getElementById('pbDetailOverlay').addEventListener('click', event => {
      if (event.target.id === 'pbDetailOverlay') closePbDetail();
    });

    window.addEventListener('resize', () => {
      if (activePbDetailModel) renderPbDetailChart(activePbDetailModel);
    });

    document.getElementById('previewGateModal').addEventListener('click', event => {
      if (event.target.id === 'previewGateModal') {
        closePreviewGateModal();
      }
    });

    document.getElementById('exportPreviewCloseBtn').addEventListener('click', closeExportPreviewModal);
    document.getElementById('exportPreviewCloseBtn2').addEventListener('click', closeExportPreviewModal);
    document.getElementById('exportPreviewDownloadBtn').addEventListener('click', downloadExportedImage);
    document.getElementById('pbDetailExport').addEventListener('click', exportActivePbDetail);
    document.getElementById('exportPreviewModal').addEventListener('click', event => {
      if (event.target.id === 'exportPreviewModal') closeExportPreviewModal();
    });

    initializeVisualizationTabScroller();
    setVisualizationTab(selectedVisualizationTab);
