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

    function setVisualizationTab(tabName, options = {}) {
      const nextTab = window.dashboardTabNavigation.setVisualizationTab(tabName, options);
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
        }
        ensureVisualizationTabVisible(nextTab);
      }
    }

    function handleVisualizationTabKeydown(event, currentTab) {
      const nextTab = window.dashboardTabNavigation.handleVisualizationTabKeydown(event, currentTab, {
        onTabChange: setVisualizationTab
      });

      if (nextTab) {
        selectedVisualizationTab = nextTab;
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
      setVisualizationTab(tabName);
      const tabButton = document.getElementById(
        tabName === 'totalDistance' ? 'vizTabTotalDistance' :
        tabName === 'paceMetrics' ? 'vizTabPaceMetrics' :
        tabName === 'equipment' ? 'vizTabEquipment' :
        tabName === 'equipmentTimeline' ? 'vizTabEquipmentTimeline' :
        tabName === 'heatmap' ? 'vizTabHeatmap' :
        tabName === 'distributions' ? 'vizTabDistributions' :
        tabName === 'workoutTime' ? 'vizTabWorkoutTime' :
        tabName === 'trainingCalendar' ? 'vizTabTrainingCalendar' :
        tabName === 'wordcloud' ? 'vizTabWordcloud' :
        'vizTabPersonalBests'
      );
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
