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
    let nativeSelectSession = null;

    function registerDashboardFilterAdapter(tabId, adapter) {
      if (!window.dashboardTabNavigation.TAB_ORDER.includes(tabId) || !adapter || typeof adapter.readSnapshot !== 'function') return;
      dashboardFilterAdapters.set(tabId, adapter);
    }

    function readDashboardFilterSnapshot(tabId = selectedVisualizationTab) {
      const adapter = dashboardFilterAdapters.get(tabId);
      const snapshot = adapter ? adapter.readSnapshot() : { selection: [] };
      return {
        ...snapshot,
        tabId,
        dataRevision: dashboardDataRevision,
        canonicalKey: window.dashboardTabNavigation.getFilterSelectionKey(snapshot.selection)
      };
    }

    function initializeDashboardFilterAdapters() {
      const factories = {
        totalDistance: () => getTotalDistanceKeyboardAdapter(),
        paceMetrics: () => getPaceMetricsKeyboardAdapter(),
        equipment: () => getEquipmentKeyboardAdapter(),
        equipmentTimeline: () => getEquipmentTimelineKeyboardAdapter(),
        heatmap: () => getHeatmapKeyboardAdapter(),
        distributions: () => getDistributionsKeyboardAdapter(),
        workoutTime: () => getWorkoutTimeKeyboardAdapter(),
        trainingCalendar: () => getTrainingCalendarKeyboardAdapter(),
        wordcloud: () => window.wordcloudDashboard.getKeyboardAdapter(),
        pieCharts: () => getPieChartsKeyboardAdapter()
      };
      window.dashboardTabNavigation.TAB_ORDER.forEach(tabId => {
        if (dashboardFilterAdapters.has(tabId)) return;
        registerDashboardFilterAdapter(tabId, factories[tabId] ? factories[tabId]() : {
          readSnapshot: () => ({ selection: [] }), getDomainProvider: () => () => null, applySelection: () => false
        });
      });
    }

    function getDashboardNavigationContext(target = document.activeElement) {
      const workspace = document.getElementById('dashboardMain');
      const panelId = window.dashboardTabNavigation.TAB_PANEL_IDS[selectedVisualizationTab];
      const panel = panelId && document.getElementById(panelId);
      const workspaceOwnsInput = !!(workspace && !workspace.classList.contains('hidden') &&
        panel && !panel.closest('.hidden') && target && workspace.contains(target));
      let inputOwner = workspaceOwnsInput ? 'workspace' : 'outside';
      const visibleModal = Array.from(document.querySelectorAll('[aria-modal="true"]'))
        .some(dialog => !dialog.closest('.hidden, [hidden]'));
      if (visibleModal ||
          (target && target.closest && target.closest('[role="dialog"][aria-modal="true"]'))) {
        inputOwner = 'dialog';
      } else if (target && target.closest && target.closest('textarea, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"])')) {
        inputOwner = 'text';
      } else if (target && target.tagName === 'SELECT') {
        let open;
        try { open = target.matches(':open'); } catch (_) { open = nativeSelectSession && nativeSelectSession.control === target; }
        if (open) inputOwner = 'nativePopup';
      } else if (target && target.type === 'range' && !window.dashboardTabNavigation.createFilterDomain({
        id: 'native-range', kind: 'stepped', min: Number(target.min), max: Number(target.max), step: Number(target.step || 1)
      })) {
        inputOwner = 'continuousNumeric';
      }
      return { workspaceOwnsInput, inputOwner, activeTabId: selectedVisualizationTab, availableTabs: availableVisualizationTabs };
    }

    function trackNativeSelectInteraction(event) {
      const control = event.target;
      if (!control || control.tagName !== 'SELECT') return;
      if (event.type === 'pointerdown') {
        nativeSelectSession = { control, openingClick: true };
      } else if (event.type === 'click' && nativeSelectSession && nativeSelectSession.control === control) {
        if (nativeSelectSession.openingClick) nativeSelectSession.openingClick = false;
        else nativeSelectSession = null;
      } else if (event.type === 'change' || event.type === 'focusout' || event.key === 'Escape' || event.key === 'Tab') {
        nativeSelectSession = null;
      } else if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ' || (event.altKey && event.key === 'ArrowDown'))) {
        nativeSelectSession = nativeSelectSession && nativeSelectSession.control === control ? null : { control, openingClick: false };
      }
    }

    function handleDashboardArrowKeydown(event) {
      if (window.dashboardTooltips?.ownsKeyboard(event.target)) return;
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const context = getDashboardNavigationContext(event.target);
      if (!context.workspaceOwnsInput || context.inputOwner !== 'workspace') return;
      event.preventDefault();
      let action;
      let chartDefaults = null;
      let chartAnimation;
      try {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          const adapter = dashboardFilterAdapters.get(selectedVisualizationTab);
          context.snapshot = readDashboardFilterSnapshot();
          context.domainProvider = adapter ? adapter.getDomainProvider(context.snapshot) : () => null;
        }
        action = window.dashboardTabNavigation.resolveDashboardArrowAction(event.key, context);
        if (action.outcome !== 'changed') return;
        chartDefaults = typeof Chart !== 'undefined' ? Chart.defaults : null;
        if (chartDefaults) {
          chartAnimation = chartDefaults.animation;
          chartDefaults.animation = false;
        }
        if (action.axis === 'dashboard') {
          setVisualizationTab(action.target);
        } else {
          if (context.snapshot.dataRevision !== dashboardDataRevision || context.activeTabId !== selectedVisualizationTab) return;
          advanceDashboardRevision();
          if (!dashboardFilterAdapters.get(selectedVisualizationTab).applySelection(action.target)) return;
        }
      } catch (error) {
        console.warn('Could not change dashboard view', error);
        return;
      } finally {
        if (chartDefaults) chartDefaults.animation = chartAnimation;
      }
      flashNavigationCue(action.cue);
      const workspace = document.getElementById('dashboardMain');
      if (!workspace.contains(document.activeElement) || (document.activeElement.closest && document.activeElement.closest('.hidden'))) {
        workspace.setAttribute('tabindex', '-1');
        workspace.focus({ preventScroll: true });
      }
      updateNavigationCueAvailability();
    }

    function invalidateDashboardFilterEvent(event) {
      const target = event.target;
      const context = getDashboardNavigationContext(target);
      const panelId = window.dashboardTabNavigation.TAB_PANEL_IDS[selectedVisualizationTab];
      const panel = panelId && document.getElementById(panelId);
      if (!context.workspaceOwnsInput || !panel || !panel.contains(target)) return;
      const nativeInput = event.type === 'input' && target.matches && target.matches('select, input[type="range"], input[type="checkbox"], input[type="radio"]');
      const filterClick = event.type === 'click' && target.closest && target.closest('button') && target.closest('[data-keyboard-filter-group]');
      if (!nativeInput && !filterClick) return;
      advanceDashboardRevision();
      window.setTimeout(() => updateNavigationCueAvailability(), 0);
    }

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
      const context = getDashboardNavigationContext(target);
      try {
        const adapter = dashboardFilterAdapters.get(selectedVisualizationTab);
        context.snapshot = readDashboardFilterSnapshot();
        context.domainProvider = adapter ? adapter.getDomainProvider(context.snapshot) : () => null;
      } catch (_) {
        context.snapshot = { selection: [] };
        context.domainProvider = () => null;
      }
      document.querySelectorAll('[data-navigation-cue]').forEach(cue => {
        const direction = cue.dataset.navigationCue;
        const key = `Arrow${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
        let available = false;
        try { available = window.dashboardTabNavigation.resolveDashboardArrowAction(key, context).outcome === 'changed'; } catch (_) { available = false; }
        cue.classList.toggle('is-available', available);
      });
    }

    function isActiveFilterChoice(button) {
      return button.getAttribute('aria-pressed') === 'true' || button.getAttribute('aria-selected') === 'true' ||
        button.getAttribute('aria-checked') === 'true' || button.classList.contains('bg-indigo-600');
    }

    document.addEventListener('keydown', handleDashboardArrowKeydown, true);
    document.addEventListener('input', invalidateDashboardFilterEvent, true);
    document.addEventListener('click', invalidateDashboardFilterEvent, true);
    ['pointerdown', 'click', 'change', 'focusout', 'keydown'].forEach(type => document.addEventListener(type, trackNativeSelectInteraction, true));
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
      initializeDashboardFilterAdapters();
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
      advanceDashboardRevision(true);
      visualizationAvailabilityByTab = window.visualizationAvailability.getVisualizationAvailability(processedActivities, {
        fitBestEffortsByActivityId,
        gpsTracksByActivityId,
        mediaLibrary: importedDataset && importedDataset.mediaLibrary,
        sourceLabel: importedDataset && importedDataset.sourceLabel
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
      window.dashboardTooltips?.invalidate();
      const nextTab = window.dashboardTabNavigation.setVisualizationTab(tabName, {
        ...options,
        availableTabs: availableVisualizationTabs
      });
      if (nextTab) {
        if (selectedVisualizationTab === 'wordcloud' && nextTab !== 'wordcloud' && window.wordcloudDashboard) {
          window.wordcloudDashboard.cancelPendingRender();
        }
        advanceDashboardRevision();
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
        } else if (nextTab === 'mediaGallery') {
          window.mediaGalleryDashboard.render(importedDataset && importedDataset.mediaLibrary);
        }
        ensureVisualizationTabVisible(nextTab);
        updateNavigationCueAvailability();
      }
    }

    function handleVisualizationTabKeydown(event, currentTab) {
      if (event.key !== 'Tab') return;
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
      if (window.wordcloudDashboard) window.wordcloudDashboard.cancelPendingRender();
      advanceDashboardRevision();
      nativeSelectSession = null;
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
